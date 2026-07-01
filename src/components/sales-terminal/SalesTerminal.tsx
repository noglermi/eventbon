"use client";

import { useMemo, useState } from "react";
import { Cart } from "./Cart";
import { defaultLanguage, groupLabels, translations } from "./i18n";
import { initialCart, mockEventSettings, productTiles } from "./mock-data";
import { PaymentPanel } from "./PaymentPanel";
import { ProductTile } from "./ProductTile";
import { PrintModeSetting } from "./PrintModeSetting";
import { VoucherPrintPreview } from "./VoucherPrintPreview";
import type { CartItem, Language, PrintMode, ProductTileData, TileGroupName } from "./types";

type ProductFilter = "all" | TileGroupName | "Coffee";

const productFilters: ProductFilter[] = ["all", "Drinks", "Food", "Coffee", "Other"];

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

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  );
}

function getFilterLabel(filter: ProductFilter, labels: ReturnType<typeof getLabels>, language: Language) {
  if (filter === "all") {
    return labels.all;
  }

  if (filter === "Coffee") {
    return labels.coffee;
  }

  return groupLabels[filter][language];
}

function getLabels(language: Language) {
  return translations[language];
}

export function SalesTerminal() {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [activeFilter, setActiveFilter] = useState<ProductFilter>("all");
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
  const [receivedEntry, setReceivedEntry] = useState("20");
  const [printMode, setPrintMode] = useState<PrintMode>(mockEventSettings.printMode);
  const [printPreviewDate, setPrintPreviewDate] = useState<Date | null>(null);
  const labels = getLabels(language);

  const productsById = useMemo(
    () => new Map(productTiles.map((product) => [product.id, product])),
    [],
  );

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") {
      return productTiles;
    }

    if (activeFilter === "Coffee") {
      return [];
    }

    return productTiles.filter((product) => product.group === activeFilter);
  }, [activeFilter]);

  const totalCents = useMemo(
    () => cartItems.reduce((sum, item) => {
      const product = productsById.get(item.productId);
      return product ? sum + Math.round(product.price * 100) * item.quantity : sum;
    }, 0),
    [cartItems, productsById],
  );

  const receivedCents = useMemo(() => parseAmountToCents(receivedEntry), [receivedEntry]);

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
  }

  function openPrintPreview() {
    setPrintPreviewDate(new Date());
  }

  return (
    <main className="grid h-screen grid-rows-[5rem_minmax(0,1fr)_7rem] overflow-hidden bg-slate-100 text-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button type="button" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.menu}>
            <MenuIcon />
          </button>
          <div className="leading-tight">
            <p className="text-2xl font-black tracking-normal text-emerald-600">eventBon</p>
            <p className="text-sm font-bold text-slate-500">Fest Sommer 2025</p>
          </div>
        </div>

        <div className="flex min-h-12 items-center rounded-2xl bg-slate-100 px-2" aria-label={labels.language}>
          <button
            type="button"
            onClick={() => setLanguage("de")}
            className={"rounded-xl px-4 py-2 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (language === "de" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}
          >
            DE
          </button>
          <span className="px-1 text-slate-300" aria-hidden="true">|</span>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={"rounded-xl px-4 py-2 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (language === "en" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}
          >
            EN
          </button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-[minmax(0,1.35fr)_minmax(360px,0.95fr)_minmax(320px,0.8fr)] gap-5 p-5">
        <section className="flex min-h-0 flex-col rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="shrink-0 border-b border-slate-100 px-6 py-5">
            <h1 className="text-3xl font-black tracking-normal text-slate-950">{labels.articles}</h1>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {productFilters.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={"min-h-12 shrink-0 rounded-2xl px-5 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (isActive ? "bg-slate-950 text-white shadow-md" : "bg-slate-100 text-slate-700")}
                  >
                    {getFilterLabel(filter, labels, language)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductTile key={product.id} language={language} product={product} onSelect={addProduct} />
              ))}
            </div>
          </div>
        </section>

        <Cart items={cartItems} language={language} labels={labels} productsById={productsById} totalCents={totalCents} onIncrease={increaseItem} onDecrease={decreaseItem} onRemove={removeItem} />

        <div className="flex min-h-0 flex-col gap-4">
          <PaymentPanel labels={labels} language={language} totalCents={totalCents} receivedCents={receivedCents} receivedEntry={receivedEntry} onReceivedEntryChange={setReceivedEntry} />
          <PrintModeSetting labels={labels} printMode={printMode} onPrintModeChange={setPrintMode} />
        </div>
      </div>

      <footer className="grid grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)] gap-5 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
        <button type="button" onClick={clearSale} className="flex min-h-20 items-center justify-center gap-3 rounded-[1.75rem] bg-rose-50 px-6 text-xl font-black text-rose-700 ring-1 ring-rose-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200">
          <TrashIcon />
          {labels.clearSale}
        </button>
        <button type="button" onClick={openPrintPreview} className="flex min-h-20 items-center justify-center gap-4 rounded-[1.75rem] bg-emerald-500 px-8 text-2xl font-black tracking-normal text-white shadow-xl shadow-emerald-500/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 active:scale-[0.99]">
          <PrinterIcon />
          {labels.printVouchers}
        </button>
      </footer>

      {printPreviewDate ? (
        <VoucherPrintPreview
          eventName="Fest Sommer 2025"
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
