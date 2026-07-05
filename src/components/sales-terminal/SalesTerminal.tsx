"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { listProducts, saveProduct } from "@/lib/repositories/products";
import { saveCompletedSale } from "@/lib/repositories/sales";
import { updateEventBasics } from "@/lib/repositories/events";
import { logSupabaseError } from "@/lib/supabase/diagnostics";
import { supabaseConfigWarning } from "@/lib/supabase/client";
import { AddTileDialog } from "./AddTileDialog";
import { Cart } from "./Cart";
import { defaultLanguage, groupLabels, translations } from "./i18n";
import { initialCart, mockEventSettings, productTiles, tileGroups } from "./mock-data";
import { PaymentPanel } from "./PaymentPanel";
import { ProductTile } from "./ProductTile";
import { PrintModeSetting } from "./PrintModeSetting";
import { VoucherPrintPreview } from "./VoucherPrintPreview";
import type { CartItem, EventSettings, Language, ProductTileData, TileGroupName } from "./types";
import type { Event as PersistedEvent, PrintMode } from "@/types/domain";

type ProductFilter = "all" | TileGroupName;

const productFilters: ProductFilter[] = ["all", ...tileGroups];

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

  return groupLabels[filter][language];
}

function getLabels(language: Language) {
  return translations[language];
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
      <path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function formatEventDate(eventSettings: EventSettings, language: Language) {
  const locale = language === "de" ? "de-AT" : "en-US";
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const from = new Date(eventSettings.dateFrom + "T12:00:00");
  const to = new Date(eventSettings.dateTo + "T12:00:00");

  if (Number.isNaN(from.getTime())) {
    return "";
  }

  if (!eventSettings.dateTo || eventSettings.dateFrom === eventSettings.dateTo || Number.isNaN(to.getTime())) {
    return formatter.format(from);
  }

  return formatter.format(from) + " - " + formatter.format(to);
}

type SalesTerminalProps = {
  accessUntil?: string;
  eventId?: string | null;
  initialEventSettings?: EventSettings;
  onBackToEvents?: () => void;
  onEventUpdated?: (event: PersistedEvent) => void;
  status?: string;
  tenantId?: string | null;
};

export function SalesTerminal({
  accessUntil,
  eventId = null,
  initialEventSettings = mockEventSettings,
  onBackToEvents,
  onEventUpdated,
  status = "preparation",
  tenantId = null,
}: SalesTerminalProps) {
  const receivedInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [activeFilter, setActiveFilter] = useState<ProductFilter>("all");
  const [eventSettings, setEventSettings] = useState<EventSettings>(initialEventSettings);
  const [products, setProducts] = useState<ProductTileData[]>(productTiles);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
  const [receivedEntry, setReceivedEntry] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(supabaseConfigWarning ? translations[defaultLanguage].mockFallbackWarning + " " + supabaseConfigWarning : null);
  const [tileEditor, setTileEditor] = useState<{ tile: ProductTileData | null; group: TileGroupName } | null>(null);
  const [printPreviewDate, setPrintPreviewDate] = useState<Date | null>(null);
  const labels = getLabels(language);
  const eventName = eventSettings.name[language];

  useEffect(() => {
    receivedInputRef.current?.focus();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadEventProducts() {
      if (!eventId || supabaseConfigWarning) {
        if (supabaseConfigWarning) {
          console.warn(labels.supabaseDiagnosticPrefix + ": " + supabaseConfigWarning);
        }
        setProducts(productTiles);
        return;
      }

      setIsLoadingProducts(true);
      setPersistenceMessage(null);

      try {
        const loadedProducts = await listProducts(eventId);
        if (isActive) {
          setProducts(loadedProducts);
        }
      } catch (error) {
        if (isActive) {
          const diagnostic = logSupabaseError("load products", error);
          setProducts(productTiles);
          setPersistenceMessage(labels.productLoadError + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
        }
      } finally {
        if (isActive) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadEventProducts();

    return () => {
      isActive = false;
    };
  }, [eventId, labels.productLoadError, labels.supabaseDiagnosticPrefix]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const visibleGroups = useMemo(() => activeFilter === "all" ? tileGroups : [activeFilter], [activeFilter]);

  const productsByGroup = useMemo(() => {
    return tileGroups.reduce((groups, group) => {
      groups[group] = products.filter((product) => product.group === group);
      return groups;
    }, {} as Record<TileGroupName, ProductTileData[]>);
  }, [products]);

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
    requestAnimationFrame(() => receivedInputRef.current?.focus());
  }

  async function openPrintPreview() {
    if (cartItems.length === 0 || isSavingSale) {
      return;
    }

    if (eventId && tenantId && !supabaseConfigWarning) {
      setIsSavingSale(true);
      setPersistenceMessage(null);

      try {
        await saveCompletedSale({
          cartItems,
          changeCents: Math.max(receivedCents - totalCents, 0),
          eventId,
          language,
          productsById,
          receivedCents,
          tenantId,
          totalCents,
        });
      } catch (error) {
        const diagnostic = logSupabaseError("save completed sale", error);
        setPersistenceMessage(labels.saleSaveError + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
        setIsSavingSale(false);
        return;
      }

      setIsSavingSale(false);
    }

    setPrintPreviewDate(new Date());
  }

  async function saveTile(tile: ProductTileData) {
    let savedTile = tile;

    if (eventId && tenantId && !supabaseConfigWarning) {
      try {
        const existingPosition = products.findIndex((product) => product.id === tile.id);
        console.info("Saving product to Supabase", {
          eventId,
          hasImageFile: Boolean(tile.imageFile),
          productId: tile.id,
          tenantId,
        });
        savedTile = await saveProduct({ tenantId, eventId, product: tile, position: existingPosition >= 0 ? existingPosition : products.length });
        setPersistenceMessage(null);
      } catch (error) {
        const diagnostic = logSupabaseError("save product", error);
        const message = tile.imageFile ? labels.imageUploadError : labels.saveError;
        setPersistenceMessage(message + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
        return { diagnostic, message, ok: false };
      }
    }

    setProducts((current) => {
      const exists = current.some((product) => product.id === tile.id || product.id === savedTile.id);
      return exists ? current.map((product) => product.id === tile.id || product.id === savedTile.id ? savedTile : product) : [...current, savedTile];
    });
    setTileEditor(null);
    return { ok: true };
  }

  async function updatePrintMode(printMode: PrintMode) {
    const nextSettings = { ...eventSettings, printMode };
    setEventSettings(nextSettings);

    if (!eventId || !tenantId || !accessUntil || supabaseConfigWarning) {
      return;
    }

    try {
      const updatedEvent = await updateEventBasics({
        id: eventId,
        tenantId,
        name: nextSettings.name.de,
        startsAt: nextSettings.dateFrom,
        endsAt: nextSettings.dateTo,
        accessUntil,
        printMode,
        status,
      });
      onEventUpdated?.(updatedEvent);
      setPersistenceMessage(null);
    } catch (error) {
      const diagnostic = logSupabaseError("update event basics", error);
      setPersistenceMessage(labels.saveError + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
    }
  }

  return (
    <main className="grid h-screen grid-rows-[5rem_minmax(0,1fr)_7rem] overflow-hidden bg-[#f6f7f5] text-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-7 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
        <div className="flex items-center gap-4">
          <button type="button" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.menu}>
            <MenuIcon />
          </button>
          {onBackToEvents ? (
            <button
              type="button"
              onClick={onBackToEvents}
              className="min-h-12 rounded-2xl bg-slate-100 px-4 text-base font-black text-slate-700 ring-1 ring-slate-200/80 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              ← {labels.myEvents}
            </button>
          ) : null}
          <div className="leading-tight">
            <p className="text-2xl font-black tracking-normal text-emerald-600">eventBon</p>
            <p className="text-sm font-semibold text-slate-500">{eventName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex min-h-12 items-center rounded-2xl bg-slate-100/80 px-2 ring-1 ring-slate-200/70" aria-label={labels.language}>
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
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-[minmax(0,1.35fr)_minmax(360px,0.95fr)_minmax(320px,0.8fr)] gap-6 p-6">
        <section className="flex min-h-0 flex-col rounded-[2.25rem] bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/75">
          <div className="shrink-0 border-b border-slate-100 px-7 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">{labels.articles}</h1>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-500">
                  <CalendarIcon />
                  {formatEventDate(eventSettings, language)}
                </p>
              </div>
              <span className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 ring-1 ring-slate-200/75">
                {eventSettings.printMode === "single_vouchers" ? labels.singleVouchers : labels.combinedVoucher}
              </span>
            </div>
            <div className="mt-5 flex gap-2.5 overflow-x-auto pb-1">
              {productFilters.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={"min-h-12 shrink-0 rounded-2xl px-5 text-base font-black transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (isActive ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/75")}
                  >
                    {getFilterLabel(filter, labels, language)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="space-y-7">
              {visibleGroups.map((group) => (
                <section key={group} className="space-y-3" aria-label={groupLabels[group][language]}>
                  {activeFilter === "all" ? (
                    <h2 className="text-xl font-black tracking-tight text-slate-800">{groupLabels[group][language]}</h2>
                  ) : null}
                  <div className="grid grid-cols-2 gap-5 xl:grid-cols-3 2xl:grid-cols-4">
                    {productsByGroup[group].map((product) => (
                      <ProductTile key={product.id} language={language} product={product} editLabel={labels.edit} onSelect={addProduct} onEdit={(selectedTile) => setTileEditor({ tile: selectedTile, group: selectedTile.group })} />
                    ))}
                    <button
                      type="button"
                      onClick={() => setTileEditor({ tile: null, group })}
                      className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-slate-300 bg-white/80 p-5 text-center text-slate-500 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-5xl font-light leading-none">+</span>
                      <span className="text-lg font-black">{groupLabels[group][language]}</span>
                    </button>
                  </div>
                </section>
              ))}
            </div>
            {persistenceMessage ? (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">{persistenceMessage}</p>
            ) : null}
            {isLoadingProducts ? (
              <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 ring-1 ring-slate-200">{labels.loadingProducts}</p>
            ) : null}
          </div>
        </section>

        <Cart items={cartItems} language={language} labels={labels} productsById={productsById} totalCents={totalCents} onIncrease={increaseItem} onDecrease={decreaseItem} onRemove={removeItem} />

        <div className="flex min-h-0 flex-col gap-5">
          <PaymentPanel labels={labels} language={language} totalCents={totalCents} receivedCents={receivedCents} receivedEntry={receivedEntry} receivedInputRef={receivedInputRef} onReceivedEntryChange={setReceivedEntry} />
          <PrintModeSetting labels={labels} printMode={eventSettings.printMode} onPrintModeChange={updatePrintMode} />
        </div>
      </div>

      <footer className="grid grid-cols-[minmax(260px,0.78fr)_minmax(0,1.62fr)] gap-5 border-t border-slate-200/70 bg-white/95 px-7 py-4 shadow-[0_-18px_45px_rgba(15,23,42,0.10)] backdrop-blur">
        <button type="button" onClick={clearSale} className="flex min-h-20 items-center justify-center gap-3 rounded-[1.75rem] bg-rose-50/90 px-6 text-xl font-black text-rose-700 ring-1 ring-rose-100 transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200">
          <TrashIcon />
          {labels.clearSale}
        </button>
        <button type="button" onClick={openPrintPreview} disabled={cartItems.length === 0 || isSavingSale} className="flex min-h-20 items-center justify-center gap-4 rounded-[1.75rem] bg-emerald-600 px-8 text-2xl font-black tracking-normal text-white shadow-[0_18px_35px_rgba(5,150,105,0.28)] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none">
          <PrinterIcon />
          {isSavingSale ? labels.saving : labels.printVouchers}
        </button>
      </footer>

      {printPreviewDate ? (
        <VoucherPrintPreview
          eventName={eventName}
          language={language}
          labels={labels}
          cartItems={cartItems}
          productsById={productsById}
          printMode={eventSettings.printMode}
          printedAt={printPreviewDate}
          onCancel={() => setPrintPreviewDate(null)}
        />
      ) : null}

      {tileEditor ? (
        <AddTileDialog tile={tileEditor.tile} initialGroup={tileEditor.group} language={language} labels={labels} onClose={() => setTileEditor(null)} onSave={saveTile} />
      ) : null}
    </main>
  );
}
