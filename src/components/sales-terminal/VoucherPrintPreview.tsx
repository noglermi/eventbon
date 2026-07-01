import type { Translation } from "./i18n";
import type { CartItem, Language, PrintMode, ProductTileData } from "./types";

type VoucherLine = {
  id: string;
  name: string;
  quantity: number;
};

type VoucherPrintPreviewProps = {
  eventName: string;
  language: Language;
  labels: Translation;
  cartItems: CartItem[];
  productsById: Map<string, ProductTileData>;
  printMode: PrintMode;
  printedAt: Date;
  onCancel: () => void;
};

function formatDateTime(date: Date, language: Language) {
  return new Intl.DateTimeFormat(language === "de" ? "de-AT" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function buildLines(cartItems: CartItem[], productsById: Map<string, ProductTileData>, language: Language) {
  return cartItems.flatMap((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      return [];
    }

    return [{ id: item.productId, name: product.name[language], quantity: item.quantity }];
  });
}

function Voucher({ eventName, labels, lines, printedAtText }: { eventName: string; labels: Translation; lines: VoucherLine[]; printedAtText: string }) {
  return (
    <article className="voucher-ticket break-inside-avoid bg-white p-4 font-mono text-slate-950 ring-1 ring-slate-300">
      <div className="text-center">
        <p className="text-lg font-black tracking-wide">eventBon</p>
        <p className="mt-1 text-sm font-bold">{eventName}</p>
      </div>
      <div className="my-3 border-t border-dashed border-slate-500" />
      <div className="space-y-1 text-base font-black">
        {lines.map((line) => (
          <div key={line.id} className="flex justify-between gap-4">
            <span>{line.quantity > 1 ? line.quantity + " x " : ""}{line.name}</span>
          </div>
        ))}
      </div>
      <div className="my-3 border-t border-dashed border-slate-500" />
      <div className="text-xs font-bold leading-relaxed">
        <p>{labels.dateTime}</p>
        <p>{printedAtText}</p>
      </div>
    </article>
  );
}

export function VoucherPrintPreview({ eventName, language, labels, cartItems, productsById, printMode, printedAt, onCancel }: VoucherPrintPreviewProps) {
  const lines = buildLines(cartItems, productsById, language);
  const printedAtText = formatDateTime(printedAt, language);
  const vouchers = printMode === "single_vouchers"
    ? lines.flatMap((line) => Array.from({ length: line.quantity }, (_, index) => ({ id: line.id + "-" + index, lines: [{ ...line, quantity: 1 }] })))
    : [{ id: "combined", lines }];

  function printVouchers() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="print-preview-title">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[2rem] bg-white shadow-2xl">
        <div className="print-preview-controls flex items-center justify-between gap-6 border-b border-slate-200 px-7 py-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">{labels.voucherPrinting}</p>
            <h2 id="print-preview-title" className="mt-1 text-3xl font-black tracking-normal text-slate-950">{labels.printPreview}</h2>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="min-h-12 rounded-2xl bg-slate-100 px-5 text-lg font-black text-slate-700 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
              {labels.cancel}
            </button>
            <button type="button" onClick={printVouchers} className="min-h-12 rounded-2xl bg-emerald-500 px-6 text-lg font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">
              {labels.print}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto bg-slate-100 p-6">
          <div className="print-area mx-auto grid max-w-sm gap-4">
            {vouchers.map((voucher) => (
              <Voucher key={voucher.id} eventName={eventName} labels={labels} lines={voucher.lines} printedAtText={printedAtText} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
