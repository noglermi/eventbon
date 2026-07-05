export type DateFormatLanguage = "de" | "en";

type DateInput = Date | string;

function getLocale(language: DateFormatLanguage) {
  return language === "de" ? "de-AT" : "en-US";
}

function parseDateInput(value: DateInput) {
  if (value instanceof Date) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + "T12:00:00");
  }

  return new Date(value);
}

export function formatDate(value: DateInput, language: DateFormatLanguage) {
  const date = parseDateInput(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (language === "de") {
    return new Intl.DateTimeFormat(getLocale(language), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat(getLocale(language), { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value: DateInput, language: DateFormatLanguage) {
  const date = parseDateInput(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (language === "de") {
    return new Intl.DateTimeFormat(getLocale(language), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateRange(input: { dateFrom: string; dateTo?: string }, language: DateFormatLanguage) {
  const from = parseDateInput(input.dateFrom);
  const to = input.dateTo ? parseDateInput(input.dateTo) : null;

  if (Number.isNaN(from.getTime())) {
    return "";
  }

  if (!to || input.dateFrom === input.dateTo || Number.isNaN(to.getTime())) {
    return formatDate(from, language);
  }

  return formatDate(from, language) + " - " + formatDate(to, language);
}
