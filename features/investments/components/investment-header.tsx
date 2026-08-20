import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/auth/actions"
import { LanguageSwitcher } from "@/features/i18n/components/language-switcher"

export async function InvestmentHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const locale = await getLocale()
  const t = await getTranslations("header")

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? null

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5">
        <Link href="/" className="flex items-center gap-3">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="28" height="28" rx="7" fill="var(--color-cobalt)" />
            <rect x="8" y="14" width="3" height="7" rx="1.5" fill="white" />
            <rect x="15" y="7" width="3" height="14" rx="1.5" fill="white" />
          </svg>
          <span className="text-lg font-semibold tracking-tight text-ink">
            {t("brand")}
          </span>
          <span className="hidden text-sm text-ink-soft sm:inline">
            {t("tagline")}
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <p className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft md:inline-flex">
            <span className="h-2 w-2 rounded-full bg-gain" aria-hidden="true" />
            {t("saved")}
          </p>

          <LanguageSwitcher currentLocale={locale} />

          {user ? (
            <form action={signOut}>
              <span className="mr-2 hidden text-sm text-ink-soft md:inline">
                {displayName}
              </span>
              <button
                type="submit"
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-cobalt/40 hover:text-cobalt"
              >
                {t("signOut")}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-cobalt px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cobalt/90"
            >
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
