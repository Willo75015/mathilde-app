// Types Supabase générés pour l'application Mathilde Fleurs
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          end_date: string | null
          time: string
          end_time: string | null
          location: string
          client_id: string
          client_name: string
          budget: number
          status: 'DRAFT' | 'IN_PROGRESS' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'INVOICED' | 'PAID'
          florists_required: number
          assigned_florists: AssignedFlorist[] | null
          flowers: EventFlower[] | null
          completed_date: string | null
          invoiced: boolean
          paid: boolean
          paid_date: string | null
          archived: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          end_date?: string | null
          time: string
          end_time?: string | null
          location: string
          client_id: string
          client_name: string
          budget: number
          status?: 'DRAFT' | 'IN_PROGRESS' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'INVOICED' | 'PAID'
          florists_required: number
          assigned_florists?: AssignedFlorist[] | null
          flowers?: EventFlower[] | null
          completed_date?: string | null
          invoiced?: boolean
          paid?: boolean
          paid_date?: string | null
          archived?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          end_date?: string | null
          time?: string
          end_time?: string | null
          location?: string
          client_id?: string
          client_name?: string
          budget?: number
          status?: 'DRAFT' | 'IN_PROGRESS' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'INVOICED' | 'PAID'
          florists_required?: number
          assigned_florists?: AssignedFlorist[] | null
          flowers?: EventFlower[] | null
          completed_date?: string | null
          invoiced?: boolean
          paid?: boolean
          paid_date?: string | null
          archived?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          address: ClientAddress | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          address?: ClientAddress | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          address?: ClientAddress | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      florists: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          skills: string[] | null
          rating: number
          hourly_rate: number
          availability: FloristAvailability | null
          unavailable_periods: UnavailablePeriod[] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          skills?: string[] | null
          rating?: number
          hourly_rate: number
          availability?: FloristAvailability | null
          unavailable_periods?: UnavailablePeriod[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          skills?: string[] | null
          rating?: number
          hourly_rate?: number
          availability?: FloristAvailability | null
          unavailable_periods?: UnavailablePeriod[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      flowers: {
        Row: {
          id: string
          name: string
          color: string
          price_per_unit: number
          seasonal: boolean
          available_months: number[] | null
          stock_quantity: number
          supplier: string | null
          care_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          price_per_unit: number
          seasonal?: boolean
          available_months?: number[] | null
          stock_quantity: number
          supplier?: string | null
          care_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          price_per_unit?: number
          seasonal?: boolean
          available_months?: number[] | null
          stock_quantity?: number
          supplier?: string | null
          care_instructions?: string | null
          created_at?: string
          updated_at?: string
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
      event_status: 'DRAFT' | 'IN_PROGRESS' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'INVOICED' | 'PAID'
    }
  }
}

// Types auxiliaires
export interface AssignedFlorist {
  floristId: string
  floristName: string
  isConfirmed: boolean
  status: 'pending' | 'confirmed' | 'declined' | 'not_selected'
  assignedAt: string
  confirmedAt?: string
}

export interface EventFlower {
  flowerId: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
}

export interface ClientAddress {
  street: string
  city: string
  postalCode: string
  country: string
}

export interface FloristAvailability {
  monday: TimeSlot[]
  tuesday: TimeSlot[]
  wednesday: TimeSlot[]
  thursday: TimeSlot[]
  friday: TimeSlot[]
  saturday: TimeSlot[]
  sunday: TimeSlot[]
}

export interface TimeSlot {
  start: string
  end: string
}

export interface UnavailablePeriod {
  startDate: string
  endDate: string
  reason: string
}
