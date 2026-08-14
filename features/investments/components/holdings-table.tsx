import { getInvestmentMetrics } from "../calculations"
import { formatCurrency, formatDate, formatPercent, formatQuantity } from "../format"
import type { Investment } from "../types"

interface HoldingsTableProps {
  investments: Investment[]
  onDelete: (investment: Investment) => void
}

export function HoldingsTable({ investments, onDelete }: HoldingsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-ink-faint">
            <th scope="col" className="sticky left-0 z-10 bg-surface px-5 py-3.5">
              Asset
            </th>
            <th scope="col" className="px-5 py-3.5 font-medium">
              Platform
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              Quantity
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              Purchase price
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              Purchase date
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              Current price
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              Total gain / loss
            </th>
            <th scope="col" className="px-5 py-3.5 text-right font-medium">
              Return %
            </th>
            <th scope="col" className="px-5 py-3.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {investments.map((investment) => (
            <InvestmentRow
              key={investment.id}
              investment={investment}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InvestmentRow({
  investment,
  onDelete,
}: {
  investment: Investment
  onDelete: (investment: Investment) => void
}) {
  const metrics = getInvestmentMetrics(investment)
  const isGain = metrics.totalGainLoss > 0
  const isLoss = metrics.totalGainLoss < 0
  const tone = isGain ? "text-gain" : isLoss ? "text-loss" : "text-ink-soft"
  const direction = isGain ? "▲" : isLoss ? "▼" : null

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
        {formatQuantity(investment.quantity)}
      </td>
      <td className="px-5 py-4 text-right font-mono tabular-nums text-ink-soft">
        {formatCurrency(investment.purchasePrice, investment.currency)}
      </td>
      <td className="px-5 py-4 text-right text-ink-soft">
        {formatDate(investment.purchaseDate)}
      </td>
      <td className="px-5 py-4 text-right font-mono tabular-nums text-ink">
        {formatCurrency(investment.currentPrice, investment.currency)}
      </td>
      <td className={`px-5 py-4 text-right font-mono tabular-nums font-medium ${tone}`}>
        {formatCurrency(metrics.totalGainLoss, investment.currency)}
      </td>
      <td className={`px-5 py-4 text-right font-mono tabular-nums font-medium ${tone}`}>
        {direction ? `${direction} ` : ""}
        {formatPercent(metrics.gainLossPercent)}
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onDelete(investment)}
          aria-label={`Delete ${investment.assetName}`}
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
