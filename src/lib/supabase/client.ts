import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type SupabaseConfigIssue = "missing_env" | "invalid_url" | null;

function isValidSupabaseUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export const missingSupabaseEnvVars = [
  supabaseUrl ? null : "NEXT_PUBLIC_SUPABASE_URL",
  supabasePublishableKey ? null : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
].filter(Boolean) as string[];

const hasInvalidSupabaseUrl = Boolean(supabaseUrl) && !isValidSupabaseUrl(supabaseUrl);

export const supabaseConfigIssue: SupabaseConfigIssue = missingSupabaseEnvVars.length > 0
  ? "missing_env"
  : hasInvalidSupabaseUrl
    ? "invalid_url"
    : null;

export const supabaseConfigWarning = missingSupabaseEnvVars.length > 0
  ? "Missing Supabase environment variables: " + missingSupabaseEnvVars.join(", ")
  : hasInvalidSupabaseUrl
    ? "Invalid Supabase URL in NEXT_PUBLIC_SUPABASE_URL: " + supabaseUrl
  : null;

export const supabase = supabaseConfigIssue
  ? null
  : createClient(supabaseUrl as string, supabasePublishableKey as string, {
      auth: {
        detectSessionInUrl: false,
      },
    });
