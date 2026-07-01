"use client";

import { useMemo, useState } from "react";
import { AddTileDialog } from "./AddTileDialog";
import { Cart } from "./Cart";
import { defaultLanguage, groupLabels, languageLabels, translations } from "./i18n";
import { initialCart, mockEventSettings, productTiles, tileGroups } from "./mock-data";
import { PaymentPanel } from "./PaymentPanel";
import { PrintModeSetting } from "./PrintModeSetting";
import { TileGroup } from "./TileGroup";
import { VoucherPrintPreview } from "./VoucherPrintPreview";
import type { CartItem, Language, PaymentMethod, PrintMode, ProductTileData, TileGroupName } from "./types";

type OpenGroups = Record<TileGroupName, boolean>;

const defaultOpenGroups: OpenGroups = { Drinks: true, Food: true, Desserts: true, Other: true };

function parseAmountToCents(value: string) {
  const normalizedValue = value.trim().replace(",", ".");
  if (!normalizedValue) {
    return 0;
  }

  const [euroPart, centPart = ""] = normalizedValue.split(".");
  const euros = Number.parseInt(euroPart || "0", 10);
  const cents = Number.parseInt(centPart.padEnd(2, "0").slice(0, 2) || "0", 10);

  if (Number.isNaN(euros) || Number.isNaN(cents)) {
    return 0;
  }

  return euros * 100 + cents;
}

export function SalesTerminal() {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [openGroups, setOpenGroups] = useState<OpenGroups>(defaultOpenGroups);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [receivedEntry, setReceivedEntry] = useState("20");
  const [printMode, setPrintMode] = useState<PrintMode>(mockEventSettings.printMode);
  const [dialogGroup, setDialogGroup] = useState<TileGroupName | null>(null);
  const [printPreviewDate, setPrintPreviewDate] = useState<Date | null>(null);
  const labels = translations[language];

  const productsById = useMemo(
    () => new Map(productTiles.map((product) => [product.id, product])),
    [],
  );

  const totalCents = useMemo(
    () => cartItems.reduce((sum, item) => {
      const product = productsById.get(item.productId);
      return product ? sum + Math.round(product.price * 100) * item.quantity : sum;
    }, 0),
    [cartItems, productsById],
  );

  const receivedCents = useMemo(() => parseAmountToCents(receivedEntry), [receivedEntry]);

  function toggleGroup(group: TileGroupName) {
    setOpenGroups((current) => ({ ...current, [group]: !current[group] }));
  }

  function addProduct(product: ProductTileData) {
    setCartItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { productId: product.id, quantity: 1 }];
    });
  }

  function increaseItem(productId: string) {
    setCartItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item));
  }

  function decreaseItem(productId: string) {
    setCartItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0));
  }

  function removeItem(productId: string) {
    setCartItems((current) => current.filter((item) => item.productId !== productId));
  }

  function clearSale() {
    setCartItems([]);
    setReceivedEntry("");
    setPaymentMethod(null);
  }

  function openPrintPreview() {
    setPrintPreviewDate(new Date());
  }

  return (
    <main className="min-h-screen bg-[#f3f4ef] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-6 px-6 py-6 xl:px-8">
        <header className="flex items-center justify-between gap-6 rounded-[2rem] bg-white px-7 py-5 shadow-sm ring-1 ring-slate-200/70">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">eventBon</p>
            <h1 className="mt-1 text-4xl font-black tracking-normal text-slate-950">{labels.salesTerminal}</h1>
          </div>
          <div className="flex items-center gap-7 text-right">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{labels.activeEvent}</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{labels.summerFest}</p>
            </div>
            <div className="flex min-h-12 items-center rounded-2xl bg-slate-100 px-2" aria-label={labels.language}>
              <button
                type="button"
                onClick={() => setLanguage("de")}
                className={"rounded-xl px-3 py-2 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (language === "de" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900")}
              >
                {languageLabels.de}
              </button>
              <span className="px-1 text-slate-300" aria-hidden="true">|</span>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={"rounded-xl px-3 py-2 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (language === "en" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900")}
              >
                {languageLabels.en}
              </button>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_380px] xl:grid-cols-[280px_minmax(0,1fr)_420px]">
          <aside className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <p className="px-2 text-sm font-bold uppercase tracking-widest text-slate-400">{labels.tileGroups}</p>
            <div className="mt-5 space-y-3">
              {tileGroups.map((group) => {
                const groupClass = openGroups[group] ? "bg-slate-950 text-white shadow-lg" : "bg-slate-100 text-slate-700 hover:bg-slate-200";
                return (
                  <button key={group} type="button" onClick={() => toggleGroup(group)} className={"flex min-h-16 w-full items-center justify-between rounded-2xl px-4 text-left text-lg font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + groupClass} aria-expanded={openGroups[group]}>
                    <span>{groupLabels[group][language]}</span>
                    <span className="text-2xl">{openGroups[group] ? "-" : "+"}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70 xl:p-6">
            <div className="mb-6 flex items-end justify-between gap-5 px-1">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{labels.salesTiles}</p>
                <h2 className="mt-1 text-3xl font-black tracking-normal text-slate-950">{labels.tapToAdd}</h2>
              </div>
              <p className="max-w-xs text-right text-base font-semibold text-slate-500">{labels.mockDataNote}</p>
            </div>

            <div className="space-y-7 overflow-y-auto pr-1 lg:max-h-[calc(100vh-12rem)]">
              {tileGroups.map((group) => (
                <TileGroup key={group} group={group} language={language} products={productTiles.filter((product) => product.group === group)} isOpen={openGroups[group]} labels={labels} onToggle={() => toggleGroup(group)} onSelectProduct={addProduct} onAddTile={setDialogGroup} />
              ))}
            </div>
          </section>

          <aside className="flex flex-col gap-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <PrintModeSetting labels={labels} printMode={printMode} onPrintModeChange={setPrintMode} />
            <Cart items={cartItems} language={language} labels={labels} productsById={productsById} onIncrease={increaseItem} onDecrease={decreaseItem} onRemove={removeItem} />
            <PaymentPanel labels={labels} language={language} totalCents={totalCents} receivedCents={receivedCents} receivedEntry={receivedEntry} paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} onReceivedEntryChange={setReceivedEntry} onClearSale={clearSale} onOpenPrintPreview={openPrintPreview} />
          </aside>
        </div>
      </div>

      <AddTileDialog group={dialogGroup} language={language} labels={labels} onClose={() => setDialogGroup(null)} />
      {printPreviewDate ? (
        <VoucherPrintPreview
          eventName={labels.summerFest}
          language={language}
          labels={labels}
          cartItems={cartItems}
          productsById={productsById}
          printMode={printMode}
          printedAt={printPreviewDate}
          onCancel={() => setPrintPreviewDate(null)}
        />
      ) : null}
    </main>
  );
}
