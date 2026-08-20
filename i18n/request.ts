import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { defaultLocale, isLocale, localeCookieName } from "./config"

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieValue = store.get(localeCookieName)?.value

  let locale = defaultLocale
  if (isLocale(cookieValue)) {
    locale = cookieValue
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
