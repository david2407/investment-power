export function InvestmentHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <a href="#" className="flex items-center gap-3">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="28" height="28" rx="7" fill="var(--color-cobalt)" />
            <rect x="8" y="14" width="3" height="7" rx="1.5" fill="white" />
            <rect x="15" y="7" width="3" height="14" rx="1.5" fill="white" />
          </svg>
          <span className="text-lg font-semibold tracking-tight text-ink">
            Ledger
          </span>
          <span className="hidden text-sm text-ink-soft sm:inline">
            personal portfolio
          </span>
        </a>

        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft">
          <span
            className="h-2 w-2 rounded-full bg-gain"
            aria-hidden="true"
          />
          Saved on this device
        </p>
      </div>
    </header>
  )
}
