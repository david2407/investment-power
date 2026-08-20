import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { useLocale, useTranslations } from "next-intl"
import { getInvestmentMetrics } from "../calculations"
import { formatCurrency, formatDate, formatPercent, formatQuantity } from "../format"
import { parsePrice, validatePriceInput, type ValidationError } from "../validation"
import type { Investment } from "../types"
import type { UpdateResult } from "../use-investments"

interface HoldingsTableProps {
  investments: Investment[]
  onDelete: (investment: Investment) => void
  onUpdateCurrentPrice: (id: string, currentPrice: number) => Promise<UpdateResult>
}

export function HoldingsTable({
  investments,
  onDelete,
  onUpdateCurrentPrice,
}: HoldingsTableProps) {
  const t = useTranslations("table")

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-ink-faint">
            <th scope="col" className="sticky left-0 z-10 bg-surface px-5 py-3.5">
              {t("asset")}
            </th>
            <th scope="col" className="px-5 py-3.5 font-medium">
              {t("platform")}
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              {t("quantity")}
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              {t("purchasePrice")}
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              {t("purchaseDate")}
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              {t("currentPrice")}
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              {t("totalGainLoss")}
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              {t("returnPercent")}
            </th>
            <th scope="col" className="px-5 py-3.5">
              <span className="sr-only">{t("actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {investments.map((investment) => (
            <InvestmentRow
              key={investment.id}
              investment={investment}
              onDelete={onDelete}
              onUpdateCurrentPrice={onUpdateCurrentPrice}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface InvestmentRowProps {
  investment: Investment
  onDelete: (investment: Investment) => void
  onUpdateCurrentPrice: (id: string, currentPrice: number) => Promise<UpdateResult>
}

function InvestmentRow({
  investment,
  onDelete,
  onUpdateCurrentPrice,
}: InvestmentRowProps) {
  const t = useTranslations("table")
  const vt = useTranslations("validation")
  const locale = useLocale()
  const metrics = getInvestmentMetrics(investment)
  const isGain = metrics.totalGainLoss > 0
  const isLoss = metrics.totalGainLoss < 0
  const tone = isGain ? "text-gain" : isLoss ? "text-loss" : "text-ink-soft"
  const direction = isGain ? "▲" : isLoss ? "▼" : null

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState("")
  const [priceError, setPriceError] = useState<ValidationError | null>(null)
  const [priceWarning, setPriceWarning] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  function startEditing() {
    setDraft(String(investment.currentPrice))
    setPriceError(null)
    setPriceWarning(null)
    setIsEditing(true)
  }

  function savePrice() {
    const error = validatePriceInput(draft)
    if (error) {
      setPriceError(error)
      return
    }
    const price = parsePrice(draft)
    setPriceWarning(null)
    setIsSaving(true)
    onUpdateCurrentPrice(investment.id, price).then((result) => {
      if (!result.persisted) {
        setPriceWarning(t("couldNotSave"))
      }
      setIsSaving(false)
      setIsEditing(false)
    })
  }

  function cancelEditing() {
    cancelRef.current = true
    setPriceError(null)
    setPriceWarning(null)
    setIsEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      event.currentTarget.blur()
    } else if (event.key === "Escape") {
      cancelEditing()
    }
  }

  function handleBlur() {
    if (cancelRef.current) {
      cancelRef.current = false
      return
    }
    savePrice()
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="sticky left-0 z-10 border-r border-line bg-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            {investment.assetType}
          </span>
          <div>
            <p className="font-medium text-ink">{investment.assetName}</p>
            <p className="text-xs text-ink-faint">{investment.symbol}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-ink-soft">{investment.platform}</td>
      <td className="px-5 py-4 text-right font-mono tabular-nums text-ink">
        {formatQuantity(investment.quantity, locale)}
      </td>
      <td className="px-5 py-4 text-right font-mono tabular-nums text-ink-soft">
        {formatCurrency(investment.purchasePrice, investment.currency, locale)}
      </td>
      <td className="px-5 py-4 text-right text-ink-soft">
        {formatDate(investment.purchaseDate, locale)}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="inline-flex flex-col items-end gap-1">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={draft}
              disabled={isSaving}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              aria-label={t("currentPriceFor", { name: investment.assetName })}
              aria-invalid={priceError ? true : undefined}
              className="w-28 rounded-md border border-cobalt bg-paper px-2 py-1 text-right font-mono tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-cobalt/20"
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              title={t("tapToEdit")}
              aria-label={t("editCurrentPrice", { name: investment.assetName })}
              className="rounded-md px-2 py-1 font-mono tabular-nums text-ink transition-colors hover:bg-cobalt-soft hover:text-cobalt"
            >
              {formatCurrency(investment.currentPrice, investment.currency, locale)}
            </button>
          )}
          {priceError ? (
            <span role="alert" className="max-w-36 text-xs text-loss">
              {renderValidationError(vt, priceError)}
            </span>
          ) : null}
          {priceWarning ? (
            <span role="alert" className="max-w-36 text-xs text-ink-soft">
              {priceWarning}
            </span>
          ) : null}
        </div>
      </td>
      <td className={`px-5 py-4 text-right font-mono tabular-nums font-medium ${tone}`}>
        {formatCurrency(metrics.totalGainLoss, investment.currency, locale)}
      </td>
      <td className={`px-5 py-4 text-right font-mono tabular-nums font-medium ${tone}`}>
        {direction ? `${direction} ` : ""}
        {formatPercent(metrics.gainLossPercent, locale)}
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onDelete(investment)}
          aria-label={t("deleteAsset", { name: investment.assetName })}
          className="rounded-full p-2 text-ink-faint transition-colors hover:bg-loss/10 hover:text-loss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M4.5 4.5v6a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-6M3 4.5h8M5.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </td>
    </tr>
  )
}

function renderValidationError(
  t: ReturnType<typeof useTranslations<"validation">>,
  error: ValidationError,
): string {
  if (!error.params) return t(error.key)

  const resolved: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(error.params)) {
    resolved[key] = typeof value === "string" ? t(value) : value
  }
  return t(error.key, resolved)
}
