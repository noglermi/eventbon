"use client";

import { useEffect, useState } from "react";
import { getSalesAnalytics, listSalesForExport } from "@/lib/repositories/sales";
import type { SalesAnalyticsSummary } from "@/lib/repositories/sales";
import { saveSalesWorkbook } from "@/lib/excel/sales-workbook";
import { formatDate, formatDateRange } from "@/lib/date-format";
import { logSupabaseError } from "@/lib/supabase/diagnostics";
import { supabaseConfigWarning } from "@/lib/supabase/client";
import { defaultLanguage, translations } from "@/components/sales-terminal/i18n";
import type { EventSettings, Language } from "@/components/sales-terminal/types";

type TimeFilter = "all" | "eventDay" | "today";

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
  hourlyRevenue: Array.from({ length: 24 }, (_, hour) => ({ hour, revenueCents: 0 })),
  topProducts: [],
};

function formatCurrency(cents: number, language: Language) {
  return new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatNumber(value: number, language: Language) {
  return new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US").format(value);
}

function formatHour(hour: number) {
  return String(hour).padStart(2, "0") + ":00";
}

function getBarSize(value: number, maxValue: number, minimumSize = 4) {
  if (value <= 0 || maxValue <= 0) {
    return "0%";
  }

  return Math.max(minimumSize, (value / maxValue) * 100) + "%";
}

function getDayRange(dateInput: Date | string) {
  const from = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput + "T12:00:00");
  from.setHours(0, 0, 0, 0);

  const to = new Date(from);
  to.setDate(to.getDate() + 1);

  return {
    createdFrom: from.toISOString(),
    createdTo: to.toISOString(),
  };
}

