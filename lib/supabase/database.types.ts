export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      investments: {
        Row: {
          asset_name: string
          asset_type: "stock" | "crypto"
          created_at: string
          currency: string
          current_price: number
          id: string
          platform: string
          purchase_date: string
          purchase_price: number
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_name: string
          asset_type: "stock" | "crypto"
          created_at?: string
          currency: string
          current_price: number
          id?: string
          platform: string
          purchase_date: string
          purchase_price: number
          quantity: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_name?: string
          asset_type?: "stock" | "crypto"
          created_at?: string
          currency?: string
          current_price?: number
          id?: string
          platform?: string
          purchase_date?: string
          purchase_price?: number
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
