type SupabaseLikeError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
  name?: string;
  status?: number;
};

export type SupabaseErrorCategory =
  | "invalid_credentials"
  | "network"
  | "permission_denied"
  | "table_missing"
  | "too_many_attempts"
  | "unconfirmed_email"
  | "unknown";

function getErrorFields(error: unknown): SupabaseLikeError {
  if (error && typeof error === "object") {
    return error as SupabaseLikeError;
  }

  return { message: String(error) };
}

export function formatSupabaseError(context: string, error: unknown) {
  const fields = getErrorFields(error);
  const message = fields.message ?? "Unknown Supabase error";
  const parts = [
    context,
    fields.name ? "name=" + fields.name : null,
    fields.code ? "code=" + fields.code : null,
    fields.status ? "status=" + fields.status : null,
    "message=" + message,
    fields.details ? "details=" + fields.details : null,
    fields.hint ? "hint=" + fields.hint : null,
  ].filter(Boolean);
  const technicalMessage = parts.join(" | ");
  const category = {
    invalid_credentials: "Supabase invalid credentials",
    network: "Supabase network error",
    permission_denied: "Supabase permission denied / RLS policy issue",
    table_missing: "Supabase table does not exist",
    too_many_attempts: "Supabase too many attempts",
    unconfirmed_email: "Supabase email not confirmed",
    unknown: "Supabase error",
  }[getSupabaseErrorCategory(error)];

  return category + ": " + technicalMessage;
}

export function logSupabaseError(context: string, error: unknown) {
  const diagnostic = formatSupabaseError(context, error);
  console.error(diagnostic, error);
  return diagnostic;
}

export function getSupabaseErrorCategory(error: unknown): SupabaseErrorCategory {
  const fields = getErrorFields(error);
  const technicalMessage = [
    fields.name,
    fields.code,
    fields.status,
    fields.message,
    fields.details,
    fields.hint,
  ].filter(Boolean).join(" ").toLowerCase();

  if (technicalMessage.includes("email_not_confirmed") || technicalMessage.includes("email not confirmed") || technicalMessage.includes("not confirmed")) {
    return "unconfirmed_email";
  }

  if (technicalMessage.includes("invalid_credentials") || technicalMessage.includes("invalid login credentials") || technicalMessage.includes("invalid credentials")) {
    return "invalid_credentials";
  }

  if (fields.status === 429 || technicalMessage.includes("too many") || technicalMessage.includes("rate limit") || technicalMessage.includes("rate_limit")) {
    return "too_many_attempts";
  }

  if (fields.code === "42P01" || technicalMessage.includes("does not exist") || technicalMessage.includes("schema cache")) {
    return "table_missing";
  }

  if (fields.code === "42501" || fields.status === 401 || fields.status === 403 || technicalMessage.includes("permission denied") || technicalMessage.includes("row-level security") || technicalMessage.includes("rls")) {
    return "permission_denied";
  }

  if (
    fields.status === 0 ||
    technicalMessage.includes("failed to fetch") ||
    technicalMessage.includes("fetch failed") ||
    technicalMessage.includes("networkerror") ||
    technicalMessage.includes("network error") ||
    technicalMessage.includes("authretryablefetcherror") ||
    technicalMessage.includes("typeerror")
  ) {
    return "network";
  }

  return "unknown";
}
