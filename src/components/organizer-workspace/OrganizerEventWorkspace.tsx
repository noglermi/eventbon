"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createEvent, listEvents } from "@/lib/repositories/events";
import { logSupabaseError } from "@/lib/supabase/diagnostics";
import { supabaseConfigWarning } from "@/lib/supabase/client";
import { SalesTerminal } from "@/components/sales-terminal/SalesTerminal";
import { defaultLanguage, translations } from "@/components/sales-terminal/i18n";
import type { EventSettings, PrintMode } from "@/components/sales-terminal/types";
import type { Event as PersistedEvent } from "@/types/domain";

type BookedEventStatus = "preparation" | "active" | "stats_available" | "post_event_read_only" | "expired" | "archived" | "draft";

type BookedEvent = {
  id: string;
  tenantId: string | null;
  settings: EventSettings;
  status: BookedEventStatus;
  accessUntil: string;
  isPersisted: boolean;
};

const mockBookedEvents: BookedEvent[] = [
  {
    id: "reitturnier-2026",
    tenantId: null,
    settings: {
      name: { de: "Reitturnier 2026", en: "Riding Tournament 2026" },
      dateFrom: "2026-07-28",
      dateTo: "2026-07-30",
      printMode: "single_vouchers",
    },
    status: "preparation",
    accessUntil: "2026-08-06",
    isPersisted: false,
  },
  {
    id: "sommerfest-oberperfuss",
    tenantId: null,
    settings: {
      name: { de: "Sommerfest Oberperfuss", en: "Oberperfuss Summer Fest" },
      dateFrom: "2026-08-15",
      dateTo: "2026-08-15",
      printMode: "combined_voucher",
    },
    status: "active",
    accessUntil: "2026-08-22",
    isPersisted: false,
  },
];

function formatDateRange(event: EventSettings) {
  const formatter = new Intl.DateTimeFormat("de-AT", { dateStyle: "medium" });
  const from = new Date(event.dateFrom + "T12:00:00");
  const to = new Date(event.dateTo + "T12:00:00");

  if (Number.isNaN(from.getTime())) {
    return "";
  }

  if (!event.dateTo || event.dateFrom === event.dateTo || Number.isNaN(to.getTime())) {
    return formatter.format(from);
  }

  return formatter.format(from) + " - " + formatter.format(to);
}

function formatDate(value: string) {
  const date = new Date(value + "T12:00:00");
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("de-AT", { dateStyle: "medium" }).format(date);
}

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function mapPersistedEvent(event: PersistedEvent): BookedEvent {
  return {
    id: event.id,
    tenantId: event.tenantId,
    settings: {
      name: { de: event.name, en: event.name },
      dateFrom: toDateInput(event.startsAt),
      dateTo: toDateInput(event.endsAt),
      printMode: event.printMode,
    },
    status: event.status as BookedEventStatus,
    accessUntil: toDateInput(event.accessUntil),
    isPersisted: true,
  };
}

