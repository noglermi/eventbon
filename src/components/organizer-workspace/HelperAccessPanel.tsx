"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import QRCode from "qrcode";
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
  const [label, setLabel] = useState("");
  const [station, setStation] = useState("");
  const [invitations, setInvitations] = useState<HelperInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const [qrInvitation, setQrInvitation] = useState<HelperInvitation | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const origin = useMemo(() => getOrigin(), []);

  function describeHelperError(context: string, error: unknown) {
    if (error && typeof error === "object" && ("code" in error || "message" in error || "hint" in error || "details" in error)) {
      return logSupabaseError(context, error);
    }

    return context + ": " + (error instanceof Error ? error.message : String(error));
  }

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
          setErrorDetails(describeHelperError("load helper invitations", error));
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

  useEffect(() => {
    if (!copiedTarget) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedTarget(null);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedTarget]);

  useEffect(() => {
    let isActive = true;

    async function generateQrCode() {
      if (!qrInvitation) {
        setQrCodeDataUrl(null);
        return;
      }

      setQrCodeDataUrl(null);
      const link = origin + "/helper?code=" + encodeURIComponent(qrInvitation.code);
      const dataUrl = await QRCode.toDataURL(link, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 260,
      });

      if (isActive) {
        setQrCodeDataUrl(dataUrl);
      }
    }

    generateQrCode();

    return () => {
      isActive = false;
    };
  }, [origin, qrInvitation]);

  async function createAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!eventId) {
      setErrorMessage(labels.helperAccessError);
      return;
    }

    const trimmedLabel = label.trim();
    const trimmedStation = station.trim();
    setIsCreating(true);
    setMessage(null);
    setErrorMessage(null);
    setErrorDetails(null);

    try {
      const invitation = await createHelperInvitation({ eventId, label: trimmedLabel, station: trimmedStation });
      setInvitations((current) => [invitation, ...current]);
      setLabel("");
      setStation("");
    } catch (error) {
      setErrorMessage(labels.helperAccessError);
      setErrorDetails(describeHelperError("create helper invitation", error));
    } finally {
      setIsCreating(false);
    }
  }

  async function copyValue(value: string, target: string) {
    await navigator.clipboard.writeText(value);
    setCopiedTarget(target);
  }

  function helperLink(invitation: HelperInvitation) {
    return origin + "/helper?code=" + encodeURIComponent(invitation.code);
  }

  const helperPageUrl = origin + "/helper";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="helper-access-title">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200 p-6">
          <div>
            <h2 id="helper-access-title" className="text-3xl font-black tracking-tight">{labels.helperInviteTitle}</h2>
            <p className="mt-2 text-base font-bold text-slate-600">{eventName}</p>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{labels.helperInviteSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="min-h-12 rounded-lg bg-slate-100 px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
              {labels.backToEvent}
            </button>
            <button type="button" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl font-bold text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.closeAddTileDialog}>
              x
            </button>
          </div>
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
              {labels.helperLabel}
              <input name="label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder={labels.helperLabelPlaceholder} className="min-h-12 rounded-lg border border-slate-200 px-3 text-base font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>
            <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
              {labels.helperStationLabel}
              <input name="station" value={station} onChange={(event) => setStation(event.target.value)} placeholder={labels.helperStationPlaceholder} className="min-h-12 rounded-lg border border-slate-200 px-3 text-base font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
            </label>
            <button type="submit" disabled={!eventId || isCreating} className="self-end rounded-lg bg-emerald-600 px-5 py-3 text-base font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
              {isCreating ? labels.saving : labels.createHelperAccess}
            </button>
          </form>

          {isLoading ? (
            <p className="mt-5 rounded-lg bg-white px-4 py-3 text-sm font-black text-slate-600 ring-1 ring-slate-200">{labels.loadingEvents}</p>
          ) : null}

          <div className="mt-5 grid gap-3">
            {!isLoading && invitations.length === 0 ? (
              <p className="rounded-lg bg-white px-4 py-5 text-base font-black text-slate-600 ring-1 ring-slate-200">{labels.noHelperAccess}</p>
            ) : null}

            {invitations.map((invitation) => {
              const link = helperLink(invitation);
              return (
                <article key={invitation.id} className="grid gap-4 rounded-lg bg-white p-5 ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{invitation.label || labels.helpers}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-500">{labels.helperStationLabel}: {invitation.station || "-"}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-800">{labels.helperAccessCode}:</p>
                    <p className="mt-2 break-all text-2xl font-black tracking-widest text-emerald-950">{invitation.code}</p>
                  </div>

                  <p className="text-sm font-semibold leading-6 text-slate-600">{labels.helperCardExplanation}</p>

                  <div className="flex flex-wrap gap-2">
                    <div className="grid gap-1">
                      <button type="button" onClick={() => copyValue(invitation.code, invitation.id + "-code")} className="min-h-12 rounded-lg bg-slate-100 px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                        {labels.copyCode}
                      </button>
                      {copiedTarget === invitation.id + "-code" ? <span className="text-center text-xs font-black text-emerald-700">{labels.copied}</span> : null}
                    </div>
                    <div className="grid gap-1">
                      <button type="button" onClick={() => copyValue(link, invitation.id + "-link")} className="min-h-12 rounded-lg bg-slate-950 px-4 text-sm font-black text-white">
                        {labels.copyInvitationLink}
                      </button>
                      {copiedTarget === invitation.id + "-link" ? <span className="text-center text-xs font-black text-emerald-700">{labels.copied}</span> : null}
                    </div>
                    <button type="button" onClick={() => setQrInvitation(invitation)} className="min-h-12 rounded-lg bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                      {labels.showQrCode}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-sm font-black text-slate-700">{labels.helperPage}:</p>
            <p className="mt-1 break-all text-sm font-bold text-slate-600">{helperPageUrl}</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">{labels.helperPageHint}</p>
          </div>
        </div>
      </div>

      {qrInvitation ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-6" role="dialog" aria-modal="true" aria-labelledby="helper-qr-title">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="helper-qr-title" className="text-2xl font-black">{labels.showQrCode}</h3>
                <p className="mt-2 text-base font-black text-slate-700">{qrInvitation.label || labels.helpers}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{labels.helperStationLabel}: {qrInvitation.station || "-"}</p>
              </div>
              <button type="button" onClick={() => setQrInvitation(null)} className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-xl font-bold text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.closeQrCode}>
                x
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-center ring-1 ring-slate-200">
              {qrCodeDataUrl ? (
                <div
                  aria-label={labels.qrCodeAlt}
                  className="mx-auto h-64 w-64 rounded-lg bg-white bg-contain bg-center bg-no-repeat p-2"
                  role="img"
                  style={{ backgroundImage: "url(" + qrCodeDataUrl + ")" }}
                />
              ) : (
                <p className="flex h-64 items-center justify-center text-sm font-black text-slate-500">{labels.qrLoading}</p>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-800">{labels.helperAccessCode}:</p>
              <p className="mt-2 break-all text-2xl font-black tracking-widest text-emerald-950">{qrInvitation.code}</p>
            </div>

            <button type="button" onClick={() => setQrInvitation(null)} className="mt-5 min-h-12 w-full rounded-lg bg-slate-950 px-4 text-sm font-black text-white">
              {labels.closeQrCode}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
