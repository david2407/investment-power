import seedInvestments from "@/data/investments.seed.json"
import type { Investment, NewInvestment } from "./types"

export const STORAGE_KEY = "investments:v1"

const SEED = seedInvestments as Investment[]

const listeners = new Set<() => void>()
let cachedRaw: string | null = null
let cachedValue: Investment[] | null = null

function readAll(): Investment[] {
  if (typeof window === "undefined") return SEED

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw && cachedValue !== null) return cachedValue

    let next: Investment[]
    if (raw === null) {
      next = SEED
    } else {
      const parsed: unknown = JSON.parse(raw)
      next = Array.isArray(parsed) ? (parsed as Investment[]) : SEED
    }

    cachedRaw = raw
    cachedValue = next
    return next
  } catch {
    if (cachedValue === null) cachedValue = SEED
    return cachedValue
  }
}

export function getInvestments(): Investment[] {
  return readAll()
}

export interface PersistResult {
  investment: Investment
  persisted: boolean
}

export function persistInvestment(input: NewInvestment): PersistResult {
  const investment: Investment = { id: createId(), ...input }
  const next = [investment, ...readAll()]

  let persisted = false
  try {
    const serialized = JSON.stringify(next)
    window.localStorage.setItem(STORAGE_KEY, serialized)
    cachedRaw = serialized
    cachedValue = next
    persisted = true
  } catch {
    cachedValue = next
  }

  listeners.forEach((callback) => callback())
  return { investment, persisted }
}

let storageAvailability: boolean | null = null

export function isStorageAvailable(): boolean {
  if (storageAvailability !== null) return storageAvailability
  if (typeof window === "undefined") {
    storageAvailability = false
    return storageAvailability
  }
  try {
    const probeKey = `${STORAGE_KEY}__probe`
    window.localStorage.setItem(probeKey, "1")
    window.localStorage.removeItem(probeKey)
    storageAvailability = true
  } catch {
    storageAvailability = false
  }
  return storageAvailability
}

export type StorageStatus = "loading" | "ok" | "unavailable"

export function getStorageStatus(): StorageStatus {
  return isStorageAvailable() ? "ok" : "unavailable"
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent)
  }
  return () => {
    listeners.delete(callback)
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent)
    }
  }
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return
  cachedRaw = null
  cachedValue = null
  listeners.forEach((callback) => callback())
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
