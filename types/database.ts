export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          timezone: string
          check_in_time: string
          check_out_time: string
          created_at: string
          description: string | null
          amenities: string[]
          bedroom_count: number
          bathroom_count: number
          max_guests: number
          address: string | null
          photos: string[]
          price_weekday: number
          price_weekend: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          timezone?: string
          check_in_time?: string
          check_out_time?: string
          created_at?: string
          description?: string | null
          amenities?: string[]
          bedroom_count?: number
          bathroom_count?: number
          max_guests?: number
          address?: string | null
          photos?: string[]
          price_weekday?: number
          price_weekend?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          timezone?: string
          check_in_time?: string
          check_out_time?: string
          description?: string | null
          amenities?: string[]
          bedroom_count?: number
          bathroom_count?: number
          max_guests?: number
          address?: string | null
          photos?: string[]
          price_weekday?: number
          price_weekend?: number
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          property_id: string
          room_number: string
          room_type: string
          capacity: number
          price_weekday: number
          price_weekend: number
          status: 'active' | 'maintenance' | 'inactive'
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          room_number: string
          room_type?: string
          capacity?: number
          price_weekday?: number
          price_weekend?: number
          status?: 'active' | 'maintenance' | 'inactive'
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          room_number?: string
          room_type?: string
          capacity?: number
          price_weekday?: number
          price_weekend?: number
          status?: 'active' | 'maintenance' | 'inactive'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rooms_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          }
        ]
      }
      guests: {
        Row: {
          id: string
          property_id: string
          name: string
          phone: string | null
          email: string | null
          id_number: string | null
          address: string | null
          ktp_photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          name: string
          phone?: string | null
          email?: string | null
          id_number?: string | null
          address?: string | null
          ktp_photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          id_number?: string | null
          address?: string | null
          ktp_photo_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          property_id: string
          room_id: string
          guest_id: string | null
          check_in: string
          check_out: string
          source: 'direct' | 'airbnb' | 'agoda'
          external_uid: string | null
          status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
          nights: number
          total_price: number | null
          notes: string | null
          adult_count: number
          child_count: number
          source_referral: string | null
          payment_proof_url: string | null
          payment_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          room_id: string
          guest_id?: string | null
          check_in: string
          check_out: string
          source?: 'direct' | 'airbnb' | 'agoda'
          external_uid?: string | null
          status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
          total_price?: number | null
          notes?: string | null
          adult_count?: number
          child_count?: number
          source_referral?: string | null
          payment_proof_url?: string | null
          payment_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          room_id?: string
          guest_id?: string | null
          check_in?: string
          check_out?: string
          source?: 'direct' | 'airbnb' | 'agoda'
          external_uid?: string | null
          status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
          total_price?: number | null
          notes?: string | null
          adult_count?: number
          child_count?: number
          source_referral?: string | null
          payment_proof_url?: string | null
          payment_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_guest_id_fkey'
            columns: ['guest_id']
            isOneToOne: false
            referencedRelation: 'guests'
            referencedColumns: ['id']
          }
        ]
      }
      availability_blocks: {
        Row: {
          id: string
          property_id: string
          room_id: string
          start_date: string
          end_date: string
          reason: string | null
        }
        Insert: {
          id?: string
          property_id: string
          room_id: string
          start_date: string
          end_date: string
          reason?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          room_id?: string
          start_date?: string
          end_date?: string
          reason?: string | null
        }
        Relationships: []
      }
      ical_sources: {
        Row: {
          id: string
          property_id: string
          room_id: string
          platform: 'airbnb' | 'agoda' | 'other'
          ical_url: string
          is_active: boolean
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          property_id: string
          room_id: string
          platform: 'airbnb' | 'agoda' | 'other'
          ical_url: string
          is_active?: boolean
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          room_id?: string
          platform?: 'airbnb' | 'agoda' | 'other'
          ical_url?: string
          is_active?: boolean
          last_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ical_sources_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ical_sources_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          }
        ]
      }
      sync_logs: {
        Row: {
          id: string
          property_id: string
          source_id: string
          synced_at: string
          events_found: number
          events_inserted: number
          events_updated: number
          error: string | null
        }
        Insert: {
          id?: string
          property_id: string
          source_id: string
          synced_at?: string
          events_found?: number
          events_inserted?: number
          events_updated?: number
          error?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          source_id?: string
          synced_at?: string
          events_found?: number
          events_inserted?: number
          events_updated?: number
          error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sync_logs_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'ical_sources'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_available_rooms: {
        Args: { p_property_id: string; p_check_in: string; p_check_out: string }
        Returns: Database['public']['Tables']['rooms']['Row'][]
      }
      is_property_owner: {
        Args: { pid: string }
        Returns: boolean
      }
    }
    Enums: {
      room_status: 'active' | 'maintenance' | 'inactive'
      booking_source: 'direct' | 'airbnb' | 'agoda'
      booking_status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
      ical_platform: 'airbnb' | 'agoda' | 'other'
    }
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Property = Database['public']['Tables']['properties']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type Guest = Database['public']['Tables']['guests']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type AvailabilityBlock = Database['public']['Tables']['availability_blocks']['Row']
export type IcalSource = Database['public']['Tables']['ical_sources']['Row']
export type SyncLog = Database['public']['Tables']['sync_logs']['Row']
