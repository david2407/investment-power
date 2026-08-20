const currencyFormatters = new Map<string, Intl.NumberFormat>()

function getCurrencyFormatter(currency: string, locale: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`
  let formatter = currencyFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    currencyFormatters.set(key, formatter)
  }
  return formatter
}

export function formatCurrency(value: number, currency: string, locale = "en-US"): string {
  return getCurrencyFormatter(currency, locale).format(value)
}

export function formatPercent(value: number | null, locale = "en-US"): string {
  if (value === null || !Number.isFinite(value)) return "—"
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function formatQuantity(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(value)
}

export function formatDate(iso: string, locale = "en-US"): string {
  if (!iso) return "—"
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
