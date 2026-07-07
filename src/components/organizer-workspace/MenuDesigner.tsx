"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateRange } from "@/lib/date-format";
import { formatAllergenCodes } from "@/lib/allergens";
import { listProducts } from "@/lib/repositories/products";
import { logSupabaseError } from "@/lib/supabase/diagnostics";
import { supabaseConfigWarning } from "@/lib/supabase/client";
import { groupLabels, translations } from "@/components/sales-terminal/i18n";
import { productTiles, tileGroups } from "@/components/sales-terminal/mock-data";
import type { EventSettings, Language, ProductTileData, TileGroupName } from "@/components/sales-terminal/types";
import { LanguageSwitch } from "@/components/organizer-workspace/LanguageSwitch";

type MenuLayout = "a4_portrait" | "a4_landscape" | "drink_menu" | "food_menu";

type MenuDesignerProps = {
  eventId: string | null;
  eventSettings: EventSettings;
  language: Language;
  onBackToEvents: () => void;
  onLanguageChange: (language: Language) => void;
};

const currency = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
const defaultImageCrop = { zoom: 1, x: 50, y: 50 };

function layoutLabel(layout: MenuLayout, language: Language) {
  const labels = translations[language];

  const labelsByLayout: Record<MenuLayout, string> = {
    a4_portrait: labels.menuA4Portrait,
    a4_landscape: labels.menuA4Landscape,
    drink_menu: labels.menuDrinkCard,
    food_menu: labels.menuFoodCard,
  };

  return labelsByLayout[layout];
}

