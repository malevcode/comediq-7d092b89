import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GITHUB_API_VERSION = "2022-11-28";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const githubToken = Deno.env.get("GITHUB_MICS_REFRESH_TOKEN");

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Supabase environment is not configured" }, 500);
  }

  if (!githubToken) {
    return json({ error: "GITHUB_MICS_REFRESH_TOKEN is not configured" }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authorization },
    },
  });

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userId = userResult.user.id;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("isadmin")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId),
  ]);

  const isAdmin = profile?.isadmin === true
    || (roles ?? []).some((row: { role?: string }) => row.role === "admin");

  if (!isAdmin) {
    return json({ error: "Forbidden" }, 403);
  }

  const repository = Deno.env.get("GITHUB_REPOSITORY") || "malevcode/comediq-7d092b89";
  const ref = Deno.env.get("MICS_JSON_REFRESH_REF") || "main";
  const workflow = Deno.env.get("MICS_JSON_REFRESH_WORKFLOW") || "refresh_mics_json.yaml";
  const workflowUrl = `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`;

  const dispatchResponse = await fetch(workflowUrl, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "comediq-admin-mics-json-refresh",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    body: JSON.stringify({ ref }),
  });

  const bodyText = await dispatchResponse.text();
  let body: unknown = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    body = bodyText;
  }

  if (!dispatchResponse.ok) {
    const detail = getDispatchFailureDetail(body);
    return json(
      {
        error: detail
          ? `GitHub workflow dispatch failed: ${detail}`
          : "GitHub workflow dispatch failed",
        status: dispatchResponse.status,
        body,
      },
      502,
    );
  }

  return json({
    ok: true,
    dispatched: true,
    repository,
    ref,
    workflow,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getDispatchFailureDetail(body: unknown) {
  if (!body || typeof body !== "object") return "";

  const upstream = body as {
    error?: unknown;
    status?: unknown;
    body?: unknown;
    message?: unknown;
  };

  const parts: string[] = [];
  if (typeof upstream.status === "number" || typeof upstream.status === "string") {
    parts.push(`GitHub status ${upstream.status}`);
  }

  if (typeof upstream.message === "string") {
    parts.push(upstream.message);
  } else if (typeof upstream.body === "string") {
    try {
      const parsed = JSON.parse(upstream.body);
      if (parsed && typeof parsed.message === "string") {
        parts.push(parsed.message);
      } else if (upstream.body.trim()) {
        parts.push(upstream.body);
      }
    } catch {
      if (upstream.body.trim()) parts.push(upstream.body);
    }
  } else if (upstream.body && typeof upstream.body === "object" && "message" in upstream.body) {
    const message = (upstream.body as { message?: unknown }).message;
    if (typeof message === "string") parts.push(message);
  }

  if (parts.length === 0 && typeof upstream.error === "string") {
    parts.push(upstream.error);
  }

  return parts.join(" - ");
}
