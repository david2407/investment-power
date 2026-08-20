import { Suspense } from "react"
import { getLocale, getTranslations } from "next-intl/server"
import { LoginButton } from "./login-button"
import { LoginError } from "./login-error"
import { LanguageSwitcher } from "@/features/i18n/components/language-switcher"

export default async function LoginPage() {
  const t = await getTranslations("login")
  const locale = await getLocale()

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-16">
      <div className="w-full rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <svg
            width="32"
            height="32"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="28" height="28" rx="7" fill="var(--color-cobalt)" />
            <rect x="8" y="14" width="3" height="7" rx="1.5" fill="white" />
            <rect x="15" y="7" width="3" height="14" rx="1.5" fill="white" />
          </svg>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">{t("title")}</h1>
            <p className="text-sm text-ink-soft">{t("subtitle")}</p>
          </div>
        </div>

        <Suspense fallback={null}>
          <LoginError />
        </Suspense>

        <LoginButton />
      </div>

      <div className="mt-6">
        <LanguageSwitcher currentLocale={locale} />
      </div>
    </main>
  )
}
