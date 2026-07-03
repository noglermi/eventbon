type SupabaseLikeError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
  status?: number;
};

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
    fields.code ? "code=" + fields.code : null,
    fields.status ? "status=" + fields.status : null,
    "message=" + message,
    fields.details ? "details=" + fields.details : null,
    fields.hint ? "hint=" + fields.hint : null,
  ].filter(Boolean);
  const technicalMessage = parts.join(" | ");
  const lowerMessage = technicalMessage.toLowerCase();

  let category = "Supabase error";
  if (fields.code === "42P01" || lowerMessage.includes("does not exist") || lowerMessage.includes("schema cache")) {
    category = "Supabase table does not exist";
  } else if (fields.code === "42501" || fields.status === 401 || fields.status === 403 || lowerMessage.includes("permission denied") || lowerMessage.includes("row-level security") || lowerMessage.includes("rls")) {
    category = "Supabase permission denied / RLS policy issue";
  } else if (lowerMessage.includes("failed to fetch") || lowerMessage.includes("networkerror") || lowerMessage.includes("network error") || lowerMessage.includes("fetch failed")) {
    category = "Supabase network error";
  }

  return category + ": " + technicalMessage;
}

export function logSupabaseError(context: string, error: unknown) {
  const diagnostic = formatSupabaseError(context, error);
  console.error(diagnostic, error);
  return diagnostic;
}
