import type { AssetType } from "@/features/investments/types"
import { createClient } from "@/lib/supabase/server"

const QUOTE_URL = "https://www.alphavantage.co/query"

const MAX_REQUESTS = 25
const MIN_GAP_MS = 1200
const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 1500

interface QuoteItem {
  id: string
  symbol: string
  assetType: AssetType
  currency: string
}

interface QuoteSuccess {
  id: string
  currentPrice: number
}

interface QuoteFailure {
  id: string
  symbol: string
  code: string
}

function isAssetType(value: unknown): value is AssetType {
  return value === "stock" || value === "crypto"
}

function parseQuoteItem(value: unknown): QuoteItem | null {
  if (typeof value !== "object" || value === null) return null
  const record = value as Record<string, unknown>
  if (typeof record.id !== "string" || typeof record.symbol !== "string") return null
  if (!isAssetType(record.assetType)) return null
  const symbol = record.symbol.trim().toUpperCase()
  if (!symbol) return null
  const currency = typeof record.currency === "string" ? record.currency.trim().toUpperCase() : ""
  return { id: record.id, symbol, assetType: record.assetType, currency }
}

function quoteUrl(item: QuoteItem, apiKey: string): URL {
  const url = new URL(QUOTE_URL)
  url.searchParams.set("apikey", apiKey)
  if (item.assetType === "stock") {
    url.searchParams.set("function", "GLOBAL_QUOTE")
    url.searchParams.set("symbol", item.symbol)
  } else {
    url.searchParams.set("function", "CURRENCY_EXCHANGE_RATE")
    url.searchParams.set("from_currency", item.symbol)
    url.searchParams.set("to_currency", item.currency || "USD")
  }
  return url
}

function readQuoteError(
  body: unknown,
): { code: string; retryable: boolean } | null {
  if (typeof body !== "object" || body === null) return null
  const record = body as Record<string, unknown>
  if (typeof record["Error Message"] === "string") {
    return { code: "noQuote", retryable: false }
  }
  if (typeof record["Note"] === "string") {
    return { code: "rateLimit", retryable: true }
  }
  if (typeof record["Information"] === "string") {
    return { code: "rateLimit", retryable: true }
  }
  return null
}

function readPrice(body: unknown): number | null {
  if (typeof body !== "object" || body === null) return null
  const record = body as Record<string, unknown>

  const quote = record["Global Quote"]
  if (typeof quote === "object" && quote !== null) {
    const price = Number((quote as Record<string, unknown>)["05. price"])
    if (Number.isFinite(price) && price >= 0) return price
    return null
  }

  const exchange = record["Realtime Currency Exchange Rate"]
  if (typeof exchange === "object" && exchange !== null) {
    const rate = Number((exchange as Record<string, unknown>)["5. Exchange Rate"])
    if (Number.isFinite(rate) && rate >= 0) return rate
    return null
  }

  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchQuoteOnce(
  item: QuoteItem,
  apiKey: string,
): Promise<{ price: number } | { code: string; retryable: boolean }> {
  try {
    const res = await fetch(quoteUrl(item, apiKey), { cache: "no-store" })
    const body: unknown = await res.json()
    const quoteError = readQuoteError(body)
    if (quoteError) return { code: quoteError.code, retryable: quoteError.retryable }
    const price = readPrice(body)
    if (price === null) return { code: "noCurrentPrice", retryable: false }
    return { price }
  } catch {
    return { code: "serviceUnavailable", retryable: true }
  }
}

async function fetchQuoteWithRetry(
  item: QuoteItem,
  apiKey: string,
): Promise<{ price: number } | { code: string }> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const result = await fetchQuoteOnce(item, apiKey)
    if ("price" in result) return result
    if (result.retryable && attempt < MAX_RETRIES) {
      await sleep(RETRY_BASE_DELAY_MS * (attempt + 1))
      continue
    }
    return { code: result.code }
  }
  return { code: "serviceUnavailable" }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ quotes: [], failures: [] }, { status: 401 })
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) {
    return Response.json(
      { quotes: [], failures: [] },
      { status: 503, statusText: "Price service is not configured." },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ quotes: [], failures: [] }, { status: 400 })
  }

  if (!Array.isArray(body)) {
    return Response.json({ quotes: [], failures: [] }, { status: 400 })
  }

  const groups = new Map<string, { item: QuoteItem; ids: string[] }>()
  for (const raw of body) {
    const item = parseQuoteItem(raw)
    if (!item) continue
    const key = `${item.assetType}:${item.symbol}:${item.currency}`
    const existing = groups.get(key)
    if (existing) {
      existing.ids.push(item.id)
    } else {
      groups.set(key, { item, ids: [item.id] })
    }
  }

  const quotes: QuoteSuccess[] = []
  const failures: QuoteFailure[] = []
  const uniqueItems = [...groups.values()]

  for (let index = 0; index < uniqueItems.length; index += 1) {
    const { item, ids } = uniqueItems[index]

    if (index >= MAX_REQUESTS) {
      for (const id of ids) {
        failures.push({
          id,
          symbol: item.symbol,
          code: "tooMany",
        })
      }
      continue
    }

    if (index > 0) await sleep(MIN_GAP_MS)

    const result = await fetchQuoteWithRetry(item, apiKey)
    if ("price" in result) {
      for (const id of ids) {
        quotes.push({ id, currentPrice: result.price })
      }
    } else {
      for (const id of ids) {
        failures.push({ id, symbol: item.symbol, code: result.code })
      }
    }
  }

  return Response.json({ quotes, failures })
}
