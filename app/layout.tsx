import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "@/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const cookieValue = store.get(localeCookieName)?.value
  return isLocale(cookieValue) ? cookieValue : defaultLocale
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "metadata" })
  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
