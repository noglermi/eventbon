import type { Language, TileGroupName } from "./types";

export const viewSettingsStorageKey = "eventbon.viewSettings.v1";

export type ViewSettings = {
  blockZoom: Record<"articles" | "cart" | "payment", number>;
  language: Language;
  visibleCategories: Record<TileGroupName, boolean>;
};

const validLanguages: Language[] = ["de", "en"];
const validZoomValues = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
const categoryKeys: TileGroupName[] = ["Drinks", "Food", "Desserts", "Other"];

export const defaultViewSettings: ViewSettings = {
  blockZoom: {
    articles: 100,
    cart: 100,
    payment: 100,
  },
  language: "de",
  visibleCategories: {
    Drinks: true,
    Food: true,
    Desserts: true,
    Other: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeZoom(value: unknown, fallback: number) {
  return typeof value === "number" && validZoomValues.includes(value) ? value : fallback;
}

function normalizeLanguage(value: unknown) {
  return typeof value === "string" && validLanguages.includes(value as Language) ? value as Language : defaultViewSettings.language;
}

function normalizeVisibleCategories(value: unknown) {
  const stored = isRecord(value) ? value : {};

  return categoryKeys.reduce((categories, category) => {
    categories[category] = typeof stored[category] === "boolean" ? stored[category] : defaultViewSettings.visibleCategories[category];
    return categories;
  }, { ...defaultViewSettings.visibleCategories });
}

function normalizeBlockZoom(value: unknown) {
  const stored = isRecord(value) ? value : {};

  return {
    articles: normalizeZoom(stored.articles, defaultViewSettings.blockZoom.articles),
    cart: normalizeZoom(stored.cart, defaultViewSettings.blockZoom.cart),
    payment: normalizeZoom(stored.payment, defaultViewSettings.blockZoom.payment),
  };
}

export function readViewSettings() {
  if (typeof window === "undefined") {
    return defaultViewSettings;
  }

  try {
    const rawValue = window.localStorage.getItem(viewSettingsStorageKey);

    if (!rawValue) {
      return defaultViewSettings;
    }

    const parsed = JSON.parse(rawValue) as unknown;
    const stored = isRecord(parsed) ? parsed : {};

    return {
      blockZoom: normalizeBlockZoom(stored.blockZoom),
      language: normalizeLanguage(stored.language),
      visibleCategories: normalizeVisibleCategories(stored.visibleCategories),
    };
  } catch {
    return defaultViewSettings;
  }
}

export function writeViewSettings(settings: ViewSettings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(viewSettingsStorageKey, JSON.stringify(settings));
  } catch {
    // Device-local preferences are optional; the terminal keeps working with in-memory defaults.
  }
}
