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
  createPrinterStyle: (settings: PrinterSettings) => CSSProperties;
  createVouchers: (lines: PrintVoucherLine[], printMode: PrintMode) => PrintVoucher[];
};

function getDensityFontAdjustment(settings: PrinterSettings) {
  return settings.density === "compact" ? -0.5 : 0;
}

export function createPrinterStyle(settings: PrinterSettings): CSSProperties {
  const profile = getPrinterProfile(settings.profileId);
  const browserCss = profile.browserPrintCss;
  const printableWidthMm = Math.max(40, settings.paperWidthMm - browserCss.horizontalMarginMm * 2);
  const fontSizePt = Math.max(8, browserCss.fontSizePt + getDensityFontAdjustment(settings));

  return {
    "--printer-paper-width": settings.paperWidthMm + "mm",
    "--printer-printable-width": printableWidthMm + "mm",
    "--printer-ticket-padding": browserCss.ticketPaddingMm + "mm",
    "--printer-ticket-gap": (settings.cutMode === "cutter" ? Math.max(browserCss.ticketGapMm, 6) : browserCss.ticketGapMm) + "mm",
    "--printer-font-size": fontSizePt + "pt",
    "--printer-line-gap": browserCss.lineGapMm + "mm",
    "--printer-cut-line-margin-top": browserCss.cutLineMarginTopMm + "mm",
  } as CSSProperties;
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
  createPrinterStyle,
  createVouchers,
};
