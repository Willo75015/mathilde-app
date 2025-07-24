// Types générés depuis votre schéma Supabase
// Remplacez ces types par ceux générés via : npx supabase gen types typescript

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: {
            street: string
            city: string
            postal_code: string
            country: string
          }
          preferences?: {
            favorite_colors: string[]
            favorite_flowers: string[]
            allergies?: string[]
            budget_min?: number
            budget_max?: number
          }
          notes?: string
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      events: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          date: string
          time: string
          location: string
          client_id: string
          budget: number
          status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          flowers: Array<{
            flower_id: string
            quantity: number
            notes?: string
          }>
          notes?: string
          images?: string[]
          reminder_sent: boolean
          payment_status: 'pending' | 'partial' | 'completed'
          payment_amount: number
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      flowers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          category: 'roses' | 'tulips' | 'carnations' | 'lilies' | 'orchids' | 'seasonal' | 'exotic'
          color: string
          seasonality: string[]
          price_per_unit: number
          stock: number
          description?: string
          image_url?: string
          min_order_quantity: number
          max_order_quantity: number
        }
        Insert: Omit<Database['public']['Tables']['flowers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['flowers']['Insert']>
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          first_name: string
          last_name: string
          role: 'admin' | 'florist' | 'client'
          preferences: {
            theme: 'light' | 'dark' | 'system'
            language: string
            notifications: {
              email: boolean
              push: boolean
              reminders: boolean
            }
          }
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
