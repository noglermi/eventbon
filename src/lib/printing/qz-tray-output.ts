import type { Translation } from "@/components/sales-terminal/i18n";
import type { Language } from "@/components/sales-terminal/types";
import { formatDateTime } from "@/lib/date-format";
import type { BonPrintJob } from "./print-service";
import type { PrinterSettings } from "./printer-profile";

type QzTray = typeof import("qz-tray").default;

export class QzTrayUnavailableError extends Error {
  constructor(message = "QZ Tray is not reachable.") {
    super(message);
    this.name = "QzTrayUnavailableError";
  }
}

async function loadQzTray() {
  const qzModule = (await import("qz-tray")).default;
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

function createVoucherHtml(input: {
  eventName: string;
  labels: Translation;
  language: Language;
  printJob: BonPrintJob;
  printedAt: Date;
  reprintLabel?: string | null;
}) {
  const printedAtText = formatDateTime(input.printedAt, input.language);
  const profile = input.printJob.profile;
  const paperWidth = profile.paperWidthMm;
  const paperHeight = profile.paperHeightMm;
  const pageSize = paperHeight ? paperWidth + "mm " + paperHeight + "mm" : "auto";
  const ticketHeightStyle = paperHeight ? "height:" + paperHeight + "mm;max-height:" + paperHeight + "mm;overflow:hidden;" : "min-height:40mm;";
  const fontSize = profile.isFixedMedia ? "9pt" : "10pt";

  const vouchers = input.printJob.vouchers.map((voucher, index) => {
    const lines = voucher.lines.map((line) => (
      "<div class=\"line\"><span>" + line.quantity + " &times;</span><span>" + escapeHtml(line.name) + "</span></div>"
    )).join("");
    const pageBreak = index === input.printJob.vouchers.length - 1 ? "" : "page-break-after:always;break-after:page;";
    const reprint = input.reprintLabel ? "<div class=\"reprint\">" + escapeHtml(input.reprintLabel) + "</div>" : "";

    return `
      <section class="voucher" style="${pageBreak}">
        <div class="center">
          <div class="brand">eventBon</div>
          <div class="event">${escapeHtml(input.eventName)}</div>
          ${reprint}
        </div>
        <div class="rule"></div>
        <div class="lines">${lines}</div>
        <div class="rule"></div>
        <div class="meta">
          <div>${escapeHtml(input.labels.dateTime)}</div>
          <div>${escapeHtml(printedAtText)}</div>
        </div>
        <div class="cut"></div>
      </section>
    `;
  }).join("");

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
            padding: ${profile.isFixedMedia ? "3mm 3mm 4mm 3mm" : "3mm"};
            color: #000;
            background: #fff;
            font-family: Arial, sans-serif;
            font-size: ${fontSize};
            line-height: 1.15;
          }
          .center { text-align: center; }
          .brand { font-size: 13pt; font-weight: 900; }
          .event { margin-top: 1mm; font-size: 9pt; font-weight: 700; }
          .reprint { display: inline-block; margin-top: 2mm; padding: 1mm 2mm; border: 1px solid #000; font-size: 7pt; font-weight: 900; text-transform: uppercase; }
          .rule { margin: 2mm 0; border-top: 1px dashed #000; }
          .lines { font-weight: 900; }
          .line { display: grid; grid-template-columns: auto 1fr; gap: 1.5mm; margin-bottom: 1mm; word-break: break-word; }
          .meta { font-size: 7pt; font-weight: 700; }
          .cut { margin-top: 3mm; border-top: 1px dashed #000; }
        </style>
      </head>
      <body>${vouchers}</body>
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

  await qz.print(config, [{
    type: "pixel",
    format: "html",
    flavor: "plain",
    data: createVoucherHtml(input),
  }]);
}
