import seedInvestments from "@/data/investments.seed.json"
import deletedSeedInvestments from "@/data/investments.deleted.seed.json"
import type { DeletedInvestment, Investment, NewInvestment } from "./types"

export const STORAGE_KEY = "investments:v1"
export const DELETED_STORAGE_KEY = "investments:deleted:v1"

const SEED = seedInvestments as Investment[]
const DELETED_SEED = deletedSeedInvestments as DeletedInvestment[]

const listeners = new Set<() => void>()
let cachedRaw: string | null = null
let cachedValue: Investment[] | null = null
let cachedDeletedRaw: string | null = null
let cachedDeletedValue: DeletedInvestment[] | null = null

function isInvestmentRecord(value: unknown): value is Investment {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    (record.assetType === "stock" || record.assetType === "crypto") &&
    typeof record.assetName === "string" &&
    typeof record.symbol === "string" &&
    typeof record.platform === "string" &&
    typeof record.quantity === "number" &&
    typeof record.purchasePrice === "number" &&
    typeof record.purchaseDate === "string" &&
    typeof record.currentPrice === "number" &&
    typeof record.currency === "string"
  )
}

function isDeletedInvestmentRecord(value: unknown): value is DeletedInvestment {
  return isInvestmentRecord(value) && typeof (value as DeletedInvestment).deletedAt === "string"
}

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
      next = Array.isArray(parsed)
        ? parsed.filter(isInvestmentRecord)
        : SEED
    }

    cachedRaw = raw
    cachedValue = next
    return next
  } catch {
    if (cachedValue === null) cachedValue = SEED
    return cachedValue
  }
}

function readAllDeleted(): DeletedInvestment[] {
  if (typeof window === "undefined") return DELETED_SEED

  try {
    const raw = window.localStorage.getItem(DELETED_STORAGE_KEY)
    if (raw === cachedDeletedRaw && cachedDeletedValue !== null) return cachedDeletedValue

    let next: DeletedInvestment[]
    if (raw === null) {
      next = DELETED_SEED
    } else {
      const parsed: unknown = JSON.parse(raw)
      next = Array.isArray(parsed)
        ? parsed.filter(isDeletedInvestmentRecord)
        : DELETED_SEED
    }

    cachedDeletedRaw = raw
    cachedDeletedValue = next
    return next
  } catch {
    if (cachedDeletedValue === null) cachedDeletedValue = DELETED_SEED
    return cachedDeletedValue
  }
}

export function getInvestments(): Investment[] {
  return readAll()
}

export function getDeletedInvestments(): DeletedInvestment[] {
  return readAllDeleted()
}

export interface DeleteResult {
  deleted: boolean
  persisted: boolean
}

export function deleteInvestment(id: string): DeleteResult {
  const active = readAll()
  const investment = active.find((item) => item.id === id)
  if (!investment) return { deleted: false, persisted: true }

  const nextActive = active.filter((item) => item.id !== id)
  const nextDeleted: DeletedInvestment = {
    ...investment,
    deletedAt: new Date().toISOString(),
  }
  const nextDeletedList = [nextDeleted, ...readAllDeleted()]

  const previousDeletedRaw =
    typeof window !== "undefined"
      ? window.localStorage.getItem(DELETED_STORAGE_KEY)
      : null

  let deletedSerialized: string
  try {
    deletedSerialized = JSON.stringify(nextDeletedList)
    window.localStorage.setItem(DELETED_STORAGE_KEY, deletedSerialized)
  } catch {
    return { deleted: false, persisted: false }
  }

  try {
    const activeSerialized = JSON.stringify(nextActive)
    window.localStorage.setItem(STORAGE_KEY, activeSerialized)
    cachedRaw = activeSerialized
    cachedValue = nextActive
  } catch {
    try {
      if (previousDeletedRaw === null) {
        window.localStorage.removeItem(DELETED_STORAGE_KEY)
      } else {
        window.localStorage.setItem(DELETED_STORAGE_KEY, previousDeletedRaw)
      }
    } catch {
      // Best-effort rollback only; the row itself was never removed from active.
    }
    return { deleted: false, persisted: false }
  }

  cachedDeletedRaw = deletedSerialized
  cachedDeletedValue = nextDeletedList
  listeners.forEach((callback) => callback())
  return { deleted: true, persisted: true }
}

export interface PersistResult {
  investment: Investment
  persisted: boolean
}

export interface UpdateResult {
  persisted: boolean
}

export function updateCurrentPrice(id: string, currentPrice: number): UpdateResult {
  const active = readAll()
  if (!active.some((item) => item.id === id)) return { persisted: true }

  const next = active.map((item) =>
    item.id === id ? { ...item, currentPrice } : item,
  )

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
  return { persisted }
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
  if (
    event.key !== STORAGE_KEY &&
    event.key !== DELETED_STORAGE_KEY &&
    event.key !== null
  ) {
    return
  }
  cachedRaw = null
  cachedValue = null
  cachedDeletedRaw = null
  cachedDeletedValue = null
  listeners.forEach((callback) => callback())
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
