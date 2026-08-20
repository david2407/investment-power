"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import type { Investment } from "../types"

interface DeleteInvestmentDialogProps {
  investment: Investment
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteInvestmentDialog({
  investment,
  onCancel,
  onConfirm,
}: DeleteInvestmentDialogProps) {
  const t = useTranslations("deleteDialog")
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [])

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onCancel()
  }

  const identifier = [investment.assetName, investment.symbol]
    .filter(Boolean)
    .join(" ")

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={handleBackdropClick}
      className="m-auto w-full max-w-md rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/50"
      aria-labelledby="delete-investment-title"
      aria-describedby="delete-investment-description"
    >
      <div className="border-b border-line px-6 py-5">
        <h2
          id="delete-investment-title"
          className="text-lg font-semibold tracking-tight"
        >
          {t("title")}
        </h2>
        <p id="delete-investment-description" className="mt-1 text-sm text-ink-soft">
          {t("description", { identifier })}
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-5">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-loss px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-loss/90"
        >
          {t("confirm")}
        </button>
      </div>
    </dialog>
  )
}
