import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_TOKEN_LIMIT = 10000;

const SYSTEM_PROMPT = `You are Comediq AI, the assistant for Comediq — NYC's open mic comedy database.

You help comedians with two things:
1. Finding open mics: search by venue, day, neighborhood, borough, cost, or any combination. Always call search_open_mics before answering questions about specific mics.
2. Reporting changes: when a user says a mic closed, changed times, changed cost, or a new mic exists, call submit_change_request to log it for admin review. Always confirm you submitted it.

Be concise. No markdown formatting. Plain text only. If search returns no results, say so and suggest they double-check the name or try a different day.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_open_mics",
      description: "Search the Comediq open mics database. Call this before answering any question about specific mics.",
      parameters: {
        type: "object",
        properties: {
          venue_name: { type: "string", description: "Venue or mic name (partial match ok)" },
          day: { type: "string", description: "Day of week, e.g. Monday" },
          borough: { type: "string", description: "NYC borough: Manhattan, Brooklyn, Queens, Bronx, Staten Island" },
          neighborhood: { type: "string", description: "Neighborhood name" },
          free_only: { type: "boolean", description: "Only return free mics" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_change_request",
      description: "Submit a mic schedule change, closure, or new mic for admin review.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["add_new", "update", "deactivate"],
            description: "Type of change: add_new = new mic, update = schedule/cost/detail change, deactivate = mic closed",
          },
          venue_name: { type: "string", description: "Venue name" },
          day: { type: "string", description: "Day of week" },
          details: {
            type: "object",
            description: "Change details: new_time, old_time, new_cost, host, notes, etc.",
            additionalProperties: true,
          },
        },
        required: ["action", "venue_name", "details"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableKey) {
    return new Response(JSON.stringify({ error: "AI service not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check daily limit before doing anything
    const today = new Date().toISOString().split("T")[0];
    const { data: usageRow } = await supabase
      .from("ai_chat_usage")
      .select("tokens_used")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const tokensUsedToday = usageRow?.tokens_used ?? 0;
    if (tokensUsedToday >= DAILY_TOKEN_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "Daily limit reached. Come back tomorrow!",
          tokens_used: tokensUsedToday,
          tokens_remaining: 0,
          daily_limit: DAILY_TOKEN_LIMIT,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { message, history = [] } = await req.json();
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build message thread: last 10 history messages + new user message
    const messages: Array<{ role: string; content: unknown; tool_call_id?: string; tool_calls?: unknown[] }> = [
      ...history.slice(-10).filter((m: { role: string }) => m.role === "user" || m.role === "assistant"),
      { role: "user", content: message.trim() },
    ];

    let totalTokens = 0;
    let changeSubmitted = false;
    let finalReply = "Sorry, I couldn't generate a response. Please try again.";

    // Agentic loop — max 5 iterations to handle multi-tool calls
    for (let i = 0; i < 5; i++) {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          tools: TOOLS,
          tool_choice: "auto",
        }),
      });

      if (!aiRes.ok) {
        if (aiRes.status === 429) {
          return new Response(JSON.stringify({ error: "AI service rate limited. Please try again shortly." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await aiRes.text();
        console.error("AI gateway error:", aiRes.status, errText.slice(0, 200));
        throw new Error(`AI gateway error: ${aiRes.status}`);
      }

      const aiData = await aiRes.json();
      totalTokens += aiData.usage?.total_tokens ?? 0;

      const choice = aiData.choices?.[0];
      const assistantMsg = choice?.message;
      if (!assistantMsg) break;

      messages.push(assistantMsg);

      // No tool calls — we have the final answer
      if (!assistantMsg.tool_calls?.length) {
        finalReply = typeof assistantMsg.content === "string" ? assistantMsg.content : finalReply;
        break;
      }

      // Execute each tool call
      for (const toolCall of assistantMsg.tool_calls) {
        const toolName: string = toolCall.function.name;
        let toolArgs: Record<string, unknown>;
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = {};
        }

        let toolResult: string;

        if (toolName === "search_open_mics") {
          let query = supabase
            .from("open_mics_historical")
            .select(
              "open_mic, venue_name, location, borough, neighborhood, day, start_time, latest_end_time, cost, stage_time, signup_method, sign_up_instructions, hosts_organizers"
            )
            .eq("active", true)
            .limit(12);

          if (toolArgs.venue_name) {
            query = query.ilike("venue_name", `%${toolArgs.venue_name}%`);
          }
          if (toolArgs.day) {
            query = query.ilike("day", `%${toolArgs.day}%`);
          }
          if (toolArgs.borough) {
            query = query.ilike("borough", `%${toolArgs.borough}%`);
          }
          if (toolArgs.neighborhood) {
            query = query.ilike("neighborhood", `%${toolArgs.neighborhood}%`);
          }
          if (toolArgs.free_only) {
            query = query.or("cost.ilike.%free%,cost.ilike.%no cover%");
          }

          const { data: mics, error: dbError } = await query;
          if (dbError) {
            toolResult = JSON.stringify({ error: dbError.message });
          } else if (!mics?.length) {
            toolResult = JSON.stringify({ message: "No mics found matching those criteria.", results: [] });
          } else {
            toolResult = JSON.stringify({ count: mics.length, results: mics });
          }
        } else if (toolName === "submit_change_request") {
          const { error: insertError } = await supabase.from("ai_change_requests").insert({
            user_id: user.id,
            action: toolArgs.action as string,
            venue_name: toolArgs.venue_name as string | undefined,
            day: toolArgs.day as string | undefined,
            details: toolArgs.details ?? {},
            raw_message: message.trim(),
          });

          if (insertError) {
            toolResult = JSON.stringify({ success: false, error: insertError.message });
          } else {
            changeSubmitted = true;
            toolResult = JSON.stringify({ success: true, message: "Change request submitted for admin review." });
          }
        } else {
          toolResult = JSON.stringify({ error: "Unknown tool" });
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }
    }

    // Atomically increment usage
    const { data: newUsage } = await supabase.rpc("increment_ai_chat_usage", {
      p_user_id: user.id,
      p_tokens: totalTokens,
    });

    const updatedTokensUsed = newUsage?.[0]?.tokens_used_today ?? tokensUsedToday + totalTokens;
    const tokensRemaining = Math.max(0, DAILY_TOKEN_LIMIT - updatedTokensUsed);

    return new Response(
      JSON.stringify({
        reply: finalReply,
        tokens_used: totalTokens,
        tokens_remaining: tokensRemaining,
        daily_limit: DAILY_TOKEN_LIMIT,
        change_submitted: changeSubmitted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("comediq-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
