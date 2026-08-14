"use client"

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { validateInvestmentForm, type FormErrors } from "../validation"
import type { InvestmentFormInput, NewInvestment } from "../types"

const CURRENCIES = ["USD", "EUR", "GBP", "MXN"]

const EMPTY_FORM: InvestmentFormInput = {
  assetType: "stock",
  assetName: "",
  symbol: "",
  platform: "",
  quantity: "",
  purchasePrice: "",
  purchaseDate: "",
  currentPrice: "",
  currency: "USD",
}

const inputClasses =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/20"

interface CreateInvestmentFormProps {
  onClose: () => void
  onAdd: (input: NewInvestment) => void
}

export function CreateInvestmentForm({ onClose, onAdd }: CreateInvestmentFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<InvestmentFormInput>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [])

  function updateField<K extends keyof InvestmentFormInput>(
    field: K,
    value: InvestmentFormInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateInvestmentForm(form)
    if (!result.value) {
      setErrors(result.errors)
      return
    }
    onAdd(result.value)
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={handleBackdropClick}
      className="m-auto w-full max-w-lg rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/50"
      aria-labelledby="create-investment-title"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2
              id="create-investment-title"
              className="text-lg font-semibold tracking-tight"
            >
              Add investment
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              Log a stock or crypto position.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
          <Field
            id="asset-type"
            label="Asset type"
            error={errors.assetType}
          >
            <select
              id="asset-type"
              value={form.assetType}
              onChange={(event) =>
                updateField("assetType", event.target.value as InvestmentFormInput["assetType"])
              }
              className={inputClasses}
            >
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
            </select>
          </Field>

          <Field id="asset-name" label="Asset name" error={errors.assetName}>
            <input
              id="asset-name"
              type="text"
              value={form.assetName}
              onChange={(event) => updateField("assetName", event.target.value)}
              placeholder="e.g. Apple"
              className={inputClasses}
              aria-invalid={errors.assetName ? true : undefined}
              aria-describedby={errors.assetName ? "asset-name-error" : undefined}
            />
          </Field>

          <Field id="symbol" label="Symbol" hint="Optional">
            <input
              id="symbol"
              type="text"
              value={form.symbol}
              onChange={(event) => updateField("symbol", event.target.value)}
              placeholder="e.g. AAPL"
              className={inputClasses}
            />
          </Field>

          <Field id="platform" label="Broker / platform" error={errors.platform}>
            <input
              id="platform"
              type="text"
              value={form.platform}
              onChange={(event) => updateField("platform", event.target.value)}
              placeholder="e.g. Coinbase"
              className={inputClasses}
              aria-invalid={errors.platform ? true : undefined}
              aria-describedby={errors.platform ? "platform-error" : undefined}
            />
          </Field>

          <Field id="quantity" label="Quantity" error={errors.quantity}>
            <input
              id="quantity"
              type="text"
              inputMode="decimal"
              value={form.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
              placeholder="e.g. 0.5"
              className={inputClasses}
              aria-invalid={errors.quantity ? true : undefined}
              aria-describedby={errors.quantity ? "quantity-error" : undefined}
            />
          </Field>

          <Field id="purchase-price" label="Purchase price" error={errors.purchasePrice}>
            <input
              id="purchase-price"
              type="text"
              inputMode="decimal"
              value={form.purchasePrice}
              onChange={(event) => updateField("purchasePrice", event.target.value)}
              placeholder="e.g. 150.00"
              className={inputClasses}
              aria-invalid={errors.purchasePrice ? true : undefined}
              aria-describedby={errors.purchasePrice ? "purchase-price-error" : undefined}
            />
          </Field>

          <Field id="purchase-date" label="Purchase date" error={errors.purchaseDate}>
            <input
              id="purchase-date"
              type="date"
              value={form.purchaseDate}
              onChange={(event) => updateField("purchaseDate", event.target.value)}
              className={inputClasses}
              aria-invalid={errors.purchaseDate ? true : undefined}
              aria-describedby={errors.purchaseDate ? "purchase-date-error" : undefined}
            />
          </Field>

          <Field id="current-price" label="Current price" error={errors.currentPrice}>
            <input
              id="current-price"
              type="text"
              inputMode="decimal"
              value={form.currentPrice}
              onChange={(event) => updateField("currentPrice", event.target.value)}
              placeholder="e.g. 175.00"
              className={inputClasses}
              aria-invalid={errors.currentPrice ? true : undefined}
              aria-describedby={errors.currentPrice ? "current-price-error" : undefined}
            />
          </Field>

          <Field id="currency" label="Currency" error={errors.currency}>
            <select
              id="currency"
              value={form.currency}
              onChange={(event) => updateField("currency", event.target.value)}
              className={inputClasses}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-cobalt px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cobalt/90"
          >
            Add investment
          </button>
        </div>
      </form>
    </dialog>
  )
}

interface FieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

function Field({ id, label, hint, error, children }: FieldProps) {
  const describedBy = error ? `${id}-error` : undefined
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      ) : null}
      {error ? (
        <p id={describedBy} role="alert" className="mt-1.5 text-xs text-loss">
          {error}
        </p>
      ) : null}
    </div>
  )
}
