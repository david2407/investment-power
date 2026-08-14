import type { InvestmentFormInput, NewInvestment } from "./types"

export type FormErrors = Partial<Record<keyof InvestmentFormInput, string>>

export interface ValidationResult {
  errors: FormErrors
  value: NewInvestment | null
}

function parseNumber(raw: string): number {
  return Number(raw.replace(/,/g, "").trim())
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
    errors.assetName = "Asset name is required."
  }
  if (!platform) {
    errors.platform = "Broker or platform is required."
  }
  if (!input.quantity.trim()) {
    errors.quantity = "Quantity is required."
  } else if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be greater than zero."
  }
  if (!input.purchasePrice.trim()) {
    errors.purchasePrice = "Purchase price is required."
  } else if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    errors.purchasePrice = "Price must be zero or higher."
  }
  if (!input.currentPrice.trim()) {
    errors.currentPrice = "Current price is required."
  } else if (!Number.isFinite(currentPrice) || currentPrice < 0) {
    errors.currentPrice = "Price must be zero or higher."
  }
  if (!purchaseDate) {
    errors.purchaseDate = "Purchase date is required."
  } else {
    const date = new Date(`${purchaseDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) {
      errors.purchaseDate = "Enter a valid date."
    }
  }
  if (!currency) {
    errors.currency = "Currency is required."
  }

  if (Object.keys(errors).length > 0) {
    return { errors, value: null }
  }

  return {
    errors,
    value: {
      assetType: input.assetType,
      assetName,
      symbol,
      platform,
      quantity,
      purchasePrice,
      purchaseDate,
      currentPrice,
      currency,
    },
  }
}
