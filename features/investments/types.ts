export type AssetType = "stock" | "crypto"

export interface Investment {
  id: string
  assetType: AssetType
  assetName: string
  symbol: string
  platform: string
  quantity: number
  purchasePrice: number
  purchaseDate: string
  currentPrice: number
  currency: string
}

export type NewInvestment = Omit<Investment, "id">

export interface InvestmentFormInput {
  assetType: AssetType
  assetName: string
  symbol: string
  platform: string
  quantity: string
  purchasePrice: string
  purchaseDate: string
  currentPrice: string
  currency: string
}