function getEventDays(eventSettings: EventSettings) {
  const from = new Date(eventSettings.dateFrom + "T12:00:00");
  const to = new Date(eventSettings.dateTo + "T12:00:00");

  if (Number.isNaN(from.getTime())) {
    return [];
  }

  const lastDay = Number.isNaN(to.getTime()) || !eventSettings.dateTo ? from : to;
  const days: string[] = [];
  const current = new Date(from);

  while (current <= lastDay) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function OrganizerSalesDashboard({ eventId, eventSettings, tenantId, onBackToEvents }: OrganizerSalesDashboardProps) {
  const language = defaultLanguage;
  const labels = translations[language];
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [selectedEventDay, setSelectedEventDay] = useState(eventSettings.dateFrom);
  const [summary, setSummary] = useState<SalesAnalyticsSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(supabaseConfigWarning);
  const eventName = eventSettings.name[language];
  const eventDays = getEventDays(eventSettings);
  const hasMultipleEventDays = eventDays.length > 1;

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
        const dateRange = timeFilter === "today"
          ? getDayRange(new Date())
          : timeFilter === "eventDay"
            ? getDayRange(selectedEventDay)
            : {};
        const analytics = await getSalesAnalytics({
          eventId,
          tenantId,
          ...dateRange,
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
  }, [eventId, labels.statisticsLoadError, labels.supabaseDiagnosticPrefix, selectedEventDay, tenantId, timeFilter]);

  const overviewCards = [
    { label: labels.totalRevenue, value: formatCurrency(summary.totalRevenueCents, language) },
    { label: labels.salesCount, value: formatNumber(summary.saleCount, language) },
    { label: labels.voucherCount, value: formatNumber(summary.voucherCount, language) },
    { label: labels.averageSale, value: formatCurrency(summary.averageSaleCents, language) },
  ];
  const maxHourlyRevenue = Math.max(...summary.hourlyRevenue.map((entry) => entry.revenueCents), 0);
  const topProductsChart = summary.topProducts.slice(0, 8);
  const maxProductRevenue = Math.max(...topProductsChart.map((product) => product.revenueCents), 0);
  const paymentTotalCents = summary.paymentTotals.cashCents + summary.paymentTotals.cardCents;

  async function exportExcelWorkbook() {
    if (!eventId || !tenantId || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const dateRange = timeFilter === "today"
        ? getDayRange(new Date())
        : timeFilter === "eventDay"
          ? getDayRange(selectedEventDay)
          : {};
      const sales = await listSalesForExport({
        eventId,
        tenantId,
        ...dateRange,
      });

      await saveSalesWorkbook({
        eventName,
        eventSettings,
        exportDate: new Date(),
        language,
        sales,
        summary,
      });
    } catch (error) {
      const diagnostic = logSupabaseError("export organizer sales workbook", error);
      setLoadError(labels.statisticsLoadError + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
    } finally {
      setIsExporting(false);
    }
  }

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

        <div className="flex flex-wrap items-end gap-3">
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
          {hasMultipleEventDays ? (
            <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
              {labels.eventDaySelect}
              <select
                value={selectedEventDay}
                onChange={(event) => {
                  setSelectedEventDay(event.target.value);
                  setTimeFilter("eventDay");
                }}
                className="min-h-12 rounded-lg border border-slate-200 bg-white px-4 text-base font-black normal-case tracking-normal text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                {eventDays.map((day) => (
                  <option key={day} value={day}>{formatDate(day, language)}</option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            onClick={exportExcelWorkbook}
            disabled={summary.saleCount === 0 || isExporting}
            className="min-h-12 rounded-lg bg-slate-950 px-5 text-base font-black text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
          >
            {isExporting ? labels.exportLoading : labels.exportExcel}
          </button>
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
          <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label={labels.revenueByHour}>
            <h2 className="text-2xl font-black tracking-tight">{labels.revenueByHour}</h2>
            <div className="mt-6 flex h-56 items-end gap-1 border-b border-slate-200 pb-3">
              {summary.hourlyRevenue.map((entry) => (
                <div key={entry.hour} className="flex h-full flex-1 flex-col justify-end gap-2">
                  <div className="flex min-h-0 flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-emerald-500 transition-[height]"
                      style={{ height: getBarSize(entry.revenueCents, maxHourlyRevenue) }}
                      title={formatHour(entry.hour) + " · " + formatCurrency(entry.revenueCents, language)}
                    />
                  </div>
                  <span className="h-4 text-center text-[10px] font-bold tabular-nums text-slate-500">
                    {entry.hour % 3 === 0 ? formatHour(entry.hour) : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label={labels.paymentMethods}>
            <h2 className="text-2xl font-black tracking-tight">{labels.paymentMethods}</h2>
            <div className="mt-6 grid gap-5">
              {[
                { label: labels.cash, value: summary.paymentTotals.cashCents, className: "bg-emerald-500" },
                { label: labels.card, value: summary.paymentTotals.cardCents, className: "bg-sky-500" },
              ].map((payment) => (
                <div key={payment.label}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{payment.label}</p>
                    <p className="text-lg font-black tabular-nums text-slate-950">{formatCurrency(payment.value, language)}</p>
                  </div>
                  <div className="h-5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={"h-full rounded-full transition-[width] " + payment.className}
                      style={{ width: getBarSize(payment.value, paymentTotalCents, 2) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-label={labels.topProducts}>
            <h2 className="text-2xl font-black tracking-tight">{labels.topProducts}</h2>
            {topProductsChart.length > 0 ? (
              <div className="mt-6 border-b border-slate-100 pb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.topProductsByRevenue}</h3>
                <div className="mt-4 grid gap-4">
                  {topProductsChart.map((product) => (
                    <div key={product.name} className="grid gap-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-base font-black text-slate-900">{product.name}</p>
                        <p className="shrink-0 text-base font-black tabular-nums text-slate-950">{formatCurrency(product.revenueCents, language)}</p>
                      </div>
                      <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width]"
                          style={{ width: getBarSize(product.revenueCents, maxProductRevenue, 3) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-bold uppercase tracking-widest text-slate-500">
                    <th className="py-3 pr-4">{labels.product}</th>
                    <th className="px-4 py-3 text-right">{labels.productCount}</th>
                    <th className="py-3 pl-4 text-right">{labels.revenue}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topProducts.map((product) => (
                    <tr key={product.name} className="border-b border-slate-100 last:border-0">
                      <td className="py-4 pr-4 text-lg font-black text-slate-900">{product.name}</td>
                      <td className="px-4 py-4 text-right text-lg font-bold tabular-nums text-slate-700">{formatNumber(product.quantity, language)}</td>
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
