import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const missingSupabaseEnvVars = [
  supabaseUrl ? null : "NEXT_PUBLIC_SUPABASE_URL",
  supabasePublishableKey ? null : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
].filter(Boolean) as string[];

export const supabaseConfigWarning = missingSupabaseEnvVars.length > 0
  ? "Missing Supabase environment variables: " + missingSupabaseEnvVars.join(", ")
  : null;

export const supabase = supabaseConfigWarning
  ? null
  : createClient(supabaseUrl as string, supabasePublishableKey as string, {
      auth: {
        detectSessionInUrl: false,
      },
    });
