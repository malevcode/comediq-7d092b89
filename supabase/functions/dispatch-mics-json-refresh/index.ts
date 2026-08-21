import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GITHUB_API_VERSION = "2022-11-28";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const expectedSecret = Deno.env.get("MICS_JSON_REFRESH_WEBHOOK_SECRET");
  if (!expectedSecret) {
    return json({ error: "MICS_JSON_REFRESH_WEBHOOK_SECRET is not configured" }, 500);
  }

  const providedSecret = req.headers.get("x-mics-refresh-secret");
  if (providedSecret !== expectedSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const githubToken = Deno.env.get("GITHUB_MICS_REFRESH_TOKEN");
  if (!githubToken) {
    return json({ error: "GITHUB_MICS_REFRESH_TOKEN is not configured" }, 500);
  }

  const repository = Deno.env.get("GITHUB_REPOSITORY") || "malevcode/comediq-7d092b89";
  const ref = Deno.env.get("MICS_JSON_REFRESH_REF") || "main";
  const payload = await readJson(req);

  const endpoint = `https://api.github.com/repos/${repository}/dispatches`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "comediq-mics-json-refresh",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    body: JSON.stringify({
      event_type: "supabase-mics-changed",
      client_payload: {
        ref,
        table: payload?.table ?? "open_mics_historical",
        type: payload?.type ?? payload?.eventType ?? "change",
        changed_at: new Date().toISOString(),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return json(
      {
        error: `GitHub repository dispatch failed for target ${repository} on ref ${ref}: GitHub status ${response.status}${body ? ` - ${getGitHubMessage(body)}` : ""}`,
        status: response.status,
        repository,
        ref,
        endpoint,
        body,
      },
      502,
    );
  }

  return json({ ok: true, dispatched: true, repository, ref });
});

async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getGitHubMessage(body: string) {
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed.message === "string") return parsed.message;
  } catch {
    // Fall through to the raw response body.
  }

  return body;
}
