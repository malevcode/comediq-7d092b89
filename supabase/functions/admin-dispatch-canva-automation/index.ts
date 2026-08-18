import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GITHUB_API_VERSION = "2022-11-28";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

const WORKFLOWS = {
  "generate_motd_post.yaml": {
    requiredInput: "date",
    pattern: DATE_RE,
  },
  "generate_motw_posts.yaml": {
    requiredInput: "week",
    pattern: DATE_RE,
  },
  "generate_monthly_open_mics_list_posts.yaml": {
    requiredInput: "month",
    pattern: MONTH_RE,
  },
} as const;

type WorkflowName = keyof typeof WORKFLOWS;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const githubToken = Deno.env.get("GITHUB_CANVA_AUTOMATION_TOKEN");

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Supabase environment is not configured" }, 500);
  }

  if (!githubToken) {
    return json({ error: "GITHUB_CANVA_AUTOMATION_TOKEN is not configured" }, 500);
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
  if (!body || typeof body !== "object") {
    return json({ error: "Invalid request body" }, 400);
  }

  const workflow = (body as { workflow?: unknown }).workflow;
  if (!isWorkflowName(workflow)) {
    return json({ error: "Unsupported Canva automation workflow" }, 400);
  }

  const inputs = (body as { inputs?: unknown }).inputs;
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) {
    return json({ error: "Workflow inputs are required" }, 400);
  }

  const workflowConfig = WORKFLOWS[workflow];
  const inputValue = (inputs as Record<string, unknown>)[workflowConfig.requiredInput];
  if (typeof inputValue !== "string" || !workflowConfig.pattern.test(inputValue)) {
    return json(
      { error: `${workflowConfig.requiredInput} must match ${workflowConfig.pattern === DATE_RE ? "YYYY-MM-DD" : "YYYY-MM"}` },
      400,
    );
  }
  const dispatchInputs = { [workflowConfig.requiredInput]: inputValue };

  const repository = Deno.env.get("CANVA_AUTOMATION_GITHUB_REPOSITORY") || "xq675/comediq-canva-automation";
  const ref = Deno.env.get("CANVA_AUTOMATION_REF") || "main";
  const workflowUrl = `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`;
  const workflowPageUrl = `https://github.com/${repository}/actions/workflows/${workflow}`;
  const generatedLinks = getGeneratedLinks(repository, ref, workflow, dispatchInputs);

  const dispatchResponse = await fetch(workflowUrl, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "comediq-admin-canva-automation",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    body: JSON.stringify({ ref, inputs: dispatchInputs }),
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
    return json(
      {
        error: detail
          ? `GitHub Canva automation dispatch failed: ${detail}`
          : "GitHub Canva automation dispatch failed",
        status: dispatchResponse.status,
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
    generatedLinks,
    inputs: dispatchInputs,
  });
});

async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function isWorkflowName(value: unknown): value is WorkflowName {
  return typeof value === "string" && value in WORKFLOWS;
}

function getGeneratedLinks(
  repository: string,
  ref: string,
  workflow: WorkflowName,
  inputs: Record<string, string>,
) {
  const tree = (path: string) => `https://github.com/${repository}/tree/${encodeURIComponent(ref)}/${encodePath(path)}`;

  if (workflow === "generate_motd_post.yaml") {
    const date = inputs.date;
    return [
      { label: "MOTD blue/cream assets", url: tree(`motd-posts/${date}-blue-cream`) },
      { label: "MOTD gradient assets", url: tree(`motd-posts/${date}-gradient`) },
    ];
  }

  if (workflow === "generate_motw_posts.yaml") {
    const week = inputs.week;
    return [
      { label: "MOTW blue/cream assets", url: tree(`motw-posts/${week}-blue-cream`) },
      { label: "MOTW gradient assets", url: tree(`motw-posts/${week}-gradient`) },
    ];
  }

  const month = inputs.month;
  return [
    { label: "Monthly open mics list blue/cream assets", url: tree(`monthly-open-mics-list/${month}-blue-cream`) },
    { label: "Monthly open mics list gradient assets", url: tree(`monthly-open-mics-list/${month}-gradient`) },
  ];
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
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
