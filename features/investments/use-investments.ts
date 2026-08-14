"use client"

import { useSyncExternalStore } from "react"
import {
  getInvestments,
  getStorageStatus,
  persistInvestment,
  subscribe,
  type PersistResult,
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
  }
}
