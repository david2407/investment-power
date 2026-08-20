"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import copData from "@/data/cop-data.json"
import { groupByCurrency, type CurrencyGroup } from "../calculations"
import { formatCurrency, formatPercent } from "../format"
import { useInvestments } from "../use-investments"
import type { Investment, NewInvestment } from "../types"
import { CreateInvestmentForm } from "./create-investment-form"
import { DeleteInvestmentDialog } from "./delete-investment-dialog"
import { HoldingsTable } from "./holdings-table"

interface RefreshStatus {
  updatedCount: number
  notSaved: boolean
  failures: Array<{ symbol: string }>
  skippedCount: number
}

const MAX_REFRESH_REQUESTS = 25

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function InvestmentMain() {
  const t = useTranslations()
  const {
    investments,
    storageStatus,
    addInvestment,
    deleteInvestment,
    updateCurrentPrice,
    updateCurrentPrices,
  } = useInvestments()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Investment | null>(null)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshProgress, setRefreshProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null)

  const groups = groupByCurrency(investments)
  const positionCount = investments.length

  const summaryCards = groups.flatMap((group) =>
    group.currency === "USD"
      ? [group, toCopCurrencyGroup(group, copData.value)]
      : [group],
  )

  function handleAdd(input: NewInvestment) {
    addInvestment(input)
    setIsFormOpen(false)
  }

  function handleRequestDelete(investment: Investment) {
    setDeleteFailed(false)
    setPendingDelete(investment)
  }

  function handleCancelDelete() {
    setDeleteFailed(false)
    setPendingDelete(null)
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setPendingDelete(null)
    deleteInvestment(id).then((result) => {
      setDeleteFailed(!result.deleted)
    })
  }

  async function handleRefreshPrices() {
    if (isRefreshing) return

    const groups = new Map<
      string,
      Array<{ id: string; symbol: string; assetType: Investment["assetType"]; currency: string }>
    >()
    for (const investment of investments) {
      const symbol = investment.symbol.trim()
      if (!symbol) continue
      const item = {
        id: investment.id,
        symbol,
        assetType: investment.assetType,
        currency: investment.currency,
      }
      const key = `${investment.assetType}:${symbol.toUpperCase()}:${investment.currency}`
      const existing = groups.get(key)
      if (existing) {
        existing.push(item)
      } else {
        groups.set(key, [item])
      }
    }

    const uniqueRequests = [...groups.values()]
    const total = uniqueRequests.length
    const skippedCount =
      investments.length - uniqueRequests.reduce((sum, rows) => sum + rows.length, 0)

    const quotes: Array<{ id: string; currentPrice: number }> = []
    const failures: Array<{ symbol: string }> = []

    setIsRefreshing(true)
    setRefreshStatus(null)
    setRefreshProgress(total > 0 ? { current: 0, total } : null)

    try {
      for (let index = 0; index < total; index += 1) {
        const rows = uniqueRequests[index]
        setRefreshProgress({ current: index + 1, total })

        if (index >= MAX_REFRESH_REQUESTS) {
          for (const row of rows) {
            failures.push({ symbol: row.symbol })
          }
          continue
        }

        const res = await fetch("/api/investments/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rows),
        })

        if (!res.ok) {
          for (const row of rows) {
            failures.push({ symbol: row.symbol })
          }
          continue
        }

        const data = (await res.json()) as {
          quotes: Array<{ id: string; currentPrice: number }>
          failures: Array<{ symbol: string }>
        }
        quotes.push(...data.quotes)
        failures.push(...data.failures)

        if (index < total - 1) await sleep(1000)
      }

      const persisted = await updateCurrentPrices(quotes)
      setRefreshStatus({
        updatedCount: quotes.length,
        notSaved: quotes.length > 0 && !persisted.persisted,
        failures,
        skippedCount,
      })
    } catch {
      setRefreshStatus({
        updatedCount: 0,
        notSaved: false,
        failures: [],
        skippedCount: 0,
      })
    } finally {
      setIsRefreshing(false)
      setRefreshProgress(null)
    }
  }

  const refreshStatusMessage = buildRefreshStatusMessage(t, refreshStatus)
  const refreshStatusIsError =
    refreshStatus !== null &&
    (refreshStatus.failures.length > 0 || refreshStatus.skippedCount > 0)

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-12 sm:pt-16">
      <section aria-labelledby="summary-heading" className="mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cobalt">
          {t("portfolio.eyebrow")}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1
            id="summary-heading"
            className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            {t("portfolio.overview")}
          </h1>
          <p className="text-sm text-ink-soft">
            {positionCount === 0
              ? t("portfolio.noPositionsTracked")
              : t("portfolio.positions", { count: positionCount })}
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {summaryCards.length > 0 ? (
            summaryCards.map((group) => <SummaryCard key={group.currency} group={group} />)
          ) : (
            <EmptySummaryCard />
          )}
        </div>
      </section>

      <section aria-labelledby="holdings-heading" className="scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              id="holdings-heading"
              className="text-xl font-semibold tracking-tight text-ink"
            >
              {t("holdings.title")}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">{t("holdings.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefreshPrices}
              disabled={isRefreshing || positionCount === 0}
              aria-busy={isRefreshing}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-cobalt/40 hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                className={isRefreshing ? "animate-spin" : undefined}
              >
                <path
                  d="M12 7a5 5 0 1 1-1.47-3.54M12 2v2.5H9.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isRefreshing
                ? refreshProgress
                  ? t("holdings.refreshProgress", {
                      current: refreshProgress.current,
                      total: refreshProgress.total,
                    })
                  : t("holdings.refreshing")
                : t("holdings.refreshPrices")}
            </button>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cobalt/90"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M7 3v8M3 7h8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              {t("holdings.addInvestment")}
            </button>
          </div>
        </div>

        <div className="mt-6">
          {positionCount > 0 ? (
            <HoldingsTable
              investments={investments}
              onDelete={handleRequestDelete}
              onUpdateCurrentPrice={updateCurrentPrice}
            />
          ) : (
            <EmptyState onAdd={() => setIsFormOpen(true)} />
          )}
        </div>

        {refreshStatus ? (
          <p
            role={refreshStatusIsError ? "alert" : "status"}
            className={
              refreshStatusIsError
                ? "mt-6 rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss"
                : "mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft"
            }
          >
            {refreshStatusMessage}
          </p>
        ) : null}

        {deleteFailed ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss"
          >
            {t("holdings.deleteFailed")}
          </p>
        ) : null}
      </section>

      {storageStatus === "unavailable" ? (
        <p className="mt-6 rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss">
          {t("holdings.storageUnavailable")}
        </p>
      ) : null}

      {isFormOpen ? (
        <CreateInvestmentForm onClose={() => setIsFormOpen(false)} onAdd={handleAdd} />
      ) : null}

      {pendingDelete ? (
        <DeleteInvestmentDialog
          investment={pendingDelete}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </main>
  )
}

