import { useState } from "react";

interface AutoFillControlsProps {
  onTriggerFill: () => Promise<void> | void;
  aliasActive?: boolean;
  onToggleAlias?: () => void;
}

function AutoFillControls({ onTriggerFill, aliasActive, onToggleAlias }: AutoFillControlsProps) {
  const [filling, setFilling] = useState(false);

  const handleFill = async () => {
    setFilling(true);
    try {
      await onTriggerFill();
    } finally {
      setTimeout(() => setFilling(false), 1200);
    }
  };

  return (
    <section className="grid gap-3">
      {/* Big fill button */}
      <button
        className={`w-full rounded-xl px-4 py-4 text-base font-semibold text-white shadow-md transition ${
          filling
            ? "bg-accent-green scale-[0.98]"
            : "bg-primary hover:bg-primary-dark hover:shadow-lg active:scale-[0.98]"
        }`}
        type="button"
        onClick={handleFill}
        disabled={filling}
      >
        {filling ? "Filling..." : "Fill this page"}
      </button>

      {/* Simple real/fake toggle */}
      {onToggleAlias && (
        <button
          type="button"
          onClick={onToggleAlias}
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
            aliasActive
              ? "border-primary/30 bg-primary/5"
              : "border-cream-300 bg-cream-50"
          }`}
        >
          <div>
            <span className={`text-sm font-medium ${aliasActive ? "text-primary" : "text-warm-700"}`}>
              {aliasActive ? "Using fake info" : "Using your info"}
            </span>
            <p className="text-[11px] text-warm-500">
              {aliasActive ? "Tap to switch to your real details" : "Tap to switch to a fake identity"}
            </p>
          </div>
          <div className={`flex h-6 w-10 items-center rounded-full p-0.5 transition ${
            aliasActive ? "bg-primary" : "bg-cream-400"
          }`}>
            <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              aliasActive ? "translate-x-4" : "translate-x-0"
            }`} />
          </div>
        </button>
      )}
    </section>
  );
}

export default AutoFillControls;
