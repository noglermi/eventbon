export type PrinterProfileId = "generic_58" | "generic_80" | "brother_td_label" | "munbyn_80_pending" | "epson_receipt" | "star_receipt";
export type PrinterLayoutDensity = "compact" | "comfortable";
export type PrinterCutMode = "tear" | "cutter";
export type PrintOutputMode = "browser" | "qz_tray";
export type PrinterSupportStatus = "supported" | "tested" | "testing_pending" | "legacy" | "not_recommended";
export type PrinterType = "thermal_label" | "thermal_receipt" | "receipt";

export type PrinterSettings = {
  cutMode: PrinterCutMode;
  density: PrinterLayoutDensity;
  lastTestPrintedAt?: string | null;
  outputMode: PrintOutputMode;
  paperWidthMm: number;
  profileId: PrinterProfileId;
  qzPrinterName: string;
  setupCompleted?: boolean;
  testConfirmed?: boolean;
  testConfirmedAt?: string | null;
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
  active: boolean;
  browserPrintCss: BrowserPrintCssProfile;
  connectionOptions: string[];
  cutMode: PrinterCutMode;
  density: PrinterLayoutDensity;
  description: Record<"de" | "en", string>;
  displayName: string;
  driverHint: Record<"de" | "en", string>;
  driverUrl?: string;
  hasCutter: boolean;
  id: PrinterProfileId;
  installationGuide: Record<"de" | "en", string[]>;
  isFixedMedia?: boolean;
  knownNotes: Record<"de" | "en", string[]>;
  label: Record<"de" | "en", string>;
  lastTestedAt?: string | null;
  manufacturer: string;
  model: string;
  paperHeightMm?: number;
  paperWidthMm: number;
  printerType: PrinterType;
  qzPrinterHints: string[];
  recommendedSettings: Record<"de" | "en", string[]>;
  requiredSoftware: string[];
  status: PrinterSupportStatus;
  supportedPlatforms: string[];
  testPrintName: string;
  testStatus: Record<"de" | "en", string>;
  testedEventBonVersion?: string | null;
};

const genericBrowser58: BrowserPrintCssProfile = {
  horizontalMarginMm: 3,
  ticketPaddingMm: 2,
  ticketGapMm: 4,
  fontSizePt: 10,
  lineGapMm: 1,
  cutLineMarginTopMm: 4,
};

const genericBrowser80: BrowserPrintCssProfile = {
  horizontalMarginMm: 4,
  ticketPaddingMm: 3,
  ticketGapMm: 5,
  fontSizePt: 11,
  lineGapMm: 1.5,
  cutLineMarginTopMm: 5,
};

