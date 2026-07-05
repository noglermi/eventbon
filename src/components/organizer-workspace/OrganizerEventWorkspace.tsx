"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createEvent, listEvents } from "@/lib/repositories/events";
import { getOrganizerForAuthenticatedUser, mockOrganizer } from "@/lib/repositories/organizers";
import { formatDate, formatDateRange } from "@/lib/date-format";
import { logSupabaseError } from "@/lib/supabase/diagnostics";
import { supabase, supabaseConfigWarning } from "@/lib/supabase/client";
import { SalesTerminal } from "@/components/sales-terminal/SalesTerminal";
import { LanguageSwitch } from "@/components/organizer-workspace/LanguageSwitch";
import { OrganizerSalesDashboard } from "@/components/organizer-workspace/OrganizerSalesDashboard";
import { defaultLanguage, translations } from "@/components/sales-terminal/i18n";
import type { Translation } from "@/components/sales-terminal/i18n";
import type { EventSettings, Language, PrintMode } from "@/components/sales-terminal/types";
import type { Event as PersistedEvent, Organizer } from "@/types/domain";
import type { Session } from "@supabase/supabase-js";

type BookedEventStatus = "preparation" | "active" | "stats_available" | "post_event_read_only" | "expired" | "archived" | "draft";

type BookedEvent = {
  id: string;
  organizerId: string | null;
  tenantId: string | null;
  settings: EventSettings;
  status: BookedEventStatus;
  accessUntil: string;
  isPersisted: boolean;
};

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function mapPersistedEvent(event: PersistedEvent): BookedEvent {
  return {
    id: event.id,
    organizerId: event.organizerId,
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

function getSessionOrganizerName(session: Session | null) {
  const metadataName = session?.user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  const email = session?.user.email;
  if (email) {
    return email.split("@")[0] || mockOrganizer.name;
  }

  return mockOrganizer.name;
}

function getFriendlyAuthError(error: unknown, labels: Translation) {
  if (!error || typeof error !== "object") {
    return labels.authGeneralError;
  }

  const fields = error as { code?: string; message?: string };
  const normalized = [fields.code, fields.message].filter(Boolean).join(" ").toLowerCase();

  if (normalized.includes("email_not_confirmed") || normalized.includes("email not confirmed") || normalized.includes("not confirmed")) {
    return labels.unconfirmedEmail;
  }

  if (normalized.includes("invalid_credentials") || normalized.includes("invalid login credentials") || normalized.includes("invalid credentials")) {
    return labels.invalidLogin;
  }

  return labels.authGeneralError;
}

function DatePickerField({
  describedBy,
  invalid,
  label,
  language,
  max,
  min,
  name,
  onChange,
  placeholder,
  required = false,
  value,
}: {
  describedBy?: string;
  invalid?: boolean;
  label: string;
  language: Language;
  max?: string;
  min?: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const visibleValue = value ? formatDate(value, language) : placeholder;

  function openDatePicker() {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  return (
    <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
      {label}
      <span className={"relative block rounded-lg focus-within:ring-4 " + (invalid ? "focus-within:ring-rose-100" : "focus-within:ring-emerald-100")}>
        <button
          type="button"
          onClick={openDatePicker}
          className={"flex min-h-14 w-full items-center rounded-lg border px-4 text-left text-xl font-bold normal-case tracking-normal outline-none ring-offset-0 " + (invalid ? "border-rose-400 bg-rose-50 text-rose-950" : "border-slate-200 bg-white text-slate-950")}
        >
          {visibleValue}
        </button>
        <input
          ref={inputRef}
          name={name}
          type="date"
          required={required}
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="pointer-events-none absolute left-4 top-1/2 h-px w-px -translate-y-1/2 opacity-0"
        />
      </span>
    </label>
  );
}

export function OrganizerEventWorkspace() {
  const [organizerLanguage, setOrganizerLanguage] = useState<Language>(defaultLanguage);
  const language = organizerLanguage;
  const labels = translations[language];
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(!supabaseConfigWarning);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(supabaseConfigWarning);
  const [authErrorDetails, setAuthErrorDetails] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [currentOrganizer, setCurrentOrganizer] = useState<Organizer>(mockOrganizer);
  const [events, setEvents] = useState<BookedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<BookedEvent | null>(null);
  const [dashboardEvent, setDashboardEvent] = useState<BookedEvent | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEventDateFrom, setNewEventDateFrom] = useState("");
  const [newEventDateTo, setNewEventDateTo] = useState("");
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const isNewEventDateInvalid = Boolean(newEventDateFrom && newEventDateTo && newEventDateTo < newEventDateFrom);

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
    if (!supabase) {
      return undefined;
    }

    let isActive = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isActive) {
        return;
      }

      if (error) {
        const diagnostic = logSupabaseError("load auth session", error);
        setAuthError(labels.authGeneralError);
        setAuthErrorDetails(diagnostic);
      }

      setSession(data.session);
      setIsAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSelectedEvent(null);
      setDashboardEvent(null);
      if (!nextSession) {
        setEvents([]);
        setCurrentOrganizer(mockOrganizer);
      }
    });

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, [labels.authGeneralError]);

  useEffect(() => {
    let isActive = true;

    async function loadEvents() {
      if (!session || supabaseConfigWarning) {
        return;
      }

      setIsLoadingEvents(true);
      setEventError(null);

      try {
        const email = session.user.email;
        if (!email) {
          throw new Error("Authenticated organizer has no email address.");
        }

        const organizer = await getOrganizerForAuthenticatedUser({
          email,
          name: getSessionOrganizerName(session),
          userId: session.user.id,
        });

        if (!isActive) {
          return;
        }

        setCurrentOrganizer(organizer);
        const loadedEvents = await listEvents({ organizerId: organizer.id });
        setEvents(loadedEvents.map(mapPersistedEvent));
      } catch (error) {
        if (isActive) {
          const diagnostic = logSupabaseError("load events", error);
          setEvents([]);
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
  }, [labels.eventLoadError, labels.supabaseDiagnosticPrefix, session]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setAuthError(supabaseConfigWarning);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim() || mockOrganizer.name;

    setAuthError(null);
    setAuthErrorDetails(null);
    setAuthMessage(null);
    setIsAuthSubmitting(true);

    try {
      if (authMode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          setAuthMessage(labels.registrationReady);
          setSession(data.session);
        } else {
          setAuthMessage(labels.registrationConfirmation);
          setAuthMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          throw error;
        }

        setSession(data.session);
      }
    } catch (error) {
      const diagnostic = logSupabaseError("organizer auth", error);
      setAuthError(getFriendlyAuthError(error, labels));
      setAuthErrorDetails(diagnostic);
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function logout() {
    if (!supabase) {
      return;
    }

    setAuthError(null);
    setAuthErrorDetails(null);
    setAuthMessage(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      const diagnostic = logSupabaseError("organizer logout", error);
      setAuthError(labels.authGeneralError);
      setAuthErrorDetails(diagnostic);
    }
  }

  async function createBookedEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim() || labels.newVoucher;
    const dateFrom = String(formData.get("dateFrom") ?? "");
    const dateToEntry = String(formData.get("dateTo") ?? "");
    const dateTo = dateToEntry || dateFrom;
    const printMode = String(formData.get("printMode") ?? "single_vouchers") as PrintMode;

    if (dateTo < dateFrom) {
      return;
    }

    try {
      if (!supabaseConfigWarning) {
        const persistedEvent = await createEvent({ name, organizerId: currentOrganizer.id, startsAt: dateFrom, endsAt: dateTo, printMode });

        if (persistedEvent) {
          const bookedEvent = mapPersistedEvent(persistedEvent);

          setEvents((current) => [...current, bookedEvent]);
          setIsCreateOpen(false);
          setNewEventDateFrom("");
          setNewEventDateTo("");
          setSelectedEvent(bookedEvent);
          return;
        }
      }
    } catch (error) {
      const diagnostic = logSupabaseError("create event", error);
      setEventError(labels.saveError + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
    }

    const bookedEvent: BookedEvent = {
      id: "event-" + Date.now().toString(),
      organizerId: currentOrganizer.id,
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
    setNewEventDateFrom("");
    setNewEventDateTo("");
    setSelectedEvent(bookedEvent);
  }

  if (isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f5] p-6 text-slate-950">
        <p className="rounded-lg bg-white px-5 py-4 text-lg font-black text-slate-700 ring-1 ring-slate-200">{labels.authLoading}</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f5] p-6 text-slate-950">
        <section className="w-full max-w-xl rounded-lg bg-white p-7 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-4">
            <p className="text-2xl font-black tracking-normal text-emerald-600">eventBon</p>
            <LanguageSwitch language={language} labels={labels} onLanguageChange={setOrganizerLanguage} />
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight">{labels.authTitle}</h1>
          <p className="mt-2 text-lg font-semibold text-slate-600">{labels.authRequiredIntro}</p>

          {authError ? (
            <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
              <p>{authError}</p>
              {authErrorDetails ? (
                <details className="mt-3 text-xs font-semibold text-amber-950">
                  <summary className="cursor-pointer font-black">{labels.technicalDetails}</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-white/70 p-3 font-mono text-[11px] leading-relaxed">{authErrorDetails}</pre>
                </details>
              ) : null}
            </div>
          ) : null}
          {authMessage ? (
            <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 ring-1 ring-emerald-200">{authMessage}</p>
          ) : null}

          <form onSubmit={submitAuth} className="mt-6 grid gap-5">
            {authMode === "register" ? (
              <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                {labels.name}
                <input name="name" defaultValue={mockOrganizer.name} className="min-h-14 rounded-lg border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
              {labels.email}
              <input name="email" type="email" required defaultValue={authMode === "register" ? mockOrganizer.email : undefined} className="min-h-14 rounded-lg border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>

            <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
              {labels.password}
              <input name="password" type="password" required minLength={6} className="min-h-14 rounded-lg border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>

            <button type="submit" disabled={Boolean(supabaseConfigWarning) || isAuthSubmitting} className="min-h-14 rounded-lg bg-emerald-600 px-6 text-lg font-black text-white shadow-sm shadow-emerald-700/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
              {isAuthSubmitting ? labels.saving : authMode === "register" ? labels.register : labels.login}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setAuthMode((current) => current === "login" ? "register" : "login");
              setAuthError(supabaseConfigWarning);
              setAuthErrorDetails(null);
              setAuthMessage(null);
            }}
            className="mt-5 min-h-12 w-full rounded-lg bg-slate-100 px-5 text-base font-black text-slate-700 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            {authMode === "login" ? labels.switchToRegistration : labels.alreadyRegistered}
          </button>
        </section>
      </main>
    );
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

  if (dashboardEvent) {
    return (
      <OrganizerSalesDashboard
        eventId={dashboardEvent.isPersisted ? dashboardEvent.id : null}
        eventSettings={dashboardEvent.settings}
        language={language}
        onLanguageChange={setOrganizerLanguage}
        tenantId={dashboardEvent.tenantId}
        onBackToEvents={() => setDashboardEvent(null)}
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
            <p className="mt-2 text-base font-black text-slate-700">{currentOrganizer.name}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <LanguageSwitch language={language} labels={labels} onLanguageChange={setOrganizerLanguage} />
            <button
              type="button"
              onClick={logout}
              className="min-h-14 rounded-lg bg-slate-100 px-5 text-lg font-black text-slate-700 ring-1 ring-slate-200 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              {labels.logout}
            </button>
            <button
              type="button"
              onClick={() => {
                setNewEventDateFrom("");
                setNewEventDateTo("");
                setIsCreateOpen(true);
              }}
              className="min-h-14 rounded-lg bg-emerald-600 px-6 text-lg font-black text-white shadow-sm shadow-emerald-700/20 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              + {labels.bookNewEvent}
            </button>
          </div>
        </header>

        {authMessage ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 ring-1 ring-emerald-200">{authMessage}</p>
        ) : null}

        {eventError ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">{eventError}</p>
        ) : null}

        {isLoadingEvents ? (
          <p className="rounded-lg bg-white px-4 py-3 text-base font-black text-slate-600 ring-1 ring-slate-200">{labels.loadingEvents}</p>
        ) : null}

        {!isLoadingEvents && events.length === 0 ? (
          <p className="rounded-lg bg-white px-4 py-6 text-lg font-black text-slate-600 ring-1 ring-slate-200">{labels.noEventsYet}</p>
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
                <p className="mt-2 text-base font-bold text-slate-600">{formatDateRange(bookedEvent.settings, language)}</p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="font-bold uppercase tracking-widest text-slate-500">{labels.eventStatus}</dt>
                  <dd className="mt-1 text-lg font-black text-slate-900">{statusLabels[bookedEvent.status]}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="font-bold uppercase tracking-widest text-slate-500">{labels.accessUntil}</dt>
                  <dd className="mt-1 text-lg font-black text-slate-900">{formatDate(bookedEvent.accessUntil, language)}</dd>
                </div>
              </dl>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(bookedEvent)}
                  className="min-h-14 rounded-lg bg-slate-950 px-5 text-lg font-black text-white transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
                >
                  {labels.openEvent}
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardEvent(bookedEvent)}
                  className="min-h-14 rounded-lg bg-white px-5 text-lg font-black text-slate-800 ring-1 ring-slate-300 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  {labels.statistics}
                </button>
              </div>
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
                <DatePickerField
                  label={labels.eventDateFrom}
                  language={language}
                  name="dateFrom"
                  required
                  value={newEventDateFrom}
                  invalid={isNewEventDateInvalid}
                  placeholder={labels.chooseDate}
                  onChange={setNewEventDateFrom}
                />
                <DatePickerField
                  label={labels.eventDateTo}
                  language={language}
                  name="dateTo"
                  value={newEventDateTo}
                  invalid={isNewEventDateInvalid}
                  describedBy={isNewEventDateInvalid ? "new-event-date-error" : undefined}
                  placeholder={labels.chooseDate}
                  onChange={setNewEventDateTo}
                />
              </div>
              {isNewEventDateInvalid ? (
                <p id="new-event-date-error" className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-black text-rose-800 ring-1 ring-rose-200">{labels.eventEndBeforeStart}</p>
              ) : null}

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
                <button type="submit" disabled={isNewEventDateInvalid} className="min-h-14 rounded-lg bg-emerald-600 px-6 text-lg font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">{labels.openEvent}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
