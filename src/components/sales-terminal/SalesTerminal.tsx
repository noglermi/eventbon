"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { listProducts, saveProduct } from "@/lib/repositories/products";
import { listRecentSales, recordSalePrint, saveCompletedSale } from "@/lib/repositories/sales";
import type { RecentSale } from "@/lib/repositories/sales";
import { formatDateRange } from "@/lib/date-format";
import { logSupabaseError } from "@/lib/supabase/diagnostics";
import { supabaseConfigWarning } from "@/lib/supabase/client";
import { AddTileDialog } from "./AddTileDialog";
import { Cart } from "./Cart";
import { defaultLanguage, groupLabels, translations } from "./i18n";
import { initialCart, mockEventSettings, productTiles, tileGroups } from "./mock-data";
import { PaymentPanel } from "./PaymentPanel";
import { ProductTile } from "./ProductTile";
import { RecentSalesPanel } from "./RecentSalesPanel";
import { readViewSettings, writeViewSettings } from "./view-settings-storage";
import { VoucherPrintPreview } from "./VoucherPrintPreview";
import type { ActiveHelperSession, CartItem, EventSettings, Language, PaymentMethod, ProductTileData, TileGroupName } from "./types";
import type { ViewSettings } from "./view-settings-storage";
import type { Event as PersistedEvent } from "@/types/domain";

type ProductFilter = "all" | TileGroupName;
type ZoomArea = keyof ViewSettings["blockZoom"];

const productFilters: ProductFilter[] = ["all", ...tileGroups];
const zoomOptions = [60, 70, 80, 90, 100, 110, 120, 130] as const;

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

function getScaledBlockStyle(value: number): CSSProperties {
  const scale = value / 100;

  return {
    transform: "scale(" + scale + ")",
    transformOrigin: "top left",
    width: 100 / scale + "%",
    minWidth: 100 / scale + "%",
  };
}

function ScaledBlock({ children, className, zoom }: { children: ReactNode; className?: string; zoom: number }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [reservedHeight, setReservedHeight] = useState<number | null>(null);
  const scale = zoom / 100;

  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return undefined;
    }

    function updateReservedHeight() {
      if (!content) {
        return;
      }

      setReservedHeight(Math.ceil(content.scrollHeight * scale));
    }

    updateReservedHeight();

    const resizeObserver = new ResizeObserver(updateReservedHeight);
    resizeObserver.observe(content);
    window.addEventListener("resize", updateReservedHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateReservedHeight);
    };
  }, [scale]);

  return (
    <div className="relative w-full" style={{ height: reservedHeight ?? undefined }}>
      <div ref={contentRef} className={className} style={getScaledBlockStyle(zoom)}>
        {children}
      </div>
    </div>
  );
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

type SalesTerminalProps = {
  accessUntil?: string;
  activeHelperSession?: ActiveHelperSession | null;
  eventId?: string | null;
  initialEventSettings?: EventSettings;
  isHelperMode?: boolean;
  onBackToEvents?: () => void;
  onEventUpdated?: (event: PersistedEvent) => void;
  status?: string;
  tenantId?: string | null;
};

