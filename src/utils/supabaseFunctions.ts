import { supabase } from '@/integrations/supabase/client';

type InvokeOptions = {
  body?: unknown;
  headers?: Record<string, string>;
};

type InvokeResult<T> = {
  data: T | null;
  error: Error | null;
};

const getResponseErrorMessage = async (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context;

    if (context && typeof context === 'object' && 'json' in context && typeof context.json === 'function') {
      try {
        const body = await (context as Response).clone().json();
        if (body && typeof body.error === 'string') return body.error;
      } catch {
        // Fall through to text/error parsing.
      }
    }

    if (context && typeof context === 'object' && 'text' in context && typeof context.text === 'function') {
      try {
        const text = await (context as Response).clone().text();
        if (text) return text;
      } catch {
        // Fall through to error parsing.
      }
    }
  }

  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }

  return fallback;
};

const localFunctionsUrl = (() => {
  const url = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined;
  return url?.replace(/\/$/, '') || '';
})();

export async function invokeSupabaseFunction<T = unknown>(
  name: string,
  options: InvokeOptions = {},
): Promise<InvokeResult<T>> {
  if (!localFunctionsUrl) {
    const { data, error } = await supabase.functions.invoke<T>(name, options);
    if (!error) return { data, error: null };

    return {
      data,
      error: new Error(await getResponseErrorMessage(error, `Function ${name} failed`)),
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const bearerToken = sessionData.session?.access_token ?? anonKey;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (anonKey) headers.apikey = anonKey;
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

  try {
    const response = await fetch(`${localFunctionsUrl}/${name}`, {
      method: 'POST',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) as T : null;

    if (!response.ok) {
      const message = data && typeof data === 'object' && 'error' in data
        ? String((data as { error?: unknown }).error)
        : `Function ${name} failed`;
      return { data, error: new Error(message) };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(`Function ${name} failed`),
    };
  }
}
