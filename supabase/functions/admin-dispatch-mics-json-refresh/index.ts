import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const refreshSecret = Deno.env.get("MICS_JSON_REFRESH_WEBHOOK_SECRET");

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Supabase environment is not configured" }, 500);
  }

  if (!refreshSecret) {
    return json({ error: "MICS_JSON_REFRESH_WEBHOOK_SECRET is not configured" }, 500);
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

  const payload = await readJson(req);
  const dispatchResponse = await fetch(`${supabaseUrl}/functions/v1/dispatch-mics-json-refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mics-refresh-secret": refreshSecret,
    },
    body: JSON.stringify({
      type: "MANUAL_ADMIN_REFRESH",
      table: "open_mics_historical",
      source: payload?.source ?? "admin_dashboard",
      requested_by: userId,
    }),
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
          ? `GitHub refresh dispatch failed: ${detail}`
          : "GitHub refresh dispatch failed",
        status: dispatchResponse.status,
        body,
      },
      502,
    );
  }

  return json(body);
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

function getDispatchFailureDetail(body: unknown) {
  if (!body || typeof body !== "object") return "";

  const upstream = body as {
    error?: unknown;
    status?: unknown;
    body?: unknown;
  };

  const parts: string[] = [];
  if (typeof upstream.status === "number" || typeof upstream.status === "string") {
    parts.push(`GitHub status ${upstream.status}`);
  }

  if (typeof upstream.body === "string") {
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
