"use client"

import { useSyncExternalStore } from "react"
import {
  deleteInvestment,
  getInvestments,
  getStorageStatus,
  persistInvestment,
  subscribe,
  updateCurrentPrice,
  type DeleteResult,
  type PersistResult,
  type UpdateResult,
} from "./storage.client"
import type { NewInvestment } from "./types"

export function useInvestments() {
  const investments = useSyncExternalStore(subscribe, getInvestments, getInvestments)
  const storageStatus = useSyncExternalStore(
    subscribe,
    getStorageStatus,
    () => "loading",
  )

  return {
    investments,
    storageStatus,
    addInvestment: persistInvestment as (input: NewInvestment) => PersistResult,
    deleteInvestment: deleteInvestment as (id: string) => DeleteResult,
    updateCurrentPrice: updateCurrentPrice as (id: string, currentPrice: number) => UpdateResult,
  }
}
