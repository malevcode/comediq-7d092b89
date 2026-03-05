import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawText } = await req.json();
    if (!rawText || typeof rawText !== 'string') {
      return new Response(JSON.stringify({ error: 'rawText is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a data parsing assistant for a comedy open mic database. You receive unstructured messages from venue owners or hosts about schedule changes, and you extract structured update operations.

Each operation should be one of:
- update_time: Change the start time of an existing mic
- update_cost: Change the cost/cover of an existing mic
- update_stage_time: Change the stage time of an existing mic
- add_new: Add a brand new mic that doesn't exist yet
- deactivate: Remove/cancel an existing mic
- update_other: Any other field change (end time, host, rules, etc.)

For time values, always use 12-hour format with AM/PM (e.g., "4:30 PM", "9:00 PM").
For days, use full day names (e.g., "Monday", "Tuesday").

Extract ALL changes mentioned in the message. Be thorough — don't miss any.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse the following message into structured update operations:\n\n${rawText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_updates",
              description: "Extract structured mic update operations from the message",
              parameters: {
                type: "object",
                properties: {
                  updates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: {
                          type: "string",
                          enum: ["update_time", "update_cost", "update_stage_time", "add_new", "deactivate", "update_other"],
                          description: "The type of update operation"
                        },
                        venue_name: { type: "string", description: "Name of the venue" },
                        day: { type: "string", description: "Day of the week (e.g., Monday)" },
                        old_start_time: { type: "string", description: "Previous start time (for updates)" },
                        new_start_time: { type: "string", description: "New start time" },
                        old_cost: { type: "string", description: "Previous cost (for cost updates)" },
                        new_cost: { type: "string", description: "New cost" },
                        stage_time: { type: "string", description: "Stage time (e.g., '6 minutes')" },
                        open_mic_name: { type: "string", description: "Name of the open mic if mentioned" },
                        latest_end_time: { type: "string", description: "End time if mentioned" },
                        host: { type: "string", description: "Host name if mentioned" },
                        other_details: { type: "string", description: "Any other relevant details" },
                        field_name: { type: "string", description: "For update_other: which field is being changed" },
                        old_value: { type: "string", description: "For update_other: the old value" },
                        new_value: { type: "string", description: "For update_other: the new value" }
                      },
                      required: ["action", "venue_name", "day"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["updates"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_updates" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ updates: parsed.updates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error("parse-mic-updates error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
