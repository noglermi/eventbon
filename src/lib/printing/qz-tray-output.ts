import type { Translation } from "@/components/sales-terminal/i18n";
import type { Language } from "@/components/sales-terminal/types";
import { formatDateTime } from "@/lib/date-format";
import type { BonPrintJob } from "./print-service";
import type { PrinterSettings } from "./printer-profile";
import type { PrintVoucher } from "./print-renderer";
import { configureQzSecurity } from "./qz-security";

type QzTray = typeof import("qz-tray").default;

export class QzTrayUnavailableError extends Error {
  constructor(message = "QZ Tray is not reachable.") {
    super(message);
    this.name = "QzTrayUnavailableError";
  }
}

export class QzTrayPrintJobError extends Error {
  voucherCount: number;
  voucherIndex: number;
  voucherLabel: string;

  constructor(message: string, input: { voucherCount: number; voucherIndex: number; voucherLabel: string }) {
    super(message);
    this.name = "QzTrayPrintJobError";
    this.voucherCount = input.voucherCount;
    this.voucherIndex = input.voucherIndex;
    this.voucherLabel = input.voucherLabel;
  }
}

async function loadQzTray() {
  const qzModule = (await import("qz-tray")).default;
  configureQzSecurity(qzModule);
  return qzModule;
}

async function connectQzTray(qz: QzTray) {
  if (qz.websocket.isActive()) {
    return;
  }

  try {
    await qz.websocket.connect();
  } catch (error) {
    throw new QzTrayUnavailableError(error instanceof Error ? error.message : "QZ Tray is not reachable.");
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function describeVoucher(voucher: PrintVoucher) {
  return voucher.lines.map((line) => line.quantity + " x " + line.name).join(", ");
}

function getVoucherTypography(lineCount: number) {
  if (lineCount >= 6) {
    return { nameSize: "8.5pt", quantitySize: "10pt", lineGap: "0.7mm" };
  }

  if (lineCount >= 4) {
    return { nameSize: "10pt", quantitySize: "12pt", lineGap: "0.9mm" };
  }

  if (lineCount >= 2) {
    return { nameSize: "13pt", quantitySize: "15pt", lineGap: "1.3mm" };
  }

  return { nameSize: "18pt", quantitySize: "20pt", lineGap: "1.8mm" };
}

function createSingleVoucherHtml(input: {
  eventName: string;
  labels: Translation;
  language: Language;
  printJob: BonPrintJob;
  printedAt: Date;
  reprintLabel?: string | null;
  voucher: PrintVoucher;
  voucherCount: number;
  voucherIndex: number;
}) {
  const printedAtText = formatDateTime(input.printedAt, input.language);
  const profile = input.printJob.profile;
  const paperWidth = profile.paperWidthMm;
  const paperHeight = profile.paperHeightMm;
  const pageSize = paperHeight ? paperWidth + "mm " + paperHeight + "mm" : "auto";
  const ticketHeightStyle = paperHeight ? "height:" + paperHeight + "mm;max-height:" + paperHeight + "mm;overflow:hidden;" : "min-height:40mm;";
  const typography = getVoucherTypography(input.voucher.lines.length);
  const lines = input.voucher.lines.map((line) => (
    "<div class=\"line\"><span class=\"quantity\">" + line.quantity + "x</span><span class=\"product\">" + escapeHtml(line.name) + "</span></div>"
  )).join("");
  const reprint = input.reprintLabel ? "<div class=\"reprint\">" + escapeHtml(input.reprintLabel) + "</div>" : "";
  const voucherNumber = input.voucherCount > 1 ? "<div class=\"voucher-number\">" + input.voucherIndex + "/" + input.voucherCount + "</div>" : "";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: ${pageSize}; margin: 0; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; color: #000; background: #fff; font-family: Arial, sans-serif; }
          .voucher {
            width: ${paperWidth}mm;
            ${ticketHeightStyle}
            padding: ${profile.isFixedMedia ? "3.5mm 3mm 4mm 3mm" : "3mm"};
            color: #000;
            background: #fff;
            font-family: Arial, sans-serif;
            line-height: 1.15;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .center { text-align: center; }
          .event { font-size: 8pt; font-weight: 900; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .reprint { display: inline-block; margin-top: 1mm; padding: 0.7mm 1.5mm; border: 1.5px solid #000; font-size: 7pt; font-weight: 900; text-transform: uppercase; }
          .voucher-number { margin-top: 0.6mm; font-size: 6.5pt; font-weight: 800; }
          .lines { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: ${typography.lineGap}; padding: 1mm 0; font-weight: 900; }
          .line { display: grid; grid-template-columns: 12mm minmax(0, 1fr); align-items: center; gap: 2mm; word-break: break-word; }
          .quantity { font-size: ${typography.quantitySize}; font-weight: 900; line-height: 1; text-align: center; }
          .product { font-size: ${typography.nameSize}; font-weight: 900; line-height: 1.02; }
          .meta { font-size: 6.5pt; font-weight: 800; line-height: 1.15; text-align: center; }
        </style>
      </head>
      <body>
        <section class="voucher">
          <div class="center">
            <div class="event">${escapeHtml(input.eventName)}</div>
            ${reprint}
            ${voucherNumber}
          </div>
          <div class="lines">${lines}</div>
          <div class="meta">
            <div>${escapeHtml(printedAtText)}</div>
          </div>
        </section>
      </body>
    </html>
  `;
}

export async function printBonWithQzTray(input: {
  eventName: string;
  labels: Translation;
  language: Language;
  printJob: BonPrintJob;
  printedAt: Date;
  printerSettings: PrinterSettings;
  reprintLabel?: string | null;
}) {
  const printerName = input.printerSettings.qzPrinterName.trim();

  if (!printerName) {
    throw new QzTrayUnavailableError("No QZ Tray printer selected.");
  }

  const qz = await loadQzTray();
  await connectQzTray(qz);

  const profile = input.printJob.profile;
  const config = qz.configs.create(printerName, {
    copies: 1,
    density: 203,
    units: "mm",
    size: profile.paperHeightMm ? { width: profile.paperWidthMm, height: profile.paperHeightMm } : { width: profile.paperWidthMm },
    margins: 0,
  });

  for (const [index, voucher] of input.printJob.vouchers.entries()) {
    try {
      await qz.print(config, [{
        type: "pixel",
        format: "html",
        flavor: "plain",
        data: createSingleVoucherHtml({
          ...input,
          voucher,
          voucherCount: input.printJob.vouchers.length,
          voucherIndex: index + 1,
        }),
      }]);
    } catch (error) {
      throw new QzTrayPrintJobError(error instanceof Error ? error.message : "QZ Tray print job failed.", {
        voucherCount: input.printJob.vouchers.length,
        voucherIndex: index + 1,
        voucherLabel: describeVoucher(voucher),
      });
    }
  }
}
