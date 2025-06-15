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
      contractors: {
        Row: {
          id: string
          name: string
          parking_number: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          parking_number: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          parking_number?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          contractor_id: string
          year: number
          month: number
          amount: number
          paid_at: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          id?: string
          contractor_id: string
          year: number
          month: number
          amount: number
          paid_at?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          id?: string
          contractor_id?: string
          year?: number
          month?: number
          amount?: number
          paid_at?: string
          stripe_payment_intent_id?: string | null
        }
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
  }
}
