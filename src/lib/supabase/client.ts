import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigWarning = !supabaseUrl || !supabasePublishableKey
  ? "Supabase environment variables are missing. Using mock data."
  : null;

export const supabase = supabaseConfigWarning
  ? null
  : createClient(supabaseUrl as string, supabasePublishableKey as string);
