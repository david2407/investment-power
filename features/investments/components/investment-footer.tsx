import { DELETED_STORAGE_KEY, STORAGE_KEY } from "../storage.client"

export function InvestmentFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft">
          Ledger — a local-first investment ledger.
        </p>
        <p className="font-mono text-xs text-ink-faint">
          data: {STORAGE_KEY} · archive: {DELETED_STORAGE_KEY} · stored in this browser
        </p>
      </div>
    </footer>
  )
}
