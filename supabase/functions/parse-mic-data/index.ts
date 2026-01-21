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
    const { text, images } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if ((!text || text.trim().length === 0) && (!images || images.length === 0)) {
      return new Response(JSON.stringify({ mics: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Parsing mic data with Lovable AI...", text?.substring(0, 200) || "Images provided");

    const systemPrompt = `You are an open mic schedule parser. Extract structured open mic data from text or images of flyers/posters.

For each open mic mentioned, extract:
- open_mic: The name of the open mic (e.g., "Comedy Night at Joe's")
- venue_name: The venue hosting the mic
- day: Day of week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
- start_time: Start time in 12-hour format (e.g., "8:00 PM")
- latest_end_time: End time if mentioned (e.g., "10:00 PM")
- borough: Manhattan, Brooklyn, Queens, Bronx, Staten Island (leave empty if outside NYC or unknown)
- neighborhood: Specific neighborhood (e.g., "East Village", "Williamsburg")
- location: Full street address if available
- venue_type: bar, comedy club, cafe, restaurant, theater, other
- cost: Free, $5, 1-drink minimum, etc.
- stage_time: Duration per performer (e.g., "5 minutes", "3-5 minutes")
- sign_up_instructions: How to sign up (e.g., "Sign up at 7pm", "DM @handle", "List at the bar")
- hosts: Who hosts/runs it
- instagram_handle: Instagram handle if mentioned (without @)
- notes: Any other relevant info

NYC venue mappings to help with borough identification:
- Comedy Cellar, The Stand, Eastville, West Side Comedy Club, GVCC, NYCC, Broadway Comedy Club, Gotham, Comic Strip Live, Stand Up NY, Carolines, Village Underground → Manhattan
- Knitting Factory, Union Hall, Littlefield, Bell House → Brooklyn
- Creek and the Cave, QED → Queens

Be generous in interpretation - extract partial data when available. If you see a schedule with multiple nights, create separate entries for each.`;

    // Build the messages array
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    // Build user content - can include both text and images
    const userContent: any[] = [];

    if (images && images.length > 0) {
      for (const imageBase64 of images) {
        userContent.push({
          type: "image_url",
          image_url: { url: imageBase64 }
        });
      }
      userContent.push({
        type: "text",
        text: text 
          ? `Extract all open mic information from these images and/or text:\n\n${text}`
          : "Extract all open mic information from these images."
      });
    } else {
      userContent.push({
        type: "text",
        text: `Parse the following open mic schedule data and extract all mics:\n\n${text}`
      });
    }

    messages.push({ role: "user", content: userContent });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "extract_mics",
              description: "Extract structured open mic data from text or images",
              parameters: {
                type: "object",
                properties: {
                  mics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        open_mic: { type: "string", description: "Name of the open mic" },
                        venue_name: { type: "string", description: "Venue name" },
                        day: { type: "string", description: "Day of week" },
                        start_time: { type: "string", description: "Start time (e.g., 8:00 PM)" },
                        latest_end_time: { type: "string", description: "End time if known" },
                        borough: { type: "string", description: "NYC borough" },
                        neighborhood: { type: "string", description: "Neighborhood" },
                        location: { type: "string", description: "Full address" },
                        venue_type: { type: "string", description: "Type of venue" },
                        cost: { type: "string", description: "Cost to perform" },
                        stage_time: { type: "string", description: "Minutes on stage" },
                        sign_up_instructions: { type: "string", description: "How to sign up" },
                        hosts: { type: "string", description: "Host name(s)" },
                        instagram_handle: { type: "string", description: "Instagram handle" },
                        notes: { type: "string", description: "Additional notes" }
                      },
                      required: ["open_mic", "venue_name"]
                    }
                  }
                },
                required: ["mics"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_mics" } }
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
    if (!toolCall || toolCall.function.name !== "extract_mics") {
      console.error("No valid tool call in response");
      return new Response(JSON.stringify({ mics: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsedMics = JSON.parse(toolCall.function.arguments);
    console.log("Parsed mics:", parsedMics);

    return new Response(JSON.stringify(parsedMics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error parsing mic data:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
