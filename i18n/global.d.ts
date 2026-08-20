import { locales } from "./config"

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number]
  }
}
