export type PrinterProfileId = "generic_58" | "generic_80" | "brother_td_4000" | "generic_a4";
export type PrinterLayoutDensity = "compact" | "comfortable";
export type PrinterCutMode = "tear" | "cutter";

export type PrinterSettings = {
  cutMode: PrinterCutMode;
  density: PrinterLayoutDensity;
  paperWidthMm: number;
  profileId: PrinterProfileId;
};

export type PrinterProfile = PrinterSettings & {
  label: {
    de: string;
    en: string;
  };
};

export const printerSettingsStorageKey = "eventbon.printerSettings.v1";

export const printerProfiles: PrinterProfile[] = [
  {
    profileId: "generic_58",
    paperWidthMm: 58,
    density: "compact",
    cutMode: "tear",
    label: { de: "Generischer 58 mm Bon-Drucker", en: "Generic 58 mm receipt printer" },
  },
  {
    profileId: "generic_80",
    paperWidthMm: 80,
    density: "comfortable",
    cutMode: "tear",
    label: { de: "Generischer 80 mm Bon-Drucker", en: "Generic 80 mm receipt printer" },
  },
  {
    profileId: "brother_td_4000",
    paperWidthMm: 102,
    density: "comfortable",
    cutMode: "cutter",
    label: { de: "Brother TD-4000", en: "Brother TD-4000" },
  },
  {
    profileId: "generic_a4",
    paperWidthMm: 190,
    density: "comfortable",
    cutMode: "tear",
    label: { de: "Generischer A4-Testdrucker", en: "Generic A4 test printer" },
  },
];

export const defaultPrinterSettings: PrinterSettings = {
  cutMode: "tear",
  density: "compact",
  paperWidthMm: 58,
  profileId: "generic_58",
};

const profileIds = printerProfiles.map((profile) => profile.profileId);
const densityValues: PrinterLayoutDensity[] = ["compact", "comfortable"];
const cutModeValues: PrinterCutMode[] = ["tear", "cutter"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clonePrinterSettings(settings: PrinterSettings): PrinterSettings {
  return { ...settings };
}

export function getPrinterProfile(profileId: PrinterProfileId) {
  return printerProfiles.find((profile) => profile.profileId === profileId) ?? printerProfiles[0];
}

function normalizeProfileId(value: unknown): PrinterProfileId {
  return typeof value === "string" && profileIds.includes(value as PrinterProfileId) ? value as PrinterProfileId : defaultPrinterSettings.profileId;
}

function normalizePaperWidth(value: unknown, fallback: number) {
  const numericValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(numericValue) && numericValue >= 40 && numericValue <= 220 ? numericValue : fallback;
}

function normalizeDensity(value: unknown, fallback: PrinterLayoutDensity) {
  return typeof value === "string" && densityValues.includes(value as PrinterLayoutDensity) ? value as PrinterLayoutDensity : fallback;
}

function normalizeCutMode(value: unknown, fallback: PrinterCutMode) {
  return typeof value === "string" && cutModeValues.includes(value as PrinterCutMode) ? value as PrinterCutMode : fallback;
}

export function loadPrinterSettings() {
  if (typeof window === "undefined") {
    return clonePrinterSettings(defaultPrinterSettings);
  }

  try {
    const rawValue = window.localStorage.getItem(printerSettingsStorageKey);
    if (!rawValue) {
      return clonePrinterSettings(defaultPrinterSettings);
    }

    const parsed = JSON.parse(rawValue) as unknown;
    const stored = isRecord(parsed) ? parsed : {};
    const profileId = normalizeProfileId(stored.profileId);
    const profile = getPrinterProfile(profileId);

    return {
      profileId,
      paperWidthMm: normalizePaperWidth(stored.paperWidthMm, profile.paperWidthMm),
      density: normalizeDensity(stored.density, profile.density),
      cutMode: normalizeCutMode(stored.cutMode, profile.cutMode),
    };
  } catch {
    return clonePrinterSettings(defaultPrinterSettings);
  }
}

export function savePrinterSettings(settings: PrinterSettings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(printerSettingsStorageKey, JSON.stringify(settings));
  } catch {
    // Device-local printer settings are optional; browser printing still works with defaults.
  }
}
