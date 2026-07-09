import {
  defaultPrinterSettings,
  getPrinterProfile,
  normalizePrintOutputMode,
  normalizePrinterCutMode,
  normalizePrinterDensity,
  normalizePrinterPaperWidth,
  normalizePrinterProfileId,
  normalizeQzPrinterName,
  printerProfiles,
  type PrintOutputMode,
  type PrinterCutMode,
  type PrinterLayoutDensity,
  type PrinterProfile,
  type PrinterProfileId,
  type PrinterSettings,
} from "@/lib/printing/printer-profile";

export {
  defaultPrinterSettings,
  getPrinterProfile,
  printerProfiles,
  type PrintOutputMode,
  type PrinterCutMode,
  type PrinterLayoutDensity,
  type PrinterProfile,
  type PrinterProfileId,
  type PrinterSettings,
};

export const printerSettingsStorageKey = "eventbon.printerSettings.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clonePrinterSettings(settings: PrinterSettings): PrinterSettings {
  return { ...settings };
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
    const profileId = normalizePrinterProfileId(stored.profileId);
    const profile = getPrinterProfile(profileId);

    return {
      profileId,
      paperWidthMm: profile.isFixedMedia ? profile.paperWidthMm : normalizePrinterPaperWidth(stored.paperWidthMm, profile.paperWidthMm),
      density: normalizePrinterDensity(stored.density, profile.density),
      cutMode: normalizePrinterCutMode(stored.cutMode, profile.cutMode),
      outputMode: normalizePrintOutputMode(stored.outputMode),
      qzPrinterName: normalizeQzPrinterName(stored.qzPrinterName),
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
