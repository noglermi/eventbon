import { useState } from "react";
import type { RecentSale } from "@/lib/repositories/sales";
import { formatDateTime } from "@/lib/date-format";
import type { Translation } from "./i18n";
import type { Language } from "./types";

type RecentSalesPanelProps = {
  labels: Translation;
  language: Language;
  recentSales: RecentSale[];
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });

function formatCents(cents: number | null) {
  return currency.format((cents ?? 0) / 100);
}

function formatTime(value: string, language: Language) {
  const date = new Date(value);
  const locale = language === "de" ? "de-AT" : "en-US";

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPaymentLabel(sale: RecentSale, labels: Translation) {
  return sale.paymentMethod === "manual_card" ? labels.card : labels.cash;
}

export function RecentSalesPanel({ labels, language, recentSales }: RecentSalesPanelProps) {
  const [selectedSale, setSelectedSale] = useState<RecentSale | null>(null);

  return (
    <section className="rounded-[2.25rem] bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/75">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950">{labels.recentSales}</h2>
      </div>
      <div className="max-h-72 overflow-y-auto p-3">
        {recentSales.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-black text-slate-500 ring-1 ring-slate-200/75">
            {labels.noRecentSales}
          </p>
        ) : null}
        <div className="grid gap-2">
          {recentSales.map((sale) => (
            <button
              key={sale.id}
              type="button"
              onClick={() => setSelectedSale(sale)}
              className="grid min-h-16 grid-cols-[4.4rem_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200/75 transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              <span className="text-lg font-black tabular-nums text-slate-950">{formatTime(sale.createdAt, language)}</span>
              <span className="grid gap-1">
                <span className="text-base font-black text-slate-900">{formatCents(sale.totalCents)}</span>
                <span className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  <span>{getPaymentLabel(sale, labels)}</span>
                  <span aria-hidden="true">|</span>
                  <span>{sale.itemCount} {labels.vouchers}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedSale ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="recent-sale-title">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex shrink-0 items-start justify-between gap-5 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 id="recent-sale-title" className="text-2xl font-black tracking-tight text-slate-950">{labels.saleDetails}</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{formatDateTime(selectedSale.createdAt, language)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-600 transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                aria-label={labels.closeAddTileDialog}
              >
                x
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/75">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">{labels.total}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{formatCents(selectedSale.totalCents)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/75">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">{labels.payment}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{getPaymentLabel(selectedSale, labels)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/75">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">{labels.received}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{formatCents(selectedSale.cashReceivedCents)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/75">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">{labels.change}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{formatCents(selectedSale.changeCents)}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl ring-1 ring-slate-200/75">
                <div className="grid grid-cols-[minmax(0,1fr)_5rem_6rem] gap-3 border-b border-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>{labels.articles}</span>
                  <span className="text-right">{labels.quantity}</span>
                  <span className="text-right">{labels.total}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedSale.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_5rem_6rem] gap-3 px-4 py-3 text-sm font-bold text-slate-700">
                      <span className="truncate text-slate-950">{item.nameSnapshot}</span>
                      <span className="text-right tabular-nums">{item.quantity}</span>
                      <span className="text-right tabular-nums">{formatCents(item.lineTotalCents)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <dl className="mt-5 grid gap-2 text-sm font-bold text-slate-600">
                <div className="flex justify-between gap-4">
                  <dt>{labels.createdAt}</dt>
                  <dd className="text-right text-slate-950">{formatDateTime(selectedSale.createdAt, language)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
