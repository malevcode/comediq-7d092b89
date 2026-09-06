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
  const action = typeof body?.action === "string" ? body.action : "";
  const repository = Deno.env.get("IG_API_GITHUB_REPOSITORY") || "malevcode/comediq-ig-api";
  const ref = Deno.env.get("IG_API_REF") || "main";

  if (action === "send_mics") {
    const dryRun = body?.dry_run !== false;
    const batchSize = Number.isInteger(body?.batch_size) && Number(body.batch_size) > 0
      ? String(body.batch_size)
      : "50";
    const workflow = Deno.env.get("IG_MONTHLY_SEND_WORKFLOW") || "send_monthly_mic_verification.yaml";

    return dispatchWorkflow({
      githubToken,
      repository,
      ref,
      workflow,
      inputs: {
        source: "supabase",
        table: "open_mics_historical",
        active_only: "true",
        dry_run: String(dryRun),
        batch_size: batchSize,
      },
      action,
    });
  }

  if (action === "collect_responses") {
    const amount = Number.isInteger(body?.amount) ? Number(body.amount) : 300;
    if (amount < 1 || amount > 1000) {
      return json({ error: "amount must be between 1 and 1000" }, 400);
    }

    const workflow = Deno.env.get("IG_MONTHLY_COLLECT_WORKFLOW") || "collect_monthly_mic_verification.yaml";
    return dispatchWorkflow({
      githubToken,
      repository,
      ref,
      workflow,
      inputs: {
        amount: String(amount),
        missing_only: String(body?.missing_only !== false),
        dry_run: String(body?.dry_run === true),
      },
      action,
    });
  }

  return json({ error: "Unsupported monthly verification action" }, 400);
});

async function dispatchWorkflow({
  githubToken,
  repository,
  ref,
  workflow,
  inputs,
  action,
}: {
  githubToken: string;
  repository: string;
  ref: string;
  workflow: string;
  inputs: Record<string, string>;
  action: string;
}) {
  const workflowUrl = `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`;
  const workflowPageUrl = `https://github.com/${repository}/actions/workflows/${workflow}`;

  const dispatchResponse = await fetch(workflowUrl, {
    method: "POST",
    headers: githubHeaders(githubToken),
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
    const detail = getGitHubFailureDetail(responseBody);
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
    action,
    dispatched: true,
    repository,
    ref,
    workflow,
    workflowUrl: workflowPageUrl,
    inputs,
  });
}

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

function githubHeaders(githubToken: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubToken}`,
    "Content-Type": "application/json",
    "User-Agent": "comediq-admin-instagram-monthly-verification",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

function getGitHubFailureDetail(body: unknown) {
  if (!body || typeof body !== "object") return "";
  const upstream = body as { error?: unknown; message?: unknown; };
  if (typeof upstream.message === "string") return upstream.message;
  if (typeof upstream.error === "string") return upstream.error;
  return "";
}