export function OrganizerEventWorkspace() {
  const language = defaultLanguage;
  const labels = translations[language];
  const [events, setEvents] = useState<BookedEvent[]>(mockBookedEvents);
  const [selectedEvent, setSelectedEvent] = useState<BookedEvent | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventError, setEventError] = useState<string | null>(supabaseConfigWarning ? labels.mockFallbackWarning + " " + supabaseConfigWarning : null);

  const statusLabels: Record<BookedEventStatus, string> = {
    draft: labels.statusPreparation,
    preparation: labels.statusPreparation,
    active: labels.statusActive,
    stats_available: labels.statusStatsAvailable,
    post_event_read_only: labels.statusStatsAvailable,
    expired: labels.statusExpired,
    archived: labels.statusExpired,
  };

  useEffect(() => {
    let isActive = true;

    async function loadEvents() {
      if (supabaseConfigWarning) {
        console.warn(labels.supabaseDiagnosticPrefix + ": " + supabaseConfigWarning);
        return;
      }

      setIsLoadingEvents(true);
      setEventError(null);

      try {
        const loadedEvents = await listEvents();
        if (isActive) {
          setEvents(loadedEvents.map(mapPersistedEvent));
        }
      } catch (error) {
        if (isActive) {
          const diagnostic = logSupabaseError("load events", error);
          setEvents(mockBookedEvents);
          setEventError(labels.eventLoadError + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
        }
      } finally {
        if (isActive) {
          setIsLoadingEvents(false);
        }
      }
    }

    loadEvents();

    return () => {
      isActive = false;
    };
  }, [labels.eventLoadError, labels.supabaseDiagnosticPrefix]);

  async function createBookedEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim() || labels.newVoucher;
    const dateFrom = String(formData.get("dateFrom") ?? "");
    const dateToEntry = String(formData.get("dateTo") ?? "");
    const dateTo = dateToEntry || dateFrom;
    const printMode = String(formData.get("printMode") ?? "single_vouchers") as PrintMode;

    try {
      if (!supabaseConfigWarning) {
        const persistedEvent = await createEvent({ name, startsAt: dateFrom, endsAt: dateTo, printMode });
        const bookedEvent = mapPersistedEvent(persistedEvent);

        setEvents((current) => [...current, bookedEvent]);
        setIsCreateOpen(false);
        setSelectedEvent(bookedEvent);
        return;
      }
    } catch (error) {
      const diagnostic = logSupabaseError("create event", error);
      setEventError(labels.saveError + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
    }

    const bookedEvent: BookedEvent = {
      id: "event-" + Date.now().toString(),
      tenantId: null,
      settings: {
        name: { de: name, en: name },
        dateFrom,
        dateTo,
        printMode,
      },
      status: "preparation",
      accessUntil: dateTo || dateFrom,
      isPersisted: false,
    };

    setEvents((current) => [...current, bookedEvent]);
    setIsCreateOpen(false);
    setSelectedEvent(bookedEvent);
  }

  if (selectedEvent) {
    return (
      <SalesTerminal
        eventId={selectedEvent.isPersisted ? selectedEvent.id : null}
        tenantId={selectedEvent.tenantId}
        accessUntil={selectedEvent.accessUntil}
        status={selectedEvent.status}
        initialEventSettings={selectedEvent.settings}
        onBackToEvents={() => setSelectedEvent(null)}
        onEventUpdated={(updatedEvent) => {
          const bookedEvent = mapPersistedEvent(updatedEvent);
          setEvents((current) => current.map((event) => event.id === bookedEvent.id ? bookedEvent : event));
          setSelectedEvent(bookedEvent);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-6 py-7 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-7">
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 pb-6">
          <div>
            <p className="text-2xl font-black tracking-normal text-emerald-600">eventBon</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">{labels.myEvents}</h1>
            <p className="mt-2 text-lg font-semibold text-slate-600">{labels.organizerWorkspaceIntro}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="min-h-14 rounded-lg bg-emerald-600 px-6 text-lg font-black text-white shadow-sm shadow-emerald-700/20 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            + {labels.bookNewEvent}
          </button>
        </header>

        {eventError ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">{eventError}</p>
        ) : null}

        {isLoadingEvents ? (
          <p className="rounded-lg bg-white px-4 py-3 text-base font-black text-slate-600 ring-1 ring-slate-200">{labels.loadingEvents}</p>
        ) : null}

        {!isLoadingEvents && !eventError && events.length === 0 ? (
          <p className="rounded-lg bg-white px-4 py-6 text-lg font-black text-slate-600 ring-1 ring-slate-200">{labels.noEventsFound}</p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2" aria-label={labels.myEvents}>
          {events.map((bookedEvent) => (
            <article key={bookedEvent.id} className="grid gap-5 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-black tracking-tight">{bookedEvent.settings.name[language]}</h2>
                  <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-100">
                    {statusLabels[bookedEvent.status]}
                  </span>
                </div>
                <p className="mt-2 text-base font-bold text-slate-600">{formatDateRange(bookedEvent.settings)}</p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="font-bold uppercase tracking-widest text-slate-500">{labels.eventStatus}</dt>
                  <dd className="mt-1 text-lg font-black text-slate-900">{statusLabels[bookedEvent.status]}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="font-bold uppercase tracking-widest text-slate-500">{labels.accessUntil}</dt>
                  <dd className="mt-1 text-lg font-black text-slate-900">{formatDate(bookedEvent.accessUntil)}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => setSelectedEvent(bookedEvent)}
                className="min-h-14 rounded-lg bg-slate-950 px-5 text-lg font-black text-white transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
              >
                {labels.openEvent}
              </button>
            </article>
          ))}
        </section>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="new-event-title">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <h2 id="new-event-title" className="text-3xl font-black tracking-tight">{labels.bookNewEvent}</h2>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl font-bold text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.closeAddTileDialog}>
                x
              </button>
            </div>

            <form onSubmit={createBookedEvent} className="mt-6 grid gap-5">
              <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                {labels.eventName}
                <input name="name" required className="min-h-14 rounded-lg border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                  {labels.eventDateFrom}
                  <input name="dateFrom" type="date" required className="min-h-14 rounded-lg border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                </label>
                <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                  {labels.eventDateTo}
                  <input name="dateTo" type="date" className="min-h-14 rounded-lg border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                </label>
              </div>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.voucherPrinting}</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["single_vouchers", "combined_voucher"] as PrintMode[]).map((mode) => (
                    <label key={mode} className="block">
                      <input name="printMode" type="radio" value={mode} defaultChecked={mode === "single_vouchers"} className="peer sr-only" />
                      <span className="flex min-h-14 items-center justify-center rounded-lg bg-slate-50 px-4 text-lg font-black text-slate-600 ring-1 ring-slate-200 transition peer-checked:bg-emerald-600 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-200">
                        {mode === "single_vouchers" ? labels.singleVouchers : labels.combinedVoucher}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="min-h-14 rounded-lg bg-slate-100 px-6 text-lg font-black text-slate-700 transition hover:bg-slate-200">{labels.cancel}</button>
                <button type="submit" className="min-h-14 rounded-lg bg-emerald-600 px-6 text-lg font-black text-white transition hover:bg-emerald-700">{labels.openEvent}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
