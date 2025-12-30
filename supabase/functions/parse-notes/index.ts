import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return new Response(JSON.stringify({ shows: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Parsing notes with Lovable AI...", notes.substring(0, 200));

    const systemPrompt = `You are a comedy show parser. Extract structured performance data from unstructured notes.

For each performance mentioned, extract:
- date: ISO format (YYYY-MM-DD). For relative dates like "last Tuesday", calculate from today (${new Date().toISOString().split('T')[0]}). If year isn't specified, assume 2025.
- venue: The venue name (normalize common abbreviations)
- borough: Manhattan, Brooklyn, Queens, Bronx, Staten Island, or null if outside NYC
- stage_time_minutes: Number only, null if not mentioned
- notes: Any additional context (killed, bombed, got bumped, etc.)
- schedule_type: "completed" for past shows, "upcoming" for future dates

Common NYC venue mappings:
- "Cellar" or "Comedy Cellar" → Manhattan
- "The Stand" → Manhattan  
- "Creek" or "Creek and the Cave" → Queens
- "Eastville" → Manhattan
- "West Side" or "West Side Comedy Club" → Manhattan
- "Greenwich Village Comedy Club" or "GVCC" → Manhattan
- "New York Comedy Club" or "NYCC" → Manhattan
- "Broadway Comedy Club" → Manhattan
- "Gotham" or "Gotham Comedy Club" → Manhattan
- "Comic Strip Live" → Manhattan
- "Stand Up NY" → Manhattan
- "Carolines" → Manhattan
- "Village Underground" → Manhattan
- "Knitting Factory" → Brooklyn
- "Union Hall" → Brooklyn
- "Littlefield" → Brooklyn
- "Bell House" → Brooklyn
- "QED" → Queens

Parse ALL performances you can find. Be generous in interpretation - if it looks like a show entry, include it.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse the following comedy notes and extract all performances:\n\n${notes}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_shows",
              description: "Extract structured show data from comedy notes",
              parameters: {
                type: "object",
                properties: {
                  shows: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", description: "ISO date format YYYY-MM-DD" },
                        venue: { type: "string", description: "Venue name" },
                        borough: { type: "string", description: "NYC borough or null" },
                        stage_time_minutes: { type: "number", description: "Minutes on stage, null if unknown" },
                        notes: { type: "string", description: "Additional notes about the set" },
                        schedule_type: { type: "string", enum: ["completed", "upcoming"] }
                      },
                      required: ["date", "venue", "schedule_type"]
                    }
                  }
                },
                required: ["shows"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_shows" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_shows") {
      console.error("No valid tool call in response");
      return new Response(JSON.stringify({ shows: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsedShows = JSON.parse(toolCall.function.arguments);
    console.log("Parsed shows:", parsedShows);

    return new Response(JSON.stringify(parsedShows), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error parsing notes:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
