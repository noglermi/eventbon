export type PrinterProfileId = "generic_58" | "generic_80" | "brother_td_label" | "epson_receipt" | "star_receipt";
export type PrinterLayoutDensity = "compact" | "comfortable";
export type PrinterCutMode = "tear" | "cutter";

export type PrinterSettings = {
  cutMode: PrinterCutMode;
  density: PrinterLayoutDensity;
  paperWidthMm: number;
  profileId: PrinterProfileId;
};

export type BrowserPrintCssProfile = {
  horizontalMarginMm: number;
  ticketPaddingMm: number;
  ticketPaddingBottomMm?: number;
  ticketPaddingLeftMm?: number;
  ticketPaddingRightMm?: number;
  ticketPaddingTopMm?: number;
  ticketGapMm: number;
  fontSizePt: number;
  lineGapMm: number;
  cutLineMarginTopMm: number;
};

export type PrinterProfile = {
  id: PrinterProfileId;
  label: {
    de: string;
    en: string;
  };
  testPrintName: string;
  paperWidthMm: number;
  paperHeightMm?: number;
  isFixedMedia?: boolean;
  density: PrinterLayoutDensity;
  cutMode: PrinterCutMode;
  browserPrintCss: BrowserPrintCssProfile;
};

export const printerProfiles: PrinterProfile[] = [
  {
    id: "generic_58",
    paperWidthMm: 58,
    density: "compact",
    cutMode: "tear",
    label: { de: "Generic 58 mm Receipt", en: "Generic 58 mm Receipt" },
    testPrintName: "Generic 58 mm Receipt",
    browserPrintCss: {
      horizontalMarginMm: 3,
      ticketPaddingMm: 2,
      ticketGapMm: 4,
      fontSizePt: 10,
      lineGapMm: 1,
      cutLineMarginTopMm: 4,
    },
  },
  {
    id: "generic_80",
    paperWidthMm: 80,
    density: "comfortable",
    cutMode: "tear",
    label: { de: "Generic 80 mm Receipt", en: "Generic 80 mm Receipt" },
    testPrintName: "Generic 80 mm Receipt",
    browserPrintCss: {
      horizontalMarginMm: 4,
      ticketPaddingMm: 3,
      ticketGapMm: 5,
      fontSizePt: 11,
      lineGapMm: 1.5,
      cutLineMarginTopMm: 5,
    },
  },
  {
    id: "brother_td_label",
    paperWidthMm: 58,
    paperHeightMm: 60,
    isFixedMedia: true,
    density: "compact",
    cutMode: "cutter",
    label: { de: "Brother TD-4000 - 58 × 60 mm", en: "Brother TD-4000 - 58 × 60 mm" },
    testPrintName: "Brother TD-4000",
    browserPrintCss: {
      horizontalMarginMm: 0,
      ticketPaddingMm: 3,
      ticketPaddingBottomMm: 4,
      ticketPaddingLeftMm: 3,
      ticketPaddingRightMm: 3,
      ticketPaddingTopMm: 3,
      ticketGapMm: 0,
      fontSizePt: 8.8,
      lineGapMm: 1,
      cutLineMarginTopMm: 3,
    },
  },
  {
    id: "epson_receipt",
    paperWidthMm: 80,
    density: "comfortable",
    cutMode: "cutter",
    label: { de: "Epson Receipt", en: "Epson Receipt" },
    testPrintName: "Epson Receipt",
    browserPrintCss: {
      horizontalMarginMm: 4,
      ticketPaddingMm: 3,
      ticketGapMm: 6,
      fontSizePt: 11,
      lineGapMm: 1.5,
      cutLineMarginTopMm: 5,
    },
  },
  {
    id: "star_receipt",
    paperWidthMm: 80,
    density: "comfortable",
    cutMode: "cutter",
    label: { de: "Star Receipt", en: "Star Receipt" },
    testPrintName: "Star Receipt",
    browserPrintCss: {
      horizontalMarginMm: 4,
      ticketPaddingMm: 3,
      ticketGapMm: 6,
      fontSizePt: 11,
      lineGapMm: 1.5,
      cutLineMarginTopMm: 5,
    },
  },
];

export const defaultPrinterSettings: PrinterSettings = {
  cutMode: "tear",
  density: "compact",
  paperWidthMm: 58,
  profileId: "generic_58",
};

const legacyProfileIds: Record<string, PrinterProfileId> = {
  brother_td_4000: "brother_td_label",
  generic_a4: "generic_80",
};

const profileIds = printerProfiles.map((profile) => profile.id);
const densityValues: PrinterLayoutDensity[] = ["compact", "comfortable"];
const cutModeValues: PrinterCutMode[] = ["tear", "cutter"];

export function getPrinterProfile(profileId: PrinterProfileId) {
  return printerProfiles.find((profile) => profile.id === profileId) ?? printerProfiles[0];
}

export function normalizePrinterProfileId(value: unknown): PrinterProfileId {
  if (typeof value !== "string") {
    return defaultPrinterSettings.profileId;
  }

  if (profileIds.includes(value as PrinterProfileId)) {
    return value as PrinterProfileId;
  }

  return legacyProfileIds[value] ?? defaultPrinterSettings.profileId;
}

export function normalizePrinterPaperWidth(value: unknown, fallback: number) {
  const numericValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(numericValue) && numericValue >= 40 && numericValue <= 220 ? numericValue : fallback;
}

export function normalizePrinterDensity(value: unknown, fallback: PrinterLayoutDensity) {
  return typeof value === "string" && densityValues.includes(value as PrinterLayoutDensity) ? value as PrinterLayoutDensity : fallback;
}

export function normalizePrinterCutMode(value: unknown, fallback: PrinterCutMode) {
  return typeof value === "string" && cutModeValues.includes(value as PrinterCutMode) ? value as PrinterCutMode : fallback;
}
