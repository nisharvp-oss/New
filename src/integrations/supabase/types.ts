export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addon_bookings: {
        Row: {
          addon_id: string
          created_at: string
          id: string
          method: string
          status: string
          traveler_id: string
          trip_id: string
        }
        Insert: {
          addon_id: string
          created_at?: string
          id?: string
          method?: string
          status?: string
          traveler_id: string
          trip_id: string
        }
        Update: {
          addon_id?: string
          created_at?: string
          id?: string
          method?: string
          status?: string
          traveler_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addon_bookings_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_bookings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "trip_travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      addons: {
        Row: {
          created_at: string
          cutoff: string | null
          description: string
          id: string
          methods: string[]
          price: number
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          cutoff?: string | null
          description?: string
          id?: string
          methods?: string[]
          price?: number
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          cutoff?: string | null
          description?: string
          id?: string
          methods?: string[]
          price?: number
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addons_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          bank_details: string | null
          cash_note: string | null
          contact_email: string | null
          created_at: string
          id: string
          kind: string
          name: string
          owner_id: string
          paid_until: string | null
          payment_link: string | null
          phone: string | null
          plan_id: string | null
          smtp_from_email: string | null
          smtp_from_name: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_secure: string
          smtp_user: string | null
          status: string
          trial_ends_at: string | null
        }
        Insert: {
          bank_details?: string | null
          cash_note?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          kind?: string
          name: string
          owner_id: string
          paid_until?: string | null
          payment_link?: string | null
          phone?: string | null
          plan_id?: string | null
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: string
          smtp_user?: string | null
          status?: string
          trial_ends_at?: string | null
        }
        Update: {
          bank_details?: string | null
          cash_note?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          owner_id?: string
          paid_until?: string | null
          payment_link?: string | null
          phone?: string | null
          plan_id?: string | null
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: string
          smtp_user?: string | null
          status?: string
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invites: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id?: string
          role: Database["public"]["Enums"]["company_role"]
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          created_at: string
          day: number
          id: string
          location: string
          meals: string[]
          notice: string
          time: string
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          day?: number
          id?: string
          location?: string
          meals?: string[]
          notice?: string
          time?: string
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          day?: number
          id?: string
          location?: string
          meals?: string[]
          notice?: string
          time?: string
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_secrets: {
        Row: {
          provider: string
          secret: string
          updated_at: string
        }
        Insert: {
          provider: string
          secret: string
          updated_at?: string
        }
        Update: {
          provider?: string
          secret?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          billing_interval: string
          created_at: string
          description: string
          features: string[]
          id: string
          is_active: boolean
          max_organisers: number | null
          max_travelers_per_trip: number | null
          max_trips: number | null
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          is_active?: boolean
          max_organisers?: number | null
          max_travelers_per_trip?: number | null
          max_trips?: number | null
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          billing_interval?: string
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          is_active?: boolean
          max_organisers?: number | null
          max_travelers_per_trip?: number | null
          max_trips?: number | null
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          currency: string
          free_trip_travelers: number
          id: number
          paypal_client_id: string
          paypal_email: string
          paypal_mode: string
          smtp_from_email: string | null
          smtp_from_name: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_secure: string
          smtp_user: string | null
          stripe_account_email: string
          stripe_publishable_key: string
          trial_days: number
          trip_unlock_price: number
          updated_at: string
        }
        Insert: {
          currency?: string
          free_trip_travelers?: number
          id?: number
          paypal_client_id?: string
          paypal_email?: string
          paypal_mode?: string
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: string
          smtp_user?: string | null
          stripe_account_email?: string
          stripe_publishable_key?: string
          trial_days?: number
          trip_unlock_price?: number
          updated_at?: string
        }
        Update: {
          currency?: string
          free_trip_travelers?: number
          id?: number
          paypal_client_id?: string
          paypal_email?: string
          paypal_mode?: string
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: string
          smtp_user?: string | null
          stripe_account_email?: string
          stripe_publishable_key?: string
          trial_days?: number
          trip_unlock_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      smtp_secrets: {
        Row: {
          company_id: string | null
          id: string
          is_platform: boolean
          password: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          id?: string
          is_platform?: boolean
          password: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          id?: string
          is_platform?: boolean
          password?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smtp_secrets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          message: string
          phone: string
          status: string
          traveler_name: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string
          phone?: string
          status?: string
          traveler_name?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string
          phone?: string
          status?: string
          traveler_name?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checkins: {
        Row: {
          checked_by: string
          checked_by_name: string
          checkpoint: string
          created_at: string
          id: string
          traveler_id: string
          trip_id: string
        }
        Insert: {
          checked_by?: string
          checked_by_name?: string
          checkpoint: string
          created_at?: string
          id?: string
          traveler_id: string
          trip_id: string
        }
        Update: {
          checked_by?: string
          checked_by_name?: string
          checkpoint?: string
          created_at?: string
          id?: string
          traveler_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checkins_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "trip_travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_checkins_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_documents: {
        Row: {
          created_at: string
          id: string
          kind: string
          path: string
          title: string
          traveler_id: string
          trip_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          path: string
          title: string
          traveler_id: string
          trip_id: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          path?: string
          title?: string
          traveler_id?: string
          trip_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "trip_travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string
          id: string
          paid_by: string
          split_type: string
          splits: Json
          trip_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          description: string
          id?: string
          paid_by: string
          split_type?: string
          splits?: Json
          trip_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          paid_by?: string
          split_type?: string
          splits?: Json
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_messages: {
        Row: {
          author: string
          created_at: string
          id: string
          text: string
          trip_id: string
          user_id: string
        }
        Insert: {
          author?: string
          created_at?: string
          id?: string
          text: string
          trip_id: string
          user_id: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: string
          text?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_settlements: {
        Row: {
          amount: number
          created_at: string
          from_id: string
          id: string
          to_id: string
          trip_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_id: string
          id?: string
          to_id: string
          trip_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_id?: string
          id?: string
          to_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_settlements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_sponsors: {
        Row: {
          address: string
          category: string
          clicks: number
          contact_email: string
          created_at: string
          created_by: string | null
          description: string
          flyer_url: string
          id: string
          is_premium: boolean
          kind: string
          lat: number | null
          lng: number | null
          logo_url: string
          name: string
          phone: string
          trip_id: string
          video_url: string
          views: number
          website: string
        }
        Insert: {
          address?: string
          category?: string
          clicks?: number
          contact_email?: string
          created_at?: string
          created_by?: string | null
          description?: string
          flyer_url?: string
          id?: string
          is_premium?: boolean
          kind?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string
          name: string
          phone?: string
          trip_id: string
          video_url?: string
          views?: number
          website?: string
        }
        Update: {
          address?: string
          category?: string
          clicks?: number
          contact_email?: string
          created_at?: string
          created_by?: string | null
          description?: string
          flyer_url?: string
          id?: string
          is_premium?: boolean
          kind?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string
          name?: string
          phone?: string
          trip_id?: string
          video_url?: string
          views?: number
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_sponsors_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_tickets: {
        Row: {
          code: string
          created_at: string
          details: string
          id: string
          status: string
          title: string
          traveler_id: string
          trip_id: string
          valid_on: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          details?: string
          id?: string
          status?: string
          title: string
          traveler_id: string
          trip_id: string
          valid_on?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          details?: string
          id?: string
          status?: string
          title?: string
          traveler_id?: string
          trip_id?: string
          valid_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_tickets_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "trip_travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_tickets_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_travelers: {
        Row: {
          created_at: string
          dietary: string
          email: string
          emergency: string
          id: string
          name: string
          payment: string
          phone: string
          trip_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dietary?: string
          email: string
          emergency?: string
          id?: string
          name?: string
          payment?: string
          phone?: string
          trip_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dietary?: string
          email?: string
          emergency?: string
          id?: string
          name?: string
          payment?: string
          phone?: string
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_travelers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          caretaker_id: string | null
          company_id: string
          created_at: string
          description: string
          destination: string
          end_date: string | null
          id: string
          is_published: boolean
          organiser_id: string | null
          price: number | null
          seats: number | null
          start_date: string | null
          title: string
          unlock_requested: boolean
          unlocked: boolean
        }
        Insert: {
          caretaker_id?: string | null
          company_id: string
          created_at?: string
          description?: string
          destination?: string
          end_date?: string | null
          id?: string
          is_published?: boolean
          organiser_id?: string | null
          price?: number | null
          seats?: number | null
          start_date?: string | null
          title: string
          unlock_requested?: boolean
          unlocked?: boolean
        }
        Update: {
          caretaker_id?: string | null
          company_id?: string
          created_at?: string
          description?: string
          destination?: string
          end_date?: string | null
          id?: string
          is_published?: boolean
          organiser_id?: string | null
          price?: number | null
          seats?: number | null
          start_date?: string | null
          title?: string
          unlock_requested?: boolean
          unlocked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "trips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_my_invites: { Args: never; Returns: number }
      admin_set_sponsor_premium: {
        Args: { _premium: boolean; _sponsor: string }
        Returns: undefined
      }
      admin_set_trip_unlock: {
        Args: { _trip: string; _unlocked: boolean }
        Returns: undefined
      }
      can_see_trip: { Args: { _trip: string; _user: string }; Returns: boolean }
      company_is_writable: { Args: { _company: string }; Returns: boolean }
      company_role_of: {
        Args: { _company: string; _user: string }
        Returns: Database["public"]["Enums"]["company_role"]
      }
      create_company: {
        Args: { _name: string; _plan: string }
        Returns: string
      }
      free_trip_terms: {
        Args: never
        Returns: {
          currency: string
          free_travelers: number
          unlock_price: number
        }[]
      }
      get_personal_space: { Args: never; Returns: string }
      get_trial_days: { Args: never; Returns: number }
      grant_super_admin: { Args: { _email: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      is_sponsor_owner: { Args: { _email: string }; Returns: boolean }
      is_trip_staff: {
        Args: { _trip: string; _user: string }
        Returns: boolean
      }
      is_trip_traveler: {
        Args: { _trip: string; _user: string }
        Returns: boolean
      }
      link_my_trips: { Args: never; Returns: number }
      list_super_admins: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      record_sponsor_event: {
        Args: { _id: string; _kind: string }
        Returns: undefined
      }
      revoke_super_admin: { Args: { _user: string }; Returns: undefined }
      shares_company: { Args: { _a: string; _b: string }; Returns: boolean }
      trip_company: { Args: { _trip: string }; Returns: string }
      trip_is_free: { Args: { _trip: string }; Returns: boolean }
      trip_payment_info: {
        Args: { _trip: string }
        Returns: {
          bank_details: string
          cash_note: string
          company_name: string
          contact_email: string
          payment_link: string
          phone: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin"
      company_role: "owner" | "organiser" | "caretaker"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin"],
      company_role: ["owner", "organiser", "caretaker"],
    },
  },
} as const
