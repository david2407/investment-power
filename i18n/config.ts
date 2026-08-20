export const locales = ["es", "en"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "es"

export const localeCookieName = "locale"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value)
}

export const localeLabels: Record<Locale, string> = {
  es: "Español",
  en: "English",
}