function buildRefreshStatusMessage(
  t: ReturnType<typeof useTranslations>,
  status: RefreshStatus | null,
): string {
  if (!status) return ""
  const parts: string[] = []
  if (status.updatedCount > 0) {
    const updated = t("refresh.pricesUpdated", { count: status.updatedCount })
    parts.push(status.notSaved ? `${updated} ${t("refresh.notSaved")}` : updated)
  }
  if (status.failures.length > 0) {
    const uniqueSymbols = [...new Set(status.failures.map((failure) => failure.symbol))]
    const shown = uniqueSymbols.slice(0, 5).join(", ")
    const ellipsis = uniqueSymbols.length > 5 ? ", …" : ""
    parts.push(
      t("refresh.couldNotRefresh", {
        count: status.failures.length,
        shown,
        ellipsis,
      }),
    )
  }
  if (status.skippedCount > 0) {
    parts.push(t("refresh.positionsSkipped", { count: status.skippedCount }))
  }
  if (parts.length === 0) parts.push(t("refresh.nothingToRefresh"))
  return parts.join(". ")
}

function SummaryCard({ group }: { group: CurrencyGroup }) {
  const t = useTranslations("portfolio")
  const isGain = group.totalGainLoss > 0
  const isLoss = group.totalGainLoss < 0
  const tone = isGain ? "text-gain" : isLoss ? "text-loss" : "text-ink"
  const direction = isGain ? "▲" : isLoss ? "▼" : null

  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <span
        className="absolute inset-y-0 left-0 w-1 bg-cobalt"
        aria-hidden="true"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          {t("totalReturn")}
        </p>
        <p className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
          {group.currency}
        </p>
      </div>
      <p className={`mt-4 font-mono text-3xl font-semibold tabular-nums tracking-tight ${tone}`}>
        {formatCurrency(group.totalGainLoss, group.currency)}
      </p>
      <p className="mt-1.5 text-sm text-ink-soft">
        {direction ? <span className={tone}>{direction} </span> : null}
        <span className={`font-mono tabular-nums ${tone}`}>
          {formatPercent(group.gainLossPercent)}
        </span>
        <span className="text-ink-faint"> · {t("positions", { count: group.positionCount })}</span>
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <dt className="text-xs text-ink-faint">{t("invested")}</dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-ink">
            {formatCurrency(group.costBasis, group.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">{t("currentValue")}</dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-ink">
            {formatCurrency(group.currentValue, group.currency)}
          </dd>
        </div>
      </dl>
    </article>
  )
}

function toCopCurrencyGroup(group: CurrencyGroup, copPerUsd: number): CurrencyGroup {
  return {
    currency: "COP",
    costBasis: group.costBasis * copPerUsd,
    currentValue: group.currentValue * copPerUsd,
    totalGainLoss: group.totalGainLoss * copPerUsd,
    gainLossPercent: group.gainLossPercent,
    positionCount: group.positionCount,
  }
}

function EmptySummaryCard() {
  const t = useTranslations("portfolio")
  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <span className="absolute inset-y-0 left-0 w-1 bg-cobalt" aria-hidden="true" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
        {t("totalReturn")}
      </p>
      <p className="mt-4 font-mono text-3xl font-semibold tabular-nums tracking-tight text-ink-soft">
        —
      </p>
      <p className="mt-1.5 text-sm text-ink-faint">{t("noPositionsYet")}</p>
    </article>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useTranslations("holdings")
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <p className="text-base font-medium text-ink">{t("emptyTitle")}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{t("emptyBody")}</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cobalt/90"
      >
        {t("addInvestment")}
      </button>
    </div>
  )
}
