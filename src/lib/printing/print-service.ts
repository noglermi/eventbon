import type { PrintMode } from "@/components/sales-terminal/types";
import { getPrinterProfile, type PrinterSettings } from "./printer-profile";
import { browserPrintRenderer, type PrintVoucherLine } from "./print-renderer";

export type PrintFlowKind = "setupPrintPreview" | "cashierDirectPrintCandidate";

export type BonPrintJob = {
  flow: PrintFlowKind;
  pageStyle: ReturnType<typeof browserPrintRenderer.createPageStyle>;
  profile: ReturnType<typeof getPrinterProfile>;
  printerStyle: ReturnType<typeof browserPrintRenderer.createPrinterStyle>;
  vouchers: ReturnType<typeof browserPrintRenderer.createVouchers>;
};

export type PrintService = {
  createBonPrintJob: (input: { flow?: PrintFlowKind; lines: PrintVoucherLine[]; printMode: PrintMode; printerSettings: PrinterSettings }) => BonPrintJob;
  requestBrowserPrint: (onPrinted?: () => void) => void;
};

export const printService: PrintService = {
  createBonPrintJob(input) {
    return {
      flow: input.flow ?? "cashierDirectPrintCandidate",
      pageStyle: browserPrintRenderer.createPageStyle(input.printerSettings),
      profile: getPrinterProfile(input.printerSettings.profileId),
      printerStyle: browserPrintRenderer.createPrinterStyle(input.printerSettings),
      vouchers: browserPrintRenderer.createVouchers(input.lines, input.printMode),
    };
  },
  requestBrowserPrint(onPrinted) {
    window.print();
    onPrinted?.();
  },
};
