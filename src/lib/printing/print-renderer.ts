import type { CSSProperties } from "react";
import type { PrintMode } from "@/components/sales-terminal/types";
import { getPrinterProfile, type PrinterSettings } from "./printer-profile";

export type PrintVoucherLine = {
  id: string;
  name: string;
  quantity: number;
};

export type PrintVoucher = {
  id: string;
  lines: PrintVoucherLine[];
};

export type PrintRenderer = {
  createPageStyle: (settings: PrinterSettings) => string;
  createPrinterStyle: (settings: PrinterSettings) => CSSProperties;
  createVouchers: (lines: PrintVoucherLine[], printMode: PrintMode) => PrintVoucher[];
};

function getDensityFontAdjustment(settings: PrinterSettings) {
  return settings.density === "compact" ? -0.5 : 0;
}

export function createPrinterStyle(settings: PrinterSettings): CSSProperties {
  const profile = getPrinterProfile(settings.profileId);
  const browserCss = profile.browserPrintCss;
  const paperWidthMm = profile.isFixedMedia ? profile.paperWidthMm : settings.paperWidthMm;
  const printableWidthMm = profile.isFixedMedia ? profile.paperWidthMm : Math.max(40, paperWidthMm - browserCss.horizontalMarginMm * 2);
  const fontSizePt = Math.max(8, browserCss.fontSizePt + getDensityFontAdjustment(settings));
  const ticketPadding = [
    browserCss.ticketPaddingTopMm ?? browserCss.ticketPaddingMm,
    browserCss.ticketPaddingRightMm ?? browserCss.ticketPaddingMm,
    browserCss.ticketPaddingBottomMm ?? browserCss.ticketPaddingMm,
    browserCss.ticketPaddingLeftMm ?? browserCss.ticketPaddingMm,
  ].map((value) => value + "mm").join(" ");

  return {
    "--printer-paper-width": paperWidthMm + "mm",
    "--printer-paper-height": profile.paperHeightMm ? profile.paperHeightMm + "mm" : "auto",
    "--printer-printable-width": printableWidthMm + "mm",
    "--printer-ticket-height": profile.paperHeightMm ? profile.paperHeightMm + "mm" : "auto",
    "--printer-ticket-padding": ticketPadding,
    "--printer-ticket-gap": (profile.isFixedMedia ? browserCss.ticketGapMm : settings.cutMode === "cutter" ? Math.max(browserCss.ticketGapMm, 6) : browserCss.ticketGapMm) + "mm",
    "--printer-font-size": fontSizePt + "pt",
    "--printer-line-gap": browserCss.lineGapMm + "mm",
    "--printer-cut-line-margin-top": browserCss.cutLineMarginTopMm + "mm",
  } as CSSProperties;
}

export function createPageStyle(settings: PrinterSettings) {
  const profile = getPrinterProfile(settings.profileId);

  if (profile.isFixedMedia && profile.paperHeightMm) {
    return "@media print { @page { size: " + profile.paperWidthMm + "mm " + profile.paperHeightMm + "mm; margin: 0; } }";
  }

  return "@media print { @page { size: auto; margin: 0; } }";
}

export function createVouchers(lines: PrintVoucherLine[], printMode: PrintMode): PrintVoucher[] {
  if (printMode === "single_vouchers") {
    return lines.flatMap((line) => Array.from({ length: line.quantity }, (_, index) => ({
      id: line.id + "-" + index,
      lines: [{ ...line, quantity: 1 }],
    })));
  }

  return [{ id: "combined", lines }];
}

export const browserPrintRenderer: PrintRenderer = {
  createPageStyle,
  createPrinterStyle,
  createVouchers,
};
