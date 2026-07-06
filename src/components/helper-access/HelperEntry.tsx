"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getHelperInvitationByCode } from "@/lib/repositories/helpers";
import { logSupabaseError } from "@/lib/supabase/diagnostics";
import { LanguageSwitch } from "@/components/organizer-workspace/LanguageSwitch";
import { SalesTerminal } from "@/components/sales-terminal/SalesTerminal";
import { defaultLanguage, translations } from "@/components/sales-terminal/i18n";
import type { ActiveHelperSession, EventSettings, Language } from "@/components/sales-terminal/types";
import type { Event, HelperInvitation } from "@/types/domain";

type ActiveHelperEvent = {
  event: Event;
  invitation: HelperInvitation;
  helperName: string;
};

const helperSessionStorageKey = "eventbon.activeHelperSession";

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function toEventSettings(event: Event): EventSettings {
  return {
    name: { de: event.name, en: event.name },
    dateFrom: toDateInput(event.startsAt),
    dateTo: toDateInput(event.endsAt),
    printMode: event.printMode,
  };
}

function getInitialCode() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("code") ?? "";
}

function readStoredHelperEvent(): ActiveHelperEvent | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(helperSessionStorageKey);
    return rawValue ? JSON.parse(rawValue) as ActiveHelperEvent : null;
  } catch {
    return null;
  }
}

function writeStoredHelperEvent(value: ActiveHelperEvent) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(helperSessionStorageKey, JSON.stringify(value));
}

function toActiveHelperSession(value: ActiveHelperEvent): ActiveHelperSession {
  return {
    invitationId: value.invitation.id,
    helperName: value.helperName,
    station: value.invitation.station,
  };
}

export function HelperEntry() {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [accessCode, setAccessCode] = useState(() => getInitialCode().toUpperCase());
  const [helperName, setHelperName] = useState("");
  const [resolvedInvitation, setResolvedInvitation] = useState<{ event: Event; invitation: HelperInvitation } | null>(null);
  const [activeHelperEvent, setActiveHelperEvent] = useState<ActiveHelperEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const labels = translations[language];

  async function resolveCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setErrorDetails(null);

    try {
      const resolved = await getHelperInvitationByCode(normalizedCode);
      if (!resolved) {
        setResolvedInvitation(null);
        setErrorMessage(labels.helperInvalidCode);
        return;
      }

      setResolvedInvitation(resolved);
    } catch (error) {
      setResolvedInvitation(null);
      setErrorMessage(labels.helperAccessError);
      setErrorDetails(logSupabaseError("resolve helper invitation", error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const initialCode = getInitialCode();
    if (initialCode) {
      queueMicrotask(() => {
        resolveCode(initialCode);
      });
      return;
    }

    const storedHelperEvent = readStoredHelperEvent();
    if (storedHelperEvent) {
      queueMicrotask(() => {
        setActiveHelperEvent(storedHelperEvent);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await resolveCode(accessCode);
  }

  function startSelling(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolvedInvitation || !helperName.trim()) {
      return;
    }

    const nextActiveHelperEvent = {
      ...resolvedInvitation,
      helperName: helperName.trim(),
    };

    writeStoredHelperEvent(nextActiveHelperEvent);
    setActiveHelperEvent(nextActiveHelperEvent);
  }

  if (activeHelperEvent) {
    return (
      <SalesTerminal
        eventId={activeHelperEvent.event.id}
        tenantId={activeHelperEvent.event.tenantId}
        accessUntil={activeHelperEvent.event.accessUntil}
        status={activeHelperEvent.event.status}
        initialEventSettings={toEventSettings(activeHelperEvent.event)}
        activeHelperSession={toActiveHelperSession(activeHelperEvent)}
        isHelperMode
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f5] p-6 text-slate-950">
      <section className="w-full max-w-xl rounded-lg bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <p className="text-2xl font-black tracking-normal text-emerald-600">eventBon</p>
          <LanguageSwitch language={language} labels={labels} onLanguageChange={setLanguage} />
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight">{labels.helperEntryTitle}</h1>
        <p className="mt-2 text-lg font-semibold text-slate-600">{resolvedInvitation ? labels.helperNameIntro : labels.helperCodeIntro}</p>

        {errorMessage ? (
          <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
            <p>{errorMessage}</p>
            {errorDetails ? (
              <details className="mt-3 text-xs font-semibold text-amber-950">
                <summary className="cursor-pointer font-black">{labels.technicalDetails}</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-white/70 p-3 font-mono text-[11px] leading-relaxed">{errorDetails}</pre>
              </details>
            ) : null}
          </div>
        ) : null}

        {!resolvedInvitation ? (
          <form onSubmit={submitCode} className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
              {labels.helperAccessCode}
              <input
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                required
                className="min-h-14 rounded-lg border border-slate-200 px-4 text-xl font-bold uppercase tracking-widest text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <button type="submit" disabled={isLoading} className="min-h-14 rounded-lg bg-emerald-600 px-6 text-lg font-black text-white shadow-sm shadow-emerald-700/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
              {isLoading ? labels.loadingEvents : labels.openEvent}
            </button>
          </form>
        ) : (
          <form onSubmit={startSelling} className="mt-6 grid gap-5">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm font-bold text-emerald-950 ring-1 ring-emerald-100">
              <p className="text-lg font-black">{resolvedInvitation.event.name}</p>
              {resolvedInvitation.invitation.station ? <p className="mt-1">{resolvedInvitation.invitation.station}</p> : null}
            </div>
            <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
              {labels.helperName}
              <input
                value={helperName}
                onChange={(event) => setHelperName(event.target.value)}
                required
                autoFocus
                className="min-h-14 rounded-lg border border-slate-200 px-4 text-xl font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <button type="submit" className="min-h-14 rounded-lg bg-emerald-600 px-6 text-lg font-black text-white shadow-sm shadow-emerald-700/20 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
              {labels.startSelling}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
