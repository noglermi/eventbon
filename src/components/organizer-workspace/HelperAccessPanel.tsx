"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createHelperInvitation, listHelperInvitations } from "@/lib/repositories/helpers";
import { logSupabaseError } from "@/lib/supabase/diagnostics";
import type { Translation } from "@/components/sales-terminal/i18n";
import type { Language } from "@/components/sales-terminal/types";
import type { HelperInvitation } from "@/types/domain";

type HelperAccessPanelProps = {
  eventId: string | null;
  eventName: string;
  labels: Translation;
  language: Language;
  onClose: () => void;
};

function getOrigin() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.origin;
}

export function HelperAccessPanel({ eventId, eventName, labels, onClose }: HelperAccessPanelProps) {
  const [invitations, setInvitations] = useState<HelperInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const origin = useMemo(() => getOrigin(), []);

  useEffect(() => {
    let isActive = true;

    async function loadInvitations() {
      if (!eventId) {
        setInvitations([]);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setErrorDetails(null);

      try {
        const loaded = await listHelperInvitations(eventId);
        if (isActive) {
          setInvitations(loaded);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(labels.helperAccessError);
          setErrorDetails(logSupabaseError("load helper invitations", error));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadInvitations();

    return () => {
      isActive = false;
    };
  }, [eventId, labels.helperAccessError]);

  async function createAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!eventId) {
      setErrorMessage(labels.helperAccessError);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const label = String(formData.get("label") ?? "").trim();
    const station = String(formData.get("station") ?? "").trim();
    setIsCreating(true);
    setMessage(null);
    setErrorMessage(null);
    setErrorDetails(null);

    try {
      const invitation = await createHelperInvitation({ eventId, label, station });
      setInvitations((current) => [invitation, ...current]);
      event.currentTarget.reset();
    } catch (error) {
      setErrorMessage(labels.helperAccessError);
      setErrorDetails(logSupabaseError("create helper invitation", error));
    } finally {
      setIsCreating(false);
    }
  }

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage(labels.copied);
  }

  function helperLink(invitation: HelperInvitation) {
    return origin + "/helper?code=" + encodeURIComponent(invitation.code);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="helper-access-title">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-5 border-b border-slate-200 p-6">
          <div>
            <h2 id="helper-access-title" className="text-3xl font-black tracking-tight">{labels.helpers}</h2>
            <p className="mt-2 text-base font-bold text-slate-600">{eventName}</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">{labels.helperAccessIntro}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl font-bold text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.closeAddTileDialog}>
            x
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {message ? (
            <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 ring-1 ring-emerald-200">{message}</p>
          ) : null}

          {errorMessage ? (
            <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
              <p>{errorMessage}</p>
              {errorDetails ? (
                <details className="mt-3 text-xs font-semibold text-amber-950">
                  <summary className="cursor-pointer font-black">{labels.technicalDetails}</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-white/70 p-3 font-mono text-[11px] leading-relaxed">{errorDetails}</pre>
                </details>
              ) : null}
            </div>
          ) : null}

          <form onSubmit={createAccess} className="grid gap-4 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200 md:grid-cols-[1fr_1fr_auto]">
            <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
              {labels.helperOptionalLabel}
              <input name="label" className="min-h-12 rounded-lg border border-slate-200 px-3 text-base font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>
            <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
              {labels.helperStation}
              <input name="station" placeholder="Getranke, Speisen" className="min-h-12 rounded-lg border border-slate-200 px-3 text-base font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>
            <button type="submit" disabled={!eventId || isCreating} className="self-end rounded-lg bg-emerald-600 px-5 py-3 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
              {isCreating ? labels.saving : labels.createHelperAccess}
            </button>
          </form>

          {isLoading ? (
            <p className="mt-5 rounded-lg bg-white px-4 py-3 text-sm font-black text-slate-600 ring-1 ring-slate-200">{labels.loadingEvents}</p>
          ) : null}

          <div className="mt-5 grid gap-3">
            {invitations.map((invitation) => {
              const link = helperLink(invitation);
              return (
                <article key={invitation.id} className="grid gap-3 rounded-lg bg-white p-4 ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{invitation.label || labels.helpers}</h3>
                      {invitation.station ? <p className="text-sm font-bold text-slate-500">{invitation.station}</p> : null}
                    </div>
                    <span className="rounded-lg bg-emerald-50 px-3 py-2 text-base font-black tracking-widest text-emerald-800 ring-1 ring-emerald-100">{invitation.code}</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                    <input readOnly value={link} className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700" aria-label={labels.helperAccessLink} />
                    <button type="button" onClick={() => copyValue(invitation.code)} className="min-h-12 rounded-lg bg-slate-100 px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                      {labels.copy} {labels.helperAccessCode}
                    </button>
                    <button type="button" onClick={() => copyValue(link)} className="min-h-12 rounded-lg bg-slate-950 px-4 text-sm font-black text-white">
                      {labels.copy} {labels.helperAccessLink}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
