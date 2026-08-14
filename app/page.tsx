import { InvestmentFooter } from "@/features/investments/components/investment-footer"
import { InvestmentHeader } from "@/features/investments/components/investment-header"
import { InvestmentMain } from "@/features/investments/components/investment-main"

export default function Home() {
  return (
    <>
      <InvestmentHeader />
      <InvestmentMain />
      <InvestmentFooter />
    </>
  )
}
