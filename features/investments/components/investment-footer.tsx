import { getTranslations } from "next-intl/server"

export async function InvestmentFooter() {
  const t = await getTranslations("footer")

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft">{t("ledger")}</p>
        <p className="font-mono text-xs text-ink-faint">{t("data")}</p>
      </div>
    </footer>
  )
}
