import type { EventSettings } from "@/components/sales-terminal/types";

export type EventLifecycle = "upcoming" | "active" | "completed";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

export function getTodayDateKey() {
  return toDateKey(new Date());
}

export function getEventLifecycle(settings: Pick<EventSettings, "dateFrom" | "dateTo">, today = getTodayDateKey()): EventLifecycle {
  const startsAt = settings.dateFrom;
  const endsAt = settings.dateTo || settings.dateFrom;

  if (today < startsAt) {
    return "upcoming";
  }

  if (today > endsAt) {
    return "completed";
  }

  return "active";
}

export function isEventSalesActive(settings: Pick<EventSettings, "dateFrom" | "dateTo">, today = getTodayDateKey()) {
  return getEventLifecycle(settings, today) === "active";
}
