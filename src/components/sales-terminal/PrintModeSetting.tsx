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
    <section className="rounded-[1.75rem] bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/75">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{labels.voucherPrinting}</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {modes.map((mode) => {
          const isActive = printMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onPrintModeChange(mode)}
              className={"min-h-12 rounded-2xl px-3 text-base font-black transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 " + (isActive ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/75")}
            >
              {mode === "single_vouchers" ? labels.singleVouchers : labels.combinedVoucher}
            </button>
          );
        })}
      </div>
    </section>
  );
}
