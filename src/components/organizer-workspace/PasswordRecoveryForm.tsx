"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LanguageSwitch } from "@/components/organizer-workspace/LanguageSwitch";
import { defaultLanguage, translations } from "@/components/sales-terminal/i18n";
import type { Language } from "@/components/sales-terminal/types";
import { supabase, supabaseConfigWarning } from "@/lib/supabase/client";
import { logSupabaseError } from "@/lib/supabase/diagnostics";

type RecoveryParameters = {
  accessToken: string | null;
  code: string | null;
  refreshToken: string | null;
  tokenHash: string | null;
  type: string | null;
};

function readRecoveryParameters(): RecoveryParameters {
  if (typeof window === "undefined") {
    return {
      accessToken: null,
      code: null,
      refreshToken: null,
      tokenHash: null,
      type: null,
    };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return {
    accessToken: searchParams.get("access_token") ?? hashParams.get("access_token"),
    code: searchParams.get("code") ?? hashParams.get("code"),
    refreshToken: searchParams.get("refresh_token") ?? hashParams.get("refresh_token"),
    tokenHash: searchParams.get("token_hash") ?? hashParams.get("token_hash"),
    type: searchParams.get("type") ?? hashParams.get("type"),
  };
}

export function hasPasswordRecoveryParameters() {
  if (typeof window === "undefined") {
    return false;
  }

  const { accessToken, code, refreshToken, tokenHash, type } = readRecoveryParameters();

  return type === "recovery" || Boolean(accessToken) || Boolean(refreshToken) || Boolean(tokenHash) || (type === "recovery" && Boolean(code));
}

export function PasswordRecoveryForm() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [developerDetails, setDeveloperDetails] = useState<string | null>(null);
  const labels = translations[language];

  useEffect(() => {
    let isActive = true;

    async function prepareRecoverySession() {
      if (!supabase) {
        setErrorMessage(labels.passwordRecoveryError);
        setDeveloperDetails(supabaseConfigWarning ?? "Supabase client is not configured.");
        return;
      }

      setErrorMessage(null);
      setDeveloperDetails(null);

      const { accessToken, code, refreshToken, tokenHash, type } = readRecoveryParameters();

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (error) {
            throw error;
          }
        } else if (type === "recovery" && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!isActive) {
          return;
        }

        if (!data.session) {
          setErrorMessage(type === "recovery" ? labels.passwordRecoveryLoading : labels.passwordRecoveryError);
          return;
        }

        setIsRecoveryReady(true);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(labels.passwordRecoveryError);
        setDeveloperDetails(logSupabaseError("prepare password recovery session", error));
      }
    }

    prepareRecoverySession();

    const { data: authListener } = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setErrorMessage(null);
        setIsRecoveryReady(true);
      }
    }) ?? { data: null };

    return () => {
      isActive = false;
      authListener?.subscription.unsubscribe();
    };
  }, [labels.passwordRecoveryError, labels.passwordRecoveryLoading]);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    setDeveloperDetails(null);

    if (password !== repeatPassword) {
      setErrorMessage(labels.passwordMismatch);
      return;
    }

    if (!supabase) {
      setErrorMessage(labels.passwordUpdateError);
      setDeveloperDetails(supabaseConfigWarning ?? "Supabase client is not configured.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMessage(labels.passwordUpdateError);
        setDeveloperDetails(logSupabaseError("update reset password", error));
        return;
      }

      setPassword("");
      setRepeatPassword("");
      setMessage(labels.passwordUpdated);
    } catch (error) {
      setErrorMessage(labels.passwordUpdateError);
      setDeveloperDetails(logSupabaseError("update reset password exception", error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function returnToLogin() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 text-slate-950 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center">
        <div className="w-full rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-3xl font-black tracking-tight text-emerald-600">eventBon</p>
            <LanguageSwitch language={language} labels={labels} onLanguageChange={setLanguage} />
          </div>

          <div className="mb-6 space-y-2">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{labels.resetPassword}</h1>
            <p className="text-base font-semibold text-slate-600">{labels.resetPasswordUpdateIntro}</p>
          </div>

          {message ? (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-bold text-emerald-900">
              {message}
            </div>
          ) : null}

          {errorMessage && errorMessage !== labels.passwordRecoveryLoading ? (
            <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-base font-bold text-amber-950">
              <p>{errorMessage}</p>
              {developerDetails ? (
                <details className="mt-3 text-sm font-semibold text-amber-900">
                  <summary className="cursor-pointer">{labels.technicalDetails}</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/80 p-3 font-mono text-xs">
                    {developerDetails}
                  </pre>
                </details>
              ) : null}
            </div>
          ) : null}

          {!message && (!isRecoveryReady || errorMessage === labels.passwordRecoveryLoading) ? (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-700">
              {labels.passwordRecoveryLoading}
            </div>
          ) : null}

          {!message && isRecoveryReady ? (
            <form className="space-y-5" onSubmit={submitPassword}>
              <label className="block">
                <span className="mb-2 block text-sm font-black uppercase tracking-wide text-slate-600">{labels.newPassword}</span>
                <input
                  className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  type="password"
                  value={password}
                  minLength={6}
                  autoComplete="new-password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black uppercase tracking-wide text-slate-600">{labels.repeatPassword}</span>
                <input
                  className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  type="password"
                  value={repeatPassword}
                  minLength={6}
                  autoComplete="new-password"
                  onChange={(event) => setRepeatPassword(event.target.value)}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-14 w-full rounded-xl bg-emerald-600 px-5 text-lg font-black text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {isSubmitting ? labels.saving : labels.savePassword}
              </button>
            </form>
          ) : null}

          {message ? (
            <button
              type="button"
              onClick={returnToLogin}
              className="min-h-14 w-full rounded-xl bg-emerald-600 px-5 text-lg font-black text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              {labels.toLogin}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