export const printerProfiles: PrinterProfile[] = [
  {
    id: "brother_td_label",
    manufacturer: "Brother",
    model: "TD-4000",
    displayName: "Brother TD-4000 - 58 x 60 mm",
    status: "legacy",
    description: {
      de: "Getestetes Bestandsger\u00e4t. Weiterhin ausw\u00e4hlbar, aber nicht als bevorzugtes Neukauf-Modell gedacht.",
      en: "Tested existing device. Still selectable, but not positioned as the preferred new purchase model.",
    },
    printerType: "thermal_label",
    connectionOptions: ["USB"],
    hasCutter: true,
    supportedPlatforms: ["Windows"],
    requiredSoftware: ["QZ Tray", "Brother Windows driver"],
    driverHint: {
      de: "Brother TD-4000 Windows-Treiber installieren. QZ Tray muss laufen.",
      en: "Install the Brother TD-4000 Windows driver. QZ Tray must be running.",
    },
    installationGuide: {
      de: [
        "Brother TD-4000 per USB anschließen und einschalten.",
        "Brother Windows-Treiber installieren.",
        "58 x 60 mm Medium einlegen.",
        "QZ Tray starten und Drucker in EventBon auswählen.",
        "EventBon-Testbon drucken und Schnitt prüfen.",
      ],
      en: [
        "Connect and power on the Brother TD-4000 via USB.",
        "Install the Brother Windows driver.",
        "Load 58 x 60 mm media.",
        "Start QZ Tray and select the printer in eventBon.",
        "Print the eventBon test voucher and check cutting.",
      ],
    },
    testStatus: { de: "Getestetes Bestandsger\u00e4t.", en: "Tested existing device." },
    lastTestedAt: null,
    testedEventBonVersion: null,
    knownNotes: {
      de: ["Fixes 58 x 60 mm Medium.", "Schnitt erfolgt über Windows/Brother-Treiber an Job-Grenzen."],
      en: ["Fixed 58 x 60 mm media.", "Cutting is handled by the Windows/Brother driver at job boundaries."],
    },
    recommendedSettings: {
      de: ["Profil Brother TD-4000 - 58 x 60 mm", "QZ Tray Direktdruck", "Einzelbons als getrennte Druckjobs"],
      en: ["Brother TD-4000 - 58 x 60 mm profile", "QZ Tray direct print", "Single vouchers as separate print jobs"],
    },
    qzPrinterHints: ["Brother", "TD-4000", "TD"],
    active: true,
    paperWidthMm: 58,
    paperHeightMm: 60,
    isFixedMedia: true,
    density: "compact",
    cutMode: "cutter",
    label: { de: "Brother TD-4000 - 58 x 60 mm", en: "Brother TD-4000 - 58 x 60 mm" },
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
    id: "munbyn_80_pending",
    manufacturer: "MUNBYN",
    model: "80-mm-Thermobondrucker",
    displayName: "MUNBYN 80-mm-Thermobondrucker",
    status: "testing_pending",
    description: {
      de: "Test ausstehend - dieses Modell wurde noch nicht vollst\u00e4ndig mit EventBon gepr\u00fcft.",
      en: "Testing pending - this model has not yet been fully verified with eventBon.",
    },
    printerType: "thermal_receipt",
    connectionOptions: ["USB", "LAN abhängig vom Modell"],
    hasCutter: true,
    supportedPlatforms: ["Windows"],
    requiredSoftware: ["QZ Tray", "Windows printer driver"],
    driverHint: {
      de: "Treiber und genaue Modellbezeichnung nach Hardwaretest erg\u00e4nzen.",
      en: "Driver and exact model name to be added after hardware testing.",
    },
    installationGuide: {
      de: [
        "Drucker erst nach Lieferung physisch prüfen.",
        "Bondrucker in Windows einrichten.",
        "80-mm-Papierrolle einlegen.",
        "QZ Tray starten und Drucker in EventBon auswählen.",
        "EventBon-Testbon inklusive Umlauten, Eurozeichen und Cutter prüfen.",
      ],
      en: [
        "Physically verify the printer after delivery.",
        "Install the Windows printer driver.",
        "Load 80 mm paper.",
        "Start QZ Tray and select the printer in eventBon.",
        "Print the eventBon test voucher including umlauts, euro sign, and cutter check.",
      ],
    },
    testStatus: {
      de: "Test ausstehend - dieses Modell wurde noch nicht vollst\u00e4ndig mit EventBon gepr\u00fcft.",
      en: "Testing pending - this model has not yet been fully verified with eventBon.",
    },
    lastTestedAt: null,
    testedEventBonVersion: null,
    knownNotes: {
      de: ["Noch keine erfolgreiche EventBon-Installation oder Druckkompatibilität behaupten.", "ESC/POS-Kompatibilität erst nach Test bestätigen."],
      en: ["Do not claim successful eventBon installation or print compatibility yet.", "Confirm ESC/POS compatibility only after testing."],
    },
    recommendedSettings: {
      de: ["80 mm Papierbreite", "QZ Tray vorgesehen", "Cutter nach Praxistest prüfen"],
      en: ["80 mm paper width", "QZ Tray intended", "Verify cutter after practical test"],
    },
    qzPrinterHints: ["MUNBYN", "80"],
    active: true,
    paperWidthMm: 80,
    density: "comfortable",
    cutMode: "cutter",
    label: { de: "MUNBYN 80 mm - Test ausstehend", en: "MUNBYN 80 mm - testing pending" },
    testPrintName: "MUNBYN 80 mm",
    browserPrintCss: {
      ...genericBrowser80,
      ticketGapMm: 6,
      cutLineMarginTopMm: 5,
    },
  },
  {
    id: "generic_58",
    manufacturer: "Generic",
    model: "58 mm Receipt",
    displayName: "Generic 58 mm Receipt",
    status: "supported",
    description: {
      de: "Generisches 58-mm-Profil für einfache Bon-Drucker.",
      en: "Generic 58 mm profile for simple receipt printers.",
    },
    printerType: "thermal_receipt",
    connectionOptions: ["USB"],
    hasCutter: false,
    supportedPlatforms: ["Windows"],
    requiredSoftware: ["Windows printer driver"],
    driverHint: { de: "Drucker in Windows installieren.", en: "Install the printer in Windows." },
    installationGuide: { de: ["Bondrucker in Windows einrichten.", "Papierbreite 58 mm prüfen.", "Testbon drucken."], en: ["Set up the receipt printer in Windows.", "Check 58 mm paper.", "Print test voucher."] },
    testStatus: { de: "Unterstütztes generisches Profil, kein zertifiziertes Modell.", en: "Supported generic profile, no certified model." },
    lastTestedAt: null,
    testedEventBonVersion: null,
    knownNotes: { de: ["Nur generisches Fallback-Profil."], en: ["Generic fallback profile only."] },
    recommendedSettings: { de: ["58 mm Papierbreite", "QZ Tray Bondruck"], en: ["58 mm paper width", "QZ Tray receipt printing"] },
    qzPrinterHints: [],
    active: true,
    paperWidthMm: 58,
    density: "compact",
    cutMode: "tear",
    label: { de: "Generic 58 mm Receipt", en: "Generic 58 mm Receipt" },
    testPrintName: "Generic 58 mm Receipt",
    browserPrintCss: genericBrowser58,
  },
  {
    id: "generic_80",
    manufacturer: "Generic",
    model: "80 mm Receipt",
    displayName: "Generic 80 mm Receipt",
    status: "supported",
    description: {
      de: "Generisches 80-mm-Profil für Thermobondrucker.",
      en: "Generic 80 mm profile for thermal receipt printers.",
    },
    printerType: "thermal_receipt",
    connectionOptions: ["USB", "LAN"],
    hasCutter: false,
    supportedPlatforms: ["Windows"],
    requiredSoftware: ["Windows printer driver"],
    driverHint: { de: "Drucker in Windows installieren.", en: "Install the printer in Windows." },
    installationGuide: { de: ["Bondrucker in Windows einrichten.", "Papierbreite 80 mm prüfen.", "Testbon drucken."], en: ["Set up the receipt printer in Windows.", "Check 80 mm paper.", "Print test voucher."] },
    testStatus: { de: "Unterstütztes generisches Profil, kein zertifiziertes Modell.", en: "Supported generic profile, no certified model." },
    lastTestedAt: null,
    testedEventBonVersion: null,
    knownNotes: { de: ["Nur generisches Fallback-Profil."], en: ["Generic fallback profile only."] },
    recommendedSettings: { de: ["80 mm Papierbreite"], en: ["80 mm paper width"] },
    qzPrinterHints: [],
    active: true,
    paperWidthMm: 80,
    density: "comfortable",
    cutMode: "tear",
    label: { de: "Generic 80 mm Receipt", en: "Generic 80 mm Receipt" },
    testPrintName: "Generic 80 mm Receipt",
    browserPrintCss: genericBrowser80,
  },
  {
    id: "epson_receipt",
    manufacturer: "Epson",
    model: "Receipt",
    displayName: "Epson Receipt",
    status: "testing_pending",
    description: { de: "Zukünftiger Epson-Profilpfad, noch nicht zertifiziert.", en: "Future Epson profile path, not certified yet." },
    printerType: "receipt",
    connectionOptions: ["USB", "LAN"],
    hasCutter: true,
    supportedPlatforms: ["Windows"],
    requiredSoftware: ["QZ Tray or future ePOS adapter", "Windows printer driver"],
    driverHint: { de: "Erst nach Hardwarezertifizierung verwenden.", en: "Use only after hardware certification." },
    installationGuide: { de: ["Hardwaretest ausstehend."], en: ["Hardware test pending."] },
    testStatus: { de: "Test ausstehend.", en: "Testing pending." },
    lastTestedAt: null,
    testedEventBonVersion: null,
    knownNotes: { de: ["Noch nicht für den produktiven Einsatz freigegeben."], en: ["Not released for production use yet."] },
    recommendedSettings: { de: ["Nach Zertifizierung ergänzen."], en: ["Add after certification."] },
    qzPrinterHints: ["Epson"],
    active: false,
    paperWidthMm: 80,
    density: "comfortable",
    cutMode: "cutter",
    label: { de: "Epson Receipt", en: "Epson Receipt" },
    testPrintName: "Epson Receipt",
    browserPrintCss: { ...genericBrowser80, ticketGapMm: 6, cutLineMarginTopMm: 5 },
  },
  {
    id: "star_receipt",
    manufacturer: "Star",
    model: "Receipt",
    displayName: "Star Receipt",
    status: "testing_pending",
    description: { de: "Zukünftiger Star-Profilpfad, noch nicht zertifiziert.", en: "Future Star profile path, not certified yet." },
    printerType: "receipt",
    connectionOptions: ["USB", "LAN"],
    hasCutter: true,
    supportedPlatforms: ["Windows"],
    requiredSoftware: ["QZ Tray or future webPRNT adapter", "Windows printer driver"],
    driverHint: { de: "Erst nach Hardwarezertifizierung verwenden.", en: "Use only after hardware certification." },
    installationGuide: { de: ["Hardwaretest ausstehend."], en: ["Hardware test pending."] },
    testStatus: { de: "Test ausstehend.", en: "Testing pending." },
    lastTestedAt: null,
    testedEventBonVersion: null,
    knownNotes: { de: ["Noch nicht für den produktiven Einsatz freigegeben."], en: ["Not released for production use yet."] },
    recommendedSettings: { de: ["Nach Zertifizierung ergänzen."], en: ["Add after certification."] },
    qzPrinterHints: ["Star"],
    active: false,
    paperWidthMm: 80,
    density: "comfortable",
    cutMode: "cutter",
    label: { de: "Star Receipt", en: "Star Receipt" },
    testPrintName: "Star Receipt",
    browserPrintCss: { ...genericBrowser80, ticketGapMm: 6, cutLineMarginTopMm: 5 },
  },
];

export const defaultPrinterSettings: PrinterSettings = {
  cutMode: "cutter",
  density: "compact",
  lastTestPrintedAt: null,
  outputMode: "qz_tray",
  paperWidthMm: 58,
  profileId: "brother_td_label",
  qzPrinterName: "",
  setupCompleted: false,
  testConfirmed: false,
  testConfirmedAt: null,
};

const legacyProfileIds: Record<string, PrinterProfileId> = {
  brother_td_4000: "brother_td_label",
  generic_a4: "generic_80",
};

const profileIds = printerProfiles.map((profile) => profile.id);
const densityValues: PrinterLayoutDensity[] = ["compact", "comfortable"];
const cutModeValues: PrinterCutMode[] = ["tear", "cutter"];
const outputModeValues: PrintOutputMode[] = ["browser", "qz_tray"];

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

export function normalizePrintOutputMode(value: unknown): PrintOutputMode {
  return typeof value === "string" && outputModeValues.includes(value as PrintOutputMode) ? value as PrintOutputMode : defaultPrinterSettings.outputMode;
}

export function normalizeQzPrinterName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOptionalIsoDate(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function normalizeBoolean(value: unknown) {
  return value === true;
}
