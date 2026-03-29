// Database type definitions — mirrors the schema in CLAUDE.md.
// Run `supabase gen types typescript` to replace this with auto-generated types once the schema is live.

export type UserRole = 'user' | 'organiser' | 'admin'
export type EventStatus = 'draft' | 'published' | 'cancelled'
export type JoinStatus = 'confirmed' | 'waitlist' | 'cancelled' | 'no_show'
export type OrgRequestStatus = 'pending' | 'approved' | 'declined'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          location: string | null
          interests: string[]
          role: UserRole
          stripe_account_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      communities: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          location: string
          organiser_id: string
          member_count: number
          verified: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['communities']['Row'], 'id' | 'created_at' | 'member_count' | 'verified'>
        Update: Partial<Database['public']['Tables']['communities']['Insert']>
      }
      events: {
        Row: {
          id: string
          community_id: string
          organiser_id: string
          title: string
          description: string
          location: string
          date: string
          price_pence: number
          capacity: number
          spots_taken: number
          waitlist_enabled: boolean
          members_only: boolean
          status: EventStatus
          stripe_price_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'spots_taken'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      event_joins: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: JoinStatus
          stripe_payment_intent_id: string | null
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_joins']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['event_joins']['Insert']>
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['community_members']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['community_members']['Insert']>
      }
      org_requests: {
        Row: {
          id: string
          user_id: string
          community_name: string
          category: string
          description: string
          location: string
          status: OrgRequestStatus
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['org_requests']['Row'], 'id' | 'created_at' | 'status'>
        Update: Partial<Database['public']['Tables']['org_requests']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      event_status: EventStatus
      join_status: JoinStatus
      org_request_status: OrgRequestStatus
    }
  }
}
