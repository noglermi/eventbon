import { formatDateTime } from "@/lib/date-format";
import { printService } from "@/lib/printing/print-service";
import type { PrintVoucherLine } from "@/lib/printing/print-renderer";
import type { Translation } from "./i18n";
import type { CartItem, Language, PrintMode, ProductTileData } from "./types";
import type { PrinterSettings } from "./printer-settings-storage";

type VoucherPrintPreviewProps = {
  eventName: string;
  language: Language;
  labels: Translation;
  cartItems: CartItem[];
  lines?: PrintVoucherLine[];
  productsById: Map<string, ProductTileData>;
  printMode: PrintMode;
  printedAt: Date;
  reprintLabel?: string | null;
  printerSettings: PrinterSettings;
  onCancel: () => void;
  onPrinted?: () => void;
};

function buildLines(cartItems: CartItem[], productsById: Map<string, ProductTileData>, language: Language): PrintVoucherLine[] {
  return cartItems.flatMap((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      return [];
    }

    return [{ id: item.productId, name: product.name[language], quantity: item.quantity }];
  });
}

function Voucher({ eventName, labels, lines, printedAtText, reprintLabel }: { eventName: string; labels: Translation; lines: PrintVoucherLine[]; printedAtText: string; reprintLabel?: string | null }) {
  return (
    <article className="voucher-ticket break-inside-avoid bg-white px-4 py-3 font-mono text-slate-950 shadow-sm ring-1 ring-slate-300">
      <div className="text-center">
        <p className="text-base font-black tracking-wide">eventBon</p>
        <p className="mt-1 text-sm font-bold">{eventName}</p>
        {reprintLabel ? <p className="mt-2 inline-block rounded-full border border-slate-900 px-2 py-1 text-xs font-black uppercase tracking-widest">{reprintLabel}</p> : null}
      </div>
      <div className="my-2 border-t border-dashed border-slate-500" />
      <div className="space-y-1 text-base font-black leading-tight">
        {lines.map((line) => (
          <div key={line.id} className="voucher-line grid grid-cols-[auto_minmax(0,1fr)] gap-2">
            <span className="tabular-nums">{line.quantity} {"\u00d7"}</span>
            <span className="break-words">{line.name}</span>
          </div>
        ))}
      </div>
      <div className="my-2 border-t border-dashed border-slate-500" />
      <div className="text-xs font-bold leading-relaxed">
        <p>{labels.dateTime}</p>
        <p>{printedAtText}</p>
      </div>
      <div className="voucher-cut-line mt-3 border-t border-dashed border-slate-700" />
    </article>
  );
}

export function VoucherPrintPreview({ eventName, language, labels, cartItems, lines: providedLines, productsById, printMode, printedAt, reprintLabel = null, printerSettings, onCancel, onPrinted }: VoucherPrintPreviewProps) {
  const lines = providedLines ?? buildLines(cartItems, productsById, language);
  const printedAtText = formatDateTime(printedAt, language);
  const printJob = printService.createBonPrintJob({ lines, printMode, printerSettings });

  function printVouchers() {
    printService.requestBrowserPrint(onPrinted);
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/60 p-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="print-preview-title">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="print-preview-chrome shrink-0 border-b border-slate-200 px-7 py-5">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{labels.voucherPrinting}</p>
          <h2 id="print-preview-title" className="mt-1 text-3xl font-black tracking-normal text-slate-950">{labels.printPreview}</h2>
          <p className="mt-2 max-w-xl text-sm font-semibold text-slate-500">{labels.thermalPrinterNote}</p>
        </div>

        <div className="print-preview-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100 p-6">
          <div className="print-area mx-auto grid max-w-[var(--printer-printable-width)] gap-4" style={printJob.printerStyle}>
            {printJob.vouchers.map((voucher) => (
              <Voucher key={voucher.id} eventName={eventName} labels={labels} lines={voucher.lines} printedAtText={printedAtText} reprintLabel={reprintLabel} />
            ))}
          </div>
        </div>

        <div className="print-preview-actions z-10 shrink-0 flex justify-end gap-3 border-t border-slate-200 bg-white/95 px-7 py-5 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <button type="button" onClick={onCancel} className="min-h-12 rounded-2xl bg-slate-100 px-5 text-lg font-black text-slate-700 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
            {labels.cancel}
          </button>
          <button type="button" onClick={printVouchers} className="min-h-12 rounded-2xl bg-emerald-500 px-6 text-lg font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
            {labels.print}
          </button>
        </div>
      </div>
    </div>
  );
}
