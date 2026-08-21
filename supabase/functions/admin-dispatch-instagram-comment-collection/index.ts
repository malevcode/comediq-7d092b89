import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GITHUB_API_VERSION = "2022-11-28";
const MEDIA_ID_RE = /^\d{5,}(?:_\d+)?$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const githubToken = Deno.env.get("GITHUB_IG_API_TOKEN");

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Supabase environment is not configured" }, 500);
  }

  if (!githubToken) {
    return json({ error: "GITHUB_IG_API_TOKEN is not configured" }, 500);
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

  const body = await readJson(req);
  const mediaId = typeof body?.media_id === "string" ? body.media_id.trim() : "";

  if (!MEDIA_ID_RE.test(mediaId)) {
    return json({ error: "media_id must be a valid Instagram Graph API media ID" }, 400);
  }

  const repository = Deno.env.get("IG_API_GITHUB_REPOSITORY") || "malevcode/comediq-ig-api";
  const ref = Deno.env.get("IG_API_REF") || "main";
  const workflow = Deno.env.get("IG_COMMENT_COLLECTION_WORKFLOW") || "collect_instagram_comments.yaml";
  const workflowUrl = `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`;
  const workflowPageUrl = `https://github.com/${repository}/actions/workflows/${workflow}`;
  const inputs = { media_id: mediaId };

  const dispatchResponse = await fetch(workflowUrl, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "comediq-admin-instagram-comment-collection",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    body: JSON.stringify({ ref, inputs }),
  });

  const bodyText = await dispatchResponse.text();
  let responseBody: unknown = {};
  try {
    responseBody = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    responseBody = bodyText;
  }

  if (!dispatchResponse.ok) {
    const detail = getDispatchFailureDetail(responseBody);
    const target = `target ${repository}/${workflow} on ref ${ref}`;
    return json(
      {
        error: detail
          ? `GitHub workflow dispatch failed for ${target}: ${detail}`
          : `GitHub workflow dispatch failed for ${target}`,
        status: dispatchResponse.status,
        repository,
        ref,
        workflow,
        endpoint: workflowUrl,
        body: responseBody,
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
    workflowUrl: workflowPageUrl,
    inputs,
  });
});

async function readJson(req: Request) {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  } catch {
    return null;
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