function productGroups(products: ProductTileData[]) {
  return tileGroups.reduce((groups, group) => {
    groups[group] = products.filter((product) => product.group === group);
    return groups;
  }, {} as Record<TileGroupName, ProductTileData[]>);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPrintableMenuHtml(input: {
  groupedProducts: Record<TileGroupName, ProductTileData[]>;
  language: Language;
  layout: MenuLayout;
  menuTitle: string;
  showImages: boolean;
  showPrices: boolean;
  subtitle: string;
  visibleGroups: TileGroupName[];
}) {
  const isLandscape = input.layout === "a4_landscape";
  const pageSize = isLandscape ? "A4 landscape" : "A4 portrait";
  const maxWidth = isLandscape ? "1040px" : "760px";

  const categoryHtml = input.visibleGroups.map((group) => {
    const productsHtml = input.groupedProducts[group].map((product) => {
      const imageCrop = product.imageCrop ?? defaultImageCrop;
      const allergenText = formatAllergenCodes(product.allergens);
      const productWithDescription = product as ProductTileData & { description?: Partial<Record<Language, string>> };
      const description = productWithDescription.description?.[input.language] ?? "";
      const mediaHtml = input.showImages
        ? product.image
          ? `<span class="menu-media"><img src="${escapeHtml(product.image)}" alt="" style="object-position:${imageCrop.x}% ${imageCrop.y}%; transform:scale(${imageCrop.zoom}); transform-origin:${imageCrop.x}% ${imageCrop.y}%;" /></span>`
          : `<span class="menu-media menu-icon">${escapeHtml(product.icon ?? "")}</span>`
        : "";

      return `
        <div class="menu-product">
          ${mediaHtml}
          <div class="menu-product-copy">
            <div class="menu-product-main">
              <span class="menu-product-name">${escapeHtml(product.name[input.language])}</span>
              ${input.showPrices ? `<span class="menu-product-price">${currency.format(product.price)}</span>` : ""}
            </div>
            ${description ? `<p class="menu-product-description">${escapeHtml(description)}</p>` : ""}
            ${allergenText ? `<p class="menu-allergens">${escapeHtml(allergenText)}</p>` : ""}
          </div>
        </div>
      `;
    }).join("");

    return `
      <section class="menu-category">
        <h2>${escapeHtml(groupLabels[group][input.language])}</h2>
        <div class="menu-products">${productsHtml}</div>
      </section>
    `;
  }).join("");

  return `<!doctype html>
<html lang="${input.language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.menuTitle || "eventBon Menu")}</title>
  <style>
    @page { size: ${pageSize}; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f6f7f5;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    .page {
      width: min(100%, ${maxWidth});
      margin: 0 auto;
      min-height: 100vh;
      background: white;
      padding: 40px;
    }
    .menu-header {
      border-bottom: 2px solid #dfe5e1;
      padding-bottom: 28px;
      text-align: center;
    }
    .logo {
      color: #059669;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: .22em;
      text-transform: uppercase;
    }
    h1 {
      margin: 16px 0 0;
      font-size: 44px;
      line-height: 1.05;
      letter-spacing: 0;
    }
    .subtitle {
      margin: 10px 0 0;
      color: #64748b;
      font-size: 18px;
      font-weight: 700;
    }
    .menu-content {
      display: grid;
      gap: 30px;
      margin-top: 32px;
    }
    .menu-category {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .menu-category h2 {
      margin: 0 0 14px;
      border-bottom: 1px solid #dfe5e1;
      padding-bottom: 8px;
      font-size: 25px;
      line-height: 1.15;
    }
    .menu-products {
      display: grid;
      gap: 10px;
    }
    .menu-product {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 14px;
      align-items: center;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .menu-product-copy {
      min-width: 0;
    }
    .menu-product-main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: baseline;
    }
    .menu-product-name {
      font-size: 18px;
      font-weight: 900;
      line-height: 1.2;
    }
    .menu-product-price {
      font-size: 18px;
      font-weight: 900;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .menu-product-description {
      margin: 5px 0 0;
      color: #475569;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.35;
    }
    .menu-allergens {
      margin: 5px 0 0;
      color: #64748b;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: .04em;
    }
    .menu-media {
      display: flex;
      width: 58px;
      height: 58px;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      font-size: 30px;
      font-weight: 900;
    }
    .menu-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    @media print {
      body { background: white; }
      .page {
        width: 100%;
        min-height: 0;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="menu-header">
      <div class="logo">eventBon</div>
      <h1>${escapeHtml(input.menuTitle)}</h1>
      ${input.subtitle ? `<p class="subtitle">${escapeHtml(input.subtitle)}</p>` : ""}
    </header>
    <div class="menu-content">
      ${categoryHtml}
    </div>
  </main>
  <script>
    window.addEventListener("load", () => {
      window.focus();
      window.print();
    });
  </script>
</body>
</html>`;
}

export function MenuDesigner({ eventId, eventSettings, language, onBackToEvents, onLanguageChange }: MenuDesignerProps) {
  const labels = translations[language];
  const [menuTitle, setMenuTitle] = useState(eventSettings.name[language]);
  const [subtitle, setSubtitle] = useState(formatDateRange(eventSettings, language));
  const [layout, setLayout] = useState<MenuLayout>("a4_portrait");
  const [showPrices, setShowPrices] = useState(true);
  const [showImages, setShowImages] = useState(true);
  const [visibleCategories, setVisibleCategories] = useState<Record<TileGroupName, boolean>>({
    Drinks: true,
    Food: true,
    Desserts: true,
    Other: true,
  });
  const [products, setProducts] = useState<ProductTileData[]>(productTiles);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(supabaseConfigWarning ? labels.mockFallbackWarning + " " + supabaseConfigWarning : null);
  const [loadErrorDetails, setLoadErrorDetails] = useState<string | null>(null);
  const groupedProducts = useMemo(() => productGroups(products), [products]);
  const visibleGroups = tileGroups.filter((group) => visibleCategories[group] && groupedProducts[group].length > 0);
  const previewIsLandscape = layout === "a4_landscape";

  function openPrintableMenu() {
    const printWindow = window.open("", "_blank", "width=920,height=900");

    if (!printWindow) {
      setLoadError(labels.saveError);
      setLoadErrorDetails("The browser blocked the menu print window.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintableMenuHtml({
      groupedProducts,
      language,
      layout,
      menuTitle: menuTitle || eventSettings.name[language],
      showImages,
      showPrices,
      subtitle,
      visibleGroups,
    }));
    printWindow.document.close();
  }

  useEffect(() => {
    let isActive = true;

    async function loadEventProducts() {
      if (!eventId || supabaseConfigWarning) {
        setProducts(productTiles);
        return;
      }

      setIsLoadingProducts(true);
      setLoadError(null);
      setLoadErrorDetails(null);

      try {
        const loadedProducts = await listProducts(eventId);
        if (isActive) {
          setProducts(loadedProducts);
        }
      } catch (error) {
        if (isActive) {
          const diagnostic = logSupabaseError("load menu products", error);
          setProducts([]);
          setLoadError(labels.productLoadError);
          setLoadErrorDetails(diagnostic);
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
  }, [eventId, labels.productLoadError]);

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-6 py-7 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-7">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-200 pb-6">
          <div>
            <p className="text-2xl font-black tracking-normal text-emerald-600">eventBon</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">{labels.menuTitle}</h1>
            <p className="mt-2 text-lg font-semibold text-slate-600">{eventSettings.name[language]}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <LanguageSwitch language={language} labels={labels} onLanguageChange={onLanguageChange} />
            <button
              type="button"
              onClick={onBackToEvents}
              className="min-h-14 rounded-lg bg-slate-100 px-5 text-lg font-black text-slate-700 ring-1 ring-slate-200 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              {labels.backToEvents}
            </button>
          </div>
        </header>

        {loadError ? (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
            <p>{loadError}</p>
            {loadErrorDetails ? (
              <details className="mt-3 text-xs font-semibold text-amber-950">
                <summary className="cursor-pointer font-black">{labels.technicalDetails}</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-white/70 p-3 font-mono text-[11px] leading-relaxed">{loadErrorDetails}</pre>
              </details>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]">
          <aside className="grid content-start gap-5">
            <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">{labels.menuDesigner}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{labels.menuLayout}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{labels.menuDesignerIntro}</p>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                  {labels.menuTitle}
                  <input value={menuTitle} onChange={(event) => setMenuTitle(event.target.value)} className="min-h-14 rounded-lg border border-slate-200 px-4 text-lg font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                </label>

                <label className="grid gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                  {labels.menuSubtitle}
                  <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="min-h-14 rounded-lg border border-slate-200 px-4 text-lg font-bold normal-case tracking-normal text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                </label>

                <fieldset className="grid gap-2">
                  <legend className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.menuLayout}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["a4_portrait", "a4_landscape", "drink_menu", "food_menu"] as MenuLayout[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setLayout(option)}
                        className={"min-h-12 rounded-lg px-3 text-sm font-black transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (layout === option ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200")}
                      >
                        {layoutLabel(option, language)}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 text-base font-black text-slate-700 ring-1 ring-slate-200">
                  {labels.menuShowPrices}
                  <input type="checkbox" checked={showPrices} onChange={(event) => setShowPrices(event.target.checked)} className="h-6 w-6 accent-emerald-600" />
                </label>

                <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 text-base font-black text-slate-700 ring-1 ring-slate-200">
                  {labels.menuShowImages}
                  <input type="checkbox" checked={showImages} onChange={(event) => setShowImages(event.target.checked)} className="h-6 w-6 accent-emerald-600" />
                </label>
              </div>
            </section>

            <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-black tracking-tight">{labels.menuProductSelection}</h2>
              {isLoadingProducts ? (
                <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 ring-1 ring-slate-200">{labels.loadingProducts}</p>
              ) : null}
              <div className="mt-4 grid gap-2">
                {tileGroups.map((group) => (
                  <label key={group} className="flex min-h-12 items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 text-base font-black text-slate-700 ring-1 ring-slate-200">
                    <span>{groupLabels[group][language]}</span>
                    <input
                      type="checkbox"
                      checked={visibleCategories[group]}
                      onChange={(event) => setVisibleCategories((current) => ({ ...current, [group]: event.target.checked }))}
                      className="h-6 w-6 accent-emerald-600"
                    />
                  </label>
                ))}
              </div>
            </section>
          </aside>

          <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">{labels.menuLivePreview}</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">{layoutLabel(layout, language)}</h2>
              </div>
              <span className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-black text-slate-600 ring-1 ring-slate-200">
                {previewIsLandscape ? labels.menuA4Landscape : labels.menuA4Portrait}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openPrintableMenu}
                  className="min-h-12 rounded-lg bg-emerald-600 px-5 text-base font-black text-white shadow-sm shadow-emerald-600/20 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  {labels.generatePdf}
                </button>
                <button
                  type="button"
                  onClick={openPrintableMenu}
                  className="min-h-12 rounded-lg bg-slate-100 px-5 text-base font-black text-slate-700 ring-1 ring-slate-200 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  {labels.printMenu}
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-lg bg-slate-100 p-4">
              <article className={"mx-auto min-h-[720px] bg-white p-8 shadow-sm ring-1 ring-slate-200 " + (previewIsLandscape ? "w-[920px]" : "w-full max-w-[640px]")}>
                <header className="border-b border-slate-200 pb-6 text-center">
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">eventBon</p>
                  <h3 className="mt-3 text-4xl font-black tracking-tight">{menuTitle || eventSettings.name[language]}</h3>
                  {subtitle ? <p className="mt-2 text-lg font-semibold text-slate-500">{subtitle}</p> : null}
                </header>

                <div className="mt-7 grid gap-8">
                  {visibleGroups.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-lg font-black text-slate-500 ring-1 ring-slate-200">{labels.menuNoProducts}</p>
                  ) : null}
                  {visibleGroups.map((group) => (
                    <section key={group} className="break-inside-avoid">
                      <h4 className="border-b border-slate-200 pb-2 text-2xl font-black tracking-tight">{groupLabels[group][language]}</h4>
                      <div className="mt-4 grid gap-3">
                        {groupedProducts[group].map((product) => {
                          const imageCrop = product.imageCrop ?? defaultImageCrop;
                          const allergenText = formatAllergenCodes(product.allergens);

                          return (
                            <div key={product.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                              {showImages ? (
                                <span className={"flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-white text-3xl ring-1 ring-slate-200 " + (product.image ? "" : "p-2")}>
                                  {product.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={product.image}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      style={{
                                        objectPosition: imageCrop.x + "% " + imageCrop.y + "%",
                                        transform: "scale(" + imageCrop.zoom + ")",
                                        transformOrigin: imageCrop.x + "% " + imageCrop.y + "%",
                                      }}
                                    />
                                  ) : (
                                    <span aria-hidden="true">{product.icon}</span>
                                  )}
                                </span>
                              ) : null}
                              <div className="min-w-0">
                                <p className="truncate text-lg font-black">{product.name[language]}</p>
                                {allergenText ? (
                                  <p className="mt-1 text-sm font-black tracking-wide text-slate-500">{allergenText}</p>
                                ) : null}
                              </div>
                              {showPrices ? <p className="text-lg font-black tabular-nums">{currency.format(product.price)}</p> : null}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
