"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

export function LoginError() {
  const t = useTranslations("login")
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  if (!error) return null

  return (
    <p role="alert" className="mb-6 rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss">
      {t("authError")}
    </p>
  )
}
