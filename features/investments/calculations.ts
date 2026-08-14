import type { Investment } from "./types"

export interface InvestmentMetrics {
  costBasis: number
  currentValue: number
  totalGainLoss: number
  gainLossPercent: number | null
}

export function getInvestmentMetrics(investment: Investment): InvestmentMetrics {
  const costBasis = investment.quantity * investment.purchasePrice
  const currentValue = investment.quantity * investment.currentPrice
  const totalGainLoss = currentValue - costBasis
  const gainLossPercent = costBasis > 0 ? (totalGainLoss / costBasis) * 100 : null
  return { costBasis, currentValue, totalGainLoss, gainLossPercent }
}

export interface CurrencyGroup {
  currency: string
  costBasis: number
  currentValue: number
  totalGainLoss: number
  gainLossPercent: number | null
  positionCount: number
}

export function groupByCurrency(investments: Investment[]): CurrencyGroup[] {
  const groups = new Map<string, CurrencyGroup>()

  for (const investment of investments) {
    const metrics = getInvestmentMetrics(investment)
    let group = groups.get(investment.currency)
    if (!group) {
      group = {
        currency: investment.currency,
        costBasis: 0,
        currentValue: 0,
        totalGainLoss: 0,
        gainLossPercent: null,
        positionCount: 0,
      }
      groups.set(investment.currency, group)
    }
    group.costBasis += metrics.costBasis
    group.currentValue += metrics.currentValue
    group.totalGainLoss += metrics.totalGainLoss
    group.positionCount += 1
  }

  for (const group of groups.values()) {
    group.gainLossPercent =
      group.costBasis > 0 ? (group.totalGainLoss / group.costBasis) * 100 : null
  }

  return [...groups.values()]
}
