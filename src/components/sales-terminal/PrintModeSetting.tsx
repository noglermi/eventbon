import type { Translation } from "./i18n";
import type { PrintMode } from "./types";

type PrintModeSettingProps = {
  labels: Translation;
  printMode: PrintMode;
  onPrintModeChange: (printMode: PrintMode) => void;
};

const modes: PrintMode[] = ["single_vouchers", "combined_voucher"];

export function PrintModeSetting({ labels, printMode, onPrintModeChange }: PrintModeSettingProps) {
  return (
    <section className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{labels.voucherPrinting}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {modes.map((mode) => {
          const isActive = printMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onPrintModeChange(mode)}
              className={"min-h-12 rounded-2xl px-3 text-base font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (isActive ? "bg-slate-950 text-white shadow-md" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100")}
            >
              {mode === "single_vouchers" ? labels.singleVouchers : labels.combinedVoucher}
            </button>
          );
        })}
      </div>
    </section>
  );
}
