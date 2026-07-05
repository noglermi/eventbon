"use client";

import { useEffect, useState } from "react";
import { getSalesAnalytics } from "@/lib/repositories/sales";
import type { SalesAnalyticsSummary } from "@/lib/repositories/sales";
import { logSupabaseError } from "@/lib/supabase/diagnostics";
import { supabaseConfigWarning } from "@/lib/supabase/client";
import { defaultLanguage, translations } from "@/components/sales-terminal/i18n";
import type { EventSettings, Language } from "@/components/sales-terminal/types";

type TimeFilter = "all" | "today";

type OrganizerSalesDashboardProps = {
  eventId: string | null;
  eventSettings: EventSettings;
  tenantId: string | null;
  onBackToEvents: () => void;
};

const emptySummary: SalesAnalyticsSummary = {
  totalRevenueCents: 0,
  saleCount: 0,
  voucherCount: 0,
  averageSaleCents: 0,
  paymentTotals: {
    cashCents: 0,
    cardCents: 0,
  },
  topProducts: [],
};

function formatCurrency(cents: number, language: Language) {
  return new Intl.NumberFormat(language === "de" ? "de-AT" : "en-US", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDateRange(event: EventSettings, language: Language) {
  const formatter = new Intl.DateTimeFormat(language === "de" ? "de-AT" : "en-US", { dateStyle: "medium" });
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

function getTodayRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  const to = new Date(from);
  to.setDate(to.getDate() + 1);

  return {
    createdFrom: from.toISOString(),
    createdTo: to.toISOString(),
  };
}

export function OrganizerSalesDashboard({ eventId, eventSettings, tenantId, onBackToEvents }: OrganizerSalesDashboardProps) {
  const language = defaultLanguage;
  const labels = translations[language];
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [summary, setSummary] = useState<SalesAnalyticsSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(supabaseConfigWarning);
  const eventName = eventSettings.name[language];

  useEffect(() => {
    let isActive = true;

    async function loadAnalytics() {
      if (!eventId || !tenantId || supabaseConfigWarning) {
        setSummary(emptySummary);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const todayRange = timeFilter === "today" ? getTodayRange() : {};
        const analytics = await getSalesAnalytics({
          eventId,
          tenantId,
          ...todayRange,
        });

        if (isActive) {
          setSummary(analytics);
        }
      } catch (error) {
        if (isActive) {
          const diagnostic = logSupabaseError("load organizer sales analytics", error);
          setSummary(emptySummary);
          setLoadError(labels.statisticsLoadError + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isActive = false;
    };
  }, [eventId, labels.statisticsLoadError, labels.supabaseDiagnosticPrefix, tenantId, timeFilter]);

  const overviewCards = [
    { label: labels.totalRevenue, value: formatCurrency(summary.totalRevenueCents, language) },
    { label: labels.salesCount, value: summary.saleCount.toLocaleString("de-AT") },
    { label: labels.voucherCount, value: summary.voucherCount.toLocaleString("de-AT") },
    { label: labels.averageSale, value: formatCurrency(summary.averageSaleCents, language) },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-6 py-7 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-7">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200 pb-6">
          <div>
            <p className="text-2xl font-black tracking-normal text-emerald-600">eventBon</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">{eventName}</h1>
            <p className="mt-2 text-lg font-semibold text-slate-600">{formatDateRange(eventSettings, language)}</p>
          </div>
          <button
            type="button"
            onClick={onBackToEvents}
            className="min-h-14 rounded-lg bg-slate-100 px-5 text-lg font-black text-slate-700 ring-1 ring-slate-200 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            {labels.backToEvents}
          </button>
        </header>

        <div className="flex flex-wrap gap-3">
          {([
            ["today", labels.today],
            ["all", labels.allTime],
          ] as Array<[TimeFilter, string]>).map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              onClick={() => setTimeFilter(filter)}
              className={"min-h-12 rounded-lg px-5 text-base font-black transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (timeFilter === filter ? "bg-emerald-600 text-white shadow-sm shadow-emerald-700/20" : "bg-white text-slate-700 ring-1 ring-slate-200")}
              aria-pressed={timeFilter === filter}
            >
              {label}
            </button>
          ))}
        </div>

        {loadError ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">{loadError}</p>
        ) : null}

        {isLoading ? (
          <p className="rounded-lg bg-white px-4 py-3 text-base font-black text-slate-600 ring-1 ring-slate-200">{labels.statisticsLoading}</p>
        ) : null}

        {!isLoading && summary.saleCount === 0 ? (
          <p className="rounded-lg bg-white px-4 py-6 text-lg font-black text-slate-600 ring-1 ring-slate-200">{labels.noSalesForEvent}</p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={labels.statistics}>
          {overviewCards.map((card) => (
            <article key={card.label} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{card.value}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label={labels.topProducts}>
            <h2 className="text-2xl font-black tracking-tight">{labels.topProducts}</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-bold uppercase tracking-widest text-slate-500">
                    <th className="py-3 pr-4">{labels.product}</th>
                    <th className="px-4 py-3 text-right">{labels.quantity}</th>
                    <th className="py-3 pl-4 text-right">{labels.sum}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topProducts.map((product) => (
                    <tr key={product.name} className="border-b border-slate-100 last:border-0">
                      <td className="py-4 pr-4 text-lg font-black text-slate-900">{product.name}</td>
                      <td className="px-4 py-4 text-right text-lg font-bold tabular-nums text-slate-700">{product.quantity.toLocaleString("de-AT")}</td>
                      <td className="py-4 pl-4 text-right text-lg font-black tabular-nums text-slate-900">{formatCurrency(product.revenueCents, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label={labels.payment}>
            <h2 className="text-2xl font-black tracking-tight">{labels.payment}</h2>
            <dl className="mt-5 grid gap-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <dt className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.cash}</dt>
                <dd className="mt-2 text-3xl font-black tabular-nums text-slate-950">{formatCurrency(summary.paymentTotals.cashCents, language)}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <dt className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.card}</dt>
                <dd className="mt-2 text-3xl font-black tabular-nums text-slate-950">{formatCurrency(summary.paymentTotals.cardCents, language)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}
