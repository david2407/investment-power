import type { InvestmentFormInput, NewInvestment } from "./types"

export interface ValidationError {
  key: string
  params?: Record<string, string | number>
}

export type FormErrors = Partial<Record<keyof InvestmentFormInput, ValidationError>>

export interface ValidationResult {
  errors: FormErrors
  value: NewInvestment | null
}

function parseNumber(raw: string): number {
  return Number(raw.replace(/,/g, "").trim())
}

export function parsePrice(raw: string): number {
  return parseNumber(raw)
}

export function validatePriceInput(
  raw: string,
  labelKey = "price",
): ValidationError | null {
  if (!raw.trim()) return { key: "priceRequired", params: { label: labelKey } }
  const value = parsePrice(raw)
  if (!Number.isFinite(value) || value < 0) return { key: "priceNegative" }
  return null
}

export function validateInvestmentForm(input: InvestmentFormInput): ValidationResult {
  const errors: FormErrors = {}

  const assetName = input.assetName.trim()
  const symbol = input.symbol.trim()
  const platform = input.platform.trim()
  const currency = input.currency.trim()
  const purchaseDate = input.purchaseDate.trim()
  const quantity = parseNumber(input.quantity)
  const purchasePrice = parseNumber(input.purchasePrice)
  const currentPrice = parseNumber(input.currentPrice)

  if (!assetName) {
    errors.assetName = { key: "assetNameRequired" }
  }
  if (!symbol) {
    errors.symbol = { key: "symbolRequired" }
  }
  if (!platform) {
    errors.platform = { key: "platformRequired" }
  }
  if (!input.quantity.trim()) {
    errors.quantity = { key: "quantityRequired" }
  } else if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.quantity = { key: "quantityPositive" }
  }

  const purchasePriceError = validatePriceInput(
    input.purchasePrice,
    "purchasePrice",
  )
  if (purchasePriceError) {
    errors.purchasePrice = purchasePriceError
  }

  const currentPriceError = validatePriceInput(input.currentPrice, "currentPrice")
  if (currentPriceError) {
    errors.currentPrice = currentPriceError
  }
  if (!purchaseDate) {
    errors.purchaseDate = { key: "purchaseDateRequired" }
  } else {
    const date = new Date(`${purchaseDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) {
      errors.purchaseDate = { key: "invalidDate" }
    }
  }
  if (!currency) {
    errors.currency = { key: "currencyRequired" }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, value: null }
  }

  return {
    errors,
    value: {
      assetType: input.assetType,
      assetName,
      symbol: symbol.toUpperCase(),
      platform,
      quantity,
      purchasePrice,
      purchaseDate,
      currentPrice,
      currency,
    },
  }
}
