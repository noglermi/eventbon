import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageProps = {
  children: ReactNode;
  intro?: string;
  title: string;
};

export function LegalPage({ children, intro, title }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f6f7f5] px-5 py-8 text-slate-950 sm:px-7 lg:px-10">
      <div className="mx-auto grid max-w-4xl gap-6">
        <header className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <Link href="/" className="text-2xl font-black tracking-normal text-emerald-600">
            eventBon
          </Link>
          <p className="mt-4 text-sm font-black uppercase tracking-widest text-amber-700">Windows Pilot</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
          {intro ? <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600">{intro}</p> : null}
        </header>

        <div className="grid gap-5">{children}</div>

        <footer className="flex flex-wrap gap-4 border-t border-slate-200 pt-5 text-sm font-bold text-slate-600">
          <Link href="/" className="text-emerald-700 hover:text-emerald-900">
            Organizer Login
          </Link>
          <Link href="/problem-melden" className="text-emerald-700 hover:text-emerald-900">
            Problem melden
          </Link>
          <Link href="/impressum" className="text-emerald-700 hover:text-emerald-900">
            Impressum
          </Link>
          <Link href="/datenschutz" className="text-emerald-700 hover:text-emerald-900">
            Datenschutz
          </Link>
          <Link href="/nutzungsbedingungen" className="text-emerald-700 hover:text-emerald-900">
            Nutzungsbedingungen
          </Link>
        </footer>
      </div>
    </main>
  );
}

export function InfoSection({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
      {title ? <h2 className="text-2xl font-black tracking-tight text-slate-950">{title}</h2> : null}
      <div className={title ? "mt-4 grid gap-4 text-base font-semibold leading-7 text-slate-700" : "grid gap-4 text-base font-semibold leading-7 text-slate-700"}>
        {children}
      </div>
    </section>
  );
}

export function NoticeBox({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-lg bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-950 ring-1 ring-amber-200">
      {children}
    </section>
  );
}
