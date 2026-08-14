"use client"

import { useState } from "react"
import { groupByCurrency, type CurrencyGroup } from "../calculations"
import { formatCurrency, formatPercent } from "../format"
import { useInvestments } from "../use-investments"
import type { Investment, NewInvestment } from "../types"
import { CreateInvestmentForm } from "./create-investment-form"
import { DeleteInvestmentDialog } from "./delete-investment-dialog"
import { HoldingsTable } from "./holdings-table"

export function InvestmentMain() {
  const { investments, storageStatus, addInvestment, deleteInvestment } =
    useInvestments()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Investment | null>(null)
  const [deleteFailed, setDeleteFailed] = useState(false)

  const groups = groupByCurrency(investments)
  const positionCount = investments.length

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
    const result = deleteInvestment(pendingDelete.id)
    setPendingDelete(null)
    setDeleteFailed(!result.deleted)
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-12 sm:pt-16">
      <section aria-labelledby="summary-heading" className="mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cobalt">
          Portfolio
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1
            id="summary-heading"
            className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            Overview
          </h1>
          <p className="text-sm text-ink-soft">
            {positionCount === 0
              ? "No positions tracked yet"
              : `${positionCount} position${positionCount === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {groups.length > 0 ? (
            groups.map((group) => <SummaryCard key={group.currency} group={group} />)
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
              Holdings
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Positions across brokers and platforms.
            </p>
          </div>
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
            Add investment
          </button>
        </div>

        <div className="mt-6">
          {positionCount > 0 ? (
            <HoldingsTable
              investments={investments}
              onDelete={handleRequestDelete}
            />
          ) : (
            <EmptyState onAdd={() => setIsFormOpen(true)} />
          )}
        </div>

        {deleteFailed ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss"
          >
            That position couldn&apos;t be deleted. Browser storage may be full or
            unavailable, so nothing was changed. Try again.
          </p>
        ) : null}
      </section>

      {storageStatus === "unavailable" ? (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          Storage is unavailable in this browser, so new positions will only last for
          this session.
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

function SummaryCard({ group }: { group: CurrencyGroup }) {
  const isGain = group.totalGainLoss > 0
  const isLoss = group.totalGainLoss < 0
  const tone = isGain ? "text-gain" : isLoss ? "text-loss" : "text-ink"
  const direction = isGain ? "▲" : isLoss ? "▼" : null
  const positionLabel = `${group.positionCount} position${
    group.positionCount === 1 ? "" : "s"
  }`

  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <span
        className="absolute inset-y-0 left-0 w-1 bg-cobalt"
        aria-hidden="true"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Total return
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
        <span className="text-ink-faint"> · {positionLabel}</span>
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <dt className="text-xs text-ink-faint">Invested</dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-ink">
            {formatCurrency(group.costBasis, group.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">Current value</dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-ink">
            {formatCurrency(group.currentValue, group.currency)}
          </dd>
        </div>
      </dl>
    </article>
  )
}

function EmptySummaryCard() {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <span className="absolute inset-y-0 left-0 w-1 bg-cobalt" aria-hidden="true" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
        Total return
      </p>
      <p className="mt-4 font-mono text-3xl font-semibold tabular-nums tracking-tight text-ink-soft">
        —
      </p>
      <p className="mt-1.5 text-sm text-ink-faint">No positions yet</p>
    </article>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <p className="text-base font-medium text-ink">No positions yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
        Add your first stock or crypto position to start tracking gains and losses.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cobalt/90"
      >
        Add investment
      </button>
    </div>
  )
}