export function SalesTerminal({
  activeHelperSession = null,
  eventId = null,
  initialEventSettings = mockEventSettings,
  isHelperMode = false,
  onBackToEvents,
  tenantId = null,
}: SalesTerminalProps) {
  const receivedInputRef = useRef<HTMLInputElement>(null);
  const viewPanelRef = useRef<HTMLDivElement | null>(null);
  const [viewSettings, setViewSettings] = useState<ViewSettings>(() => readViewSettings());
  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);
  const [eventSettings] = useState<EventSettings>(initialEventSettings);
  const [products, setProducts] = useState<ProductTileData[]>(productTiles);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receivedEntry, setReceivedEntry] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(supabaseConfigWarning ? translations[defaultLanguage].mockFallbackWarning + " " + supabaseConfigWarning : null);
  const [persistenceDetails, setPersistenceDetails] = useState<string | null>(null);
  const [tileEditor, setTileEditor] = useState<{ tile: ProductTileData | null; group: TileGroupName } | null>(null);
  const [printPreviewDate, setPrintPreviewDate] = useState<Date | null>(null);
  const [completedSale, setCompletedSale] = useState<{ saleId: string | null; printRecorded: boolean } | null>(null);
  const [reprintSale, setReprintSale] = useState<RecentSale | null>(null);
  const [reprintPreviewDate, setReprintPreviewDate] = useState<Date | null>(null);
  const { blockZoom, language, visibleCategories } = viewSettings;
  const labels = getLabels(language);
  const eventName = eventSettings.name[language];
  const isHelperTerminal = isHelperMode || Boolean(activeHelperSession);
  const isPrintDisabled = cartItems.length === 0 || isSavingSale || completedSale !== null;
  const isCancelSaleDisabled = cartItems.length === 0 || isSavingSale || completedSale !== null;

  useEffect(() => {
    receivedInputRef.current?.focus();
  }, []);

  useEffect(() => {
    writeViewSettings(viewSettings);
  }, [viewSettings]);

  useEffect(() => {
    if (!isViewPanelOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      const panel = viewPanelRef.current;
      if (!panel || panel.contains(event.target as Node)) {
        return;
      }

      setIsViewPanelOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsViewPanelOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isViewPanelOpen]);

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
      setPersistenceDetails(null);

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
          setPersistenceDetails(null);
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

  useEffect(() => {
    let isActive = true;

    async function loadRecentEventSales() {
      if (!eventId || !tenantId || supabaseConfigWarning) {
        setRecentSales([]);
        return;
      }

      try {
        const loadedSales = await listRecentSales({ eventId, tenantId, limit: 10 });
        if (isActive) {
          setRecentSales(loadedSales);
        }
      } catch (error) {
        if (isActive) {
          const diagnostic = logSupabaseError("load recent sales", error);
          setRecentSales([]);
          setPersistenceMessage(labels.recentSalesLoadError);
          setPersistenceDetails(diagnostic);
        }
      }
    }

    loadRecentEventSales();

    return () => {
      isActive = false;
    };
  }, [eventId, labels.recentSalesLoadError, tenantId]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const visibleGroups = useMemo(() => tileGroups.filter((group) => visibleCategories[group]), [visibleCategories]);
  const areAllCategoriesVisible = visibleGroups.length === tileGroups.length;

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

  function resetSaleInputs() {
    setCartItems([]);
    setPaymentMethod("cash");
    setReceivedEntry("");
    setCompletedSale(null);
    setPrintPreviewDate(null);
    requestAnimationFrame(() => receivedInputRef.current?.focus());
  }

  function resetActiveSale() {
    resetSaleInputs();
    setPersistenceMessage(null);
    setPersistenceDetails(null);
  }

  function cancelSale() {
    if (isCancelSaleDisabled) {
      return;
    }

    if (!window.confirm(labels.cancelSaleConfirmation)) {
      return;
    }

    setCartItems([]);
    setPaymentMethod("cash");
    setReceivedEntry("");
    setCompletedSale(null);
    setPrintPreviewDate(null);
    setReprintSale(null);
    setReprintPreviewDate(null);
    requestAnimationFrame(() => receivedInputRef.current?.focus());
  }

  function toggleCategory(filter: ProductFilter) {
    if (filter === "all") {
      setViewSettings((current) => ({
        ...current,
        visibleCategories: {
          Drinks: true,
          Food: true,
          Desserts: true,
          Other: true,
        },
      }));
      return;
    }

    setViewSettings((current) => ({
      ...current,
      visibleCategories: {
        ...current.visibleCategories,
        [filter]: !current.visibleCategories[filter],
      },
    }));
  }

  async function openPrintPreview() {
    if (cartItems.length === 0 || isSavingSale || completedSale) {
      return;
    }

    if (eventId && !tenantId && !supabaseConfigWarning) {
      setPersistenceMessage(labels.saleSaveError);
      setPersistenceDetails("save completed sale | message=Selected event has no tenant_id and cannot be persisted.");
      return;
    }

    if (eventId && tenantId && !supabaseConfigWarning) {
      setIsSavingSale(true);
      setPersistenceMessage(null);
      setPersistenceDetails(null);

      const persistedReceivedCents = paymentMethod === "card_manual" ? totalCents : receivedCents;
      const persistedChangeCents = paymentMethod === "card_manual" ? 0 : Math.max(receivedCents - totalCents, 0);

      try {
        const saleId = await saveCompletedSale({
          cartItems,
          changeCents: persistedChangeCents,
          eventId,
          helperSession: activeHelperSession,
          language,
          paymentMethod,
          productsById,
          receivedCents: persistedReceivedCents,
          tenantId,
          totalCents,
        });
        setCompletedSale({ saleId, printRecorded: false });
      } catch (error) {
        const diagnostic = logSupabaseError("save completed sale", error);
        setPersistenceMessage(labels.saleSaveError);
        setPersistenceDetails(diagnostic);
        setIsSavingSale(false);
        return;
      }

      try {
        const loadedSales = await listRecentSales({ eventId, tenantId, limit: 10 });
        setRecentSales(loadedSales);
      } catch (error) {
        const diagnostic = logSupabaseError("reload recent sales after sale save", error);
        setPersistenceMessage(labels.recentSalesLoadError);
        setPersistenceDetails(diagnostic);
      }

      setIsSavingSale(false);
    }

    if (!eventId || !tenantId || supabaseConfigWarning) {
      setCompletedSale({ saleId: null, printRecorded: false });
    }

    setPrintPreviewDate(new Date());
  }

  async function reloadRecentSales() {
    if (!eventId || !tenantId || supabaseConfigWarning) {
      return;
    }

    const loadedSales = await listRecentSales({ eventId, tenantId, limit: 10 });
    setRecentSales(loadedSales);
  }

  async function handleInitialPrintRecorded() {
    if (!completedSale || completedSale.printRecorded) {
      resetActiveSale();
      return;
    }

    if (!completedSale.saleId || !tenantId || supabaseConfigWarning) {
      resetActiveSale();
      return;
    }

    try {
      await recordSalePrint({ saleId: completedSale.saleId, tenantId });
      await reloadRecentSales();
      resetActiveSale();
      setPersistenceMessage(null);
      setPersistenceDetails(null);
    } catch (error) {
      const diagnostic = logSupabaseError("record initial sale print", error);
      setPersistenceMessage(labels.printTrackingError);
      setPersistenceDetails(diagnostic);
      resetSaleInputs();
    }
  }

  async function handleReprintRecorded() {
    if (!reprintSale || !tenantId || supabaseConfigWarning) {
      setReprintSale(null);
      setReprintPreviewDate(null);
      return;
    }

    try {
      await recordSalePrint({ saleId: reprintSale.id, tenantId });
      await reloadRecentSales();
      setPersistenceMessage(null);
      setPersistenceDetails(null);
    } catch (error) {
      const diagnostic = logSupabaseError("record sale reprint", error);
      setPersistenceMessage(labels.printTrackingError);
      setPersistenceDetails(diagnostic);
    } finally {
      setReprintSale(null);
      setReprintPreviewDate(null);
    }
  }

  function openReprintPreview(sale: RecentSale) {
    setReprintSale(sale);
    setReprintPreviewDate(new Date());
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
        setPersistenceDetails(null);
      } catch (error) {
        const diagnostic = logSupabaseError("save product", error);
        const message = tile.imageFile ? labels.imageUploadError : labels.saveError;
        setPersistenceMessage(message + " " + labels.supabaseDiagnosticPrefix + ": " + diagnostic);
        setPersistenceDetails(null);
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

  return (
    <main className="grid h-screen grid-rows-[5rem_minmax(0,1fr)_7rem] overflow-hidden bg-[#f6f7f5] text-slate-950">
      <header className="relative z-50 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-7 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
        <div className="flex items-center gap-4">
          {isHelperTerminal ? null : (
            <button type="button" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" aria-label={labels.menu}>
              <MenuIcon />
            </button>
          )}
          {!isHelperTerminal && onBackToEvents ? (
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
            {isHelperTerminal && activeHelperSession ? (
              <p className="mt-1 text-xs font-black text-slate-600">
                {labels.helperTerminalLabel}: {activeHelperSession.helperName}
                {activeHelperSession.station ? " | " + labels.helperStationLabel + ": " + activeHelperSession.station : ""}
              </p>
            ) : null}
          </div>
          <div ref={viewPanelRef} className="relative">
            <button
              type="button"
              onClick={() => setIsViewPanelOpen((current) => !current)}
              className="flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-black text-white shadow-sm shadow-emerald-600/20 ring-1 ring-emerald-700/20 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              aria-expanded={isViewPanelOpen}
              aria-haspopup="dialog"
            >
              {labels.view} / {labels.zoom}
              <span className="rounded-xl bg-white/20 px-2 py-1 text-sm tabular-nums">{blockZoom.articles}%</span>
            </button>
            {isViewPanelOpen ? (
              <div className="absolute left-0 top-14 z-[200] w-[23rem] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
                {([
                  ["articles", labels.articlesZoom],
                  ["cart", labels.cartZoom],
                  ["payment", labels.paymentZoom],
                ] as Array<[ZoomArea, string]>).map(([area, label]) => (
                  <div key={area} className="grid gap-2 py-2 first:pt-0 last:pb-0">
                    <p className="text-sm font-black uppercase tracking-widest text-slate-500">{label}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {zoomOptions.map((option) => (
                        <button
                          key={area + option}
                          type="button"
                          onClick={() => setViewSettings((current) => ({
                            ...current,
                            blockZoom: {
                              ...current.blockZoom,
                              [area]: option,
                            },
                          }))}
                          className={"min-h-10 rounded-xl text-sm font-black transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (blockZoom[area] === option ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/75")}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex min-h-12 items-center rounded-2xl bg-slate-100/80 px-2 ring-1 ring-slate-200/70" aria-label={labels.language}>
            <button
              type="button"
              onClick={() => setViewSettings((current) => ({ ...current, language: "de" }))}
              className={"rounded-xl px-4 py-2 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (language === "de" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}
            >
              DE
            </button>
            <span className="px-1 text-slate-300" aria-hidden="true">|</span>
            <button
              type="button"
              onClick={() => setViewSettings((current) => ({ ...current, language: "en" }))}
              className={"rounded-xl px-4 py-2 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (language === "en" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-[minmax(0,1.35fr)_minmax(300px,0.95fr)_minmax(280px,0.8fr)] gap-4 p-4 xl:gap-6 xl:p-6">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[2.25rem] bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/75">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <ScaledBlock zoom={blockZoom.articles}>
              <div className="border-b border-slate-100 px-7 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950">{labels.articles}</h1>
                    <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-500">
                      <CalendarIcon />
                      {formatDateRange(eventSettings, language)}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 ring-1 ring-slate-200/75">
                    {eventSettings.printMode === "single_vouchers" ? labels.singleVouchers : labels.combinedVoucher}
                  </span>
                </div>
                <div className="mt-5 flex gap-2.5 overflow-x-auto pb-1">
                  {productFilters.map((filter) => {
                    const isActive = filter === "all" ? areAllCategoriesVisible : visibleCategories[filter];
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => toggleCategory(filter)}
                        className={"min-h-12 shrink-0 rounded-2xl px-5 text-base font-black transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (isActive ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/75")}
                        aria-pressed={isActive}
                      >
                        {getFilterLabel(filter, labels, language)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-7">
                  {visibleGroups.length === 0 ? (
                    <div className="flex min-h-48 items-center justify-center rounded-[1.75rem] bg-slate-50 p-6 text-center text-xl font-black text-slate-500 ring-1 ring-slate-200/75">
                      {labels.noVisibleCategories}
                    </div>
                  ) : null}
                  {visibleGroups.map((group) => (
                    <section key={group} className="space-y-3" aria-label={groupLabels[group][language]}>
                      <h2 className="text-xl font-black tracking-tight text-slate-800">{groupLabels[group][language]}</h2>
                      <div className="grid grid-cols-2 gap-5 xl:grid-cols-3 2xl:grid-cols-4">
                        {productsByGroup[group].map((product) => (
                          <ProductTile
                            key={product.id}
                            language={language}
                            product={product}
                            editLabel={isHelperTerminal ? undefined : labels.edit}
                            onSelect={addProduct}
                            onEdit={isHelperTerminal ? undefined : (selectedTile) => setTileEditor({ tile: selectedTile, group: selectedTile.group })}
                          />
                        ))}
                        {isHelperTerminal ? null : (
                          <button
                            type="button"
                            onClick={() => setTileEditor({ tile: null, group })}
                            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-slate-300 bg-white/80 p-5 text-center text-slate-500 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                          >
                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-5xl font-light leading-none">+</span>
                            <span className="text-lg font-black">{groupLabels[group][language]}</span>
                          </button>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
                {persistenceMessage ? (
                  <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
                    <p>{persistenceMessage}</p>
                    {persistenceDetails ? (
                      <details className="mt-3 text-xs font-semibold text-amber-950">
                        <summary className="cursor-pointer font-black">{labels.technicalDetails}</summary>
                        <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-white/70 p-3 font-mono text-[11px] leading-relaxed">{persistenceDetails}</pre>
                      </details>
                    ) : null}
                  </div>
                ) : null}
                {isLoadingProducts ? (
                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 ring-1 ring-slate-200">{labels.loadingProducts}</p>
                ) : null}
              </div>
            </ScaledBlock>
          </div>
        </section>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden rounded-[2.25rem]">
          <ScaledBlock zoom={blockZoom.cart}>
            <Cart items={cartItems} language={language} labels={labels} productsById={productsById} totalCents={totalCents} onIncrease={increaseItem} onDecrease={decreaseItem} onRemove={removeItem} />
          </ScaledBlock>
        </div>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden rounded-[2.25rem]">
          <ScaledBlock zoom={blockZoom.payment} className="flex min-h-0 flex-col gap-5">
            <PaymentPanel labels={labels} language={language} paymentMethod={paymentMethod} totalCents={totalCents} receivedCents={receivedCents} receivedEntry={receivedEntry} receivedInputRef={receivedInputRef} onPaymentMethodChange={setPaymentMethod} onReceivedEntryChange={setReceivedEntry} />
            <RecentSalesPanel labels={labels} language={language} recentSales={recentSales} onReprintSale={openReprintPreview} />
          </ScaledBlock>
        </div>
      </div>

      <footer className="grid grid-cols-[minmax(260px,0.78fr)_minmax(0,1.62fr)] gap-5 border-t border-slate-200/70 bg-white/95 px-7 py-4 shadow-[0_-18px_45px_rgba(15,23,42,0.10)] backdrop-blur">
        <button type="button" onClick={cancelSale} disabled={isCancelSaleDisabled} className="flex min-h-20 items-center justify-center gap-3 rounded-[1.75rem] bg-rose-50/90 px-6 text-xl font-black text-rose-700 ring-1 ring-rose-100 transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:ring-slate-200">
          <TrashIcon />
          {labels.cancelSale}
        </button>
        <button type="button" onClick={openPrintPreview} disabled={isPrintDisabled} className="flex min-h-20 items-center justify-center gap-4 rounded-[1.75rem] bg-emerald-600 px-8 text-2xl font-black tracking-normal text-white shadow-[0_18px_35px_rgba(5,150,105,0.28)] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none">
          <PrinterIcon />
          {isSavingSale ? labels.saving : completedSale ? labels.saleCompleted : labels.printVouchers}
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
          onCancel={resetActiveSale}
          onPrinted={handleInitialPrintRecorded}
        />
      ) : null}

      {reprintSale && reprintPreviewDate ? (
        <VoucherPrintPreview
          eventName={eventName}
          language={language}
          labels={labels}
          cartItems={[]}
          lines={reprintSale.items.map((item) => ({ id: item.id, name: item.nameSnapshot, quantity: item.quantity }))}
          productsById={productsById}
          printMode={eventSettings.printMode}
          printedAt={reprintPreviewDate}
          reprintLabel={reprintSale.printCount + 1 > 1 ? labels.reprint : null}
          onCancel={() => {
            setReprintSale(null);
            setReprintPreviewDate(null);
          }}
          onPrinted={handleReprintRecorded}
        />
      ) : null}

      {!isHelperTerminal && tileEditor ? (
        <AddTileDialog tile={tileEditor.tile} initialGroup={tileEditor.group} language={language} labels={labels} onClose={() => setTileEditor(null)} onSave={saveTile} />
      ) : null}
    </main>
  );
}
