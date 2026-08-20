import { useTranslations } from "next-intl"
import { setLocale } from "@/i18n/actions"
import { defaultLocale, isLocale, localeLabels } from "@/i18n/config"

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("language")
  const activeLocale = isLocale(currentLocale) ? currentLocale : defaultLocale

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center rounded-full border border-line bg-surface p-0.5"
    >
      {(["es", "en"] as const).map((locale) => {
        const isActive = locale === activeLocale
        return (
          <form key={locale} action={setLocale.bind(null, locale)}>
            <button
              type="submit"
              aria-pressed={isActive}
              aria-label={t(locale)}
              className={
                isActive
                  ? "rounded-full bg-cobalt px-3 py-1 text-xs font-medium text-white transition-colors"
                  : "rounded-full px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
              }
            >
              {localeLabels[locale]}
            </button>
          </form>
        )
      })}
    </div>
  )
}
