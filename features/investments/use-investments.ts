"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import type { Investment, NewInvestment } from "./types"

type InvestmentRow = Database["public"]["Tables"]["investments"]["Row"]

export type StorageStatus = "loading" | "ok" | "unavailable"

export interface PersistResult {
  investment: Investment | null
  persisted: boolean
}

export interface DeleteResult {
  deleted: boolean
  persisted: boolean
}

export interface UpdateResult {
  persisted: boolean
}

export interface BatchUpdateResult {
  updatedCount: number
  persisted: boolean
}

function toInvestment(row: InvestmentRow): Investment {
  return {
    id: row.id,
    assetType: row.asset_type,
    assetName: row.asset_name,
    symbol: row.symbol,
    platform: row.platform,
    quantity: Number(row.quantity),
    purchasePrice: Number(row.purchase_price),
    purchaseDate: row.purchase_date,
    currentPrice: Number(row.current_price),
    currency: row.currency,
  }
}

export function useInvestments() {
  const supabase = useMemo(() => createClient(), [])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [status, setStatus] = useState<StorageStatus>("loading")

  const loadInvestments = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setInvestments([])
      setStatus("ok")
      return
    }

    const { data, error } = await supabase
      .from("investments")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setStatus("unavailable")
      return
    }

    setInvestments((data ?? []).map(toInvestment))
    setStatus("ok")
  }, [supabase])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadInvestments()
      } else {
        setInvestments([])
        setStatus("ok")
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, loadInvestments])

  const addInvestment = useCallback(
    async (input: NewInvestment): Promise<PersistResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { investment: null, persisted: false }

      const { data, error } = await supabase
        .from("investments")
        .insert({
          asset_type: input.assetType,
          asset_name: input.assetName,
          symbol: input.symbol,
          platform: input.platform,
          quantity: input.quantity,
          purchase_price: input.purchasePrice,
          purchase_date: input.purchaseDate,
          current_price: input.currentPrice,
          currency: input.currency,
          user_id: user.id,
        })
        .select()
        .single()

      if (error || !data) return { investment: null, persisted: false }

      const investment = toInvestment(data)
      setInvestments((current) => [investment, ...current])
      return { investment, persisted: true }
    },
    [supabase],
  )

  const deleteInvestment = useCallback(
    async (id: string): Promise<DeleteResult> => {
      const { error } = await supabase.from("investments").delete().eq("id", id)
      if (error) return { deleted: false, persisted: false }

      setInvestments((current) => current.filter((item) => item.id !== id))
      return { deleted: true, persisted: true }
    },
    [supabase],
  )

  const updateCurrentPrice = useCallback(
    async (id: string, currentPrice: number): Promise<UpdateResult> => {
      const { error } = await supabase
        .from("investments")
        .update({ current_price: currentPrice })
        .eq("id", id)

      if (error) return { persisted: false }

      setInvestments((current) =>
        current.map((item) => (item.id === id ? { ...item, currentPrice } : item)),
      )
      return { persisted: true }
    },
    [supabase],
  )

  const updateCurrentPrices = useCallback(
    async (
      updates: ReadonlyArray<{ id: string; currentPrice: number }>,
    ): Promise<BatchUpdateResult> => {
      if (updates.length === 0) return { updatedCount: 0, persisted: true }

      let persistedCount = 0
      for (const update of updates) {
        const { error } = await supabase
          .from("investments")
          .update({ current_price: update.currentPrice })
          .eq("id", update.id)
        if (!error) persistedCount += 1
      }

      const byId = new Map(updates.map((update) => [update.id, update.currentPrice]))
      setInvestments((current) =>
        current.map((item) => {
          const price = byId.get(item.id)
          return price === undefined ? item : { ...item, currentPrice: price }
        }),
      )

      return { updatedCount: persistedCount, persisted: persistedCount > 0 }
    },
    [supabase],
  )

  return {
    investments,
    storageStatus: status,
    addInvestment,
    deleteInvestment,
    updateCurrentPrice,
    updateCurrentPrices,
  }
}
