export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      open_mics_active: {
        Row: {
          Borough: string | null
          "Changes/updates": string | null
          Cost: string | null
          Day: string | null
          "Formerly verified": string | null
          "Help other comics! Leave reviews": string | null
          "Host(s) / Organizer": string | null
          "Last verified": string | null
          "Latest End Time": string | null
          Location: string | null
          Neighborhood: string | null
          "Open Mic": string | null
          "Other Rules": string | null
          "Sign-Up Instructions": string | null
          SMS: string | null
          "Stage time": string | null
          "Start Time": string | null
          unique_identifier: string
          "Venue Name": string | null
          "Venue type": string | null
        }
        Insert: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Update: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier?: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_mics_active_unique_identifier_fkey"
            columns: ["unique_identifier"]
            isOneToOne: true
            referencedRelation: "open_mics_historical"
            referencedColumns: ["unique_identifier"]
          },
        ]
      }
      open_mics_active_duplicate: {
        Row: {
          Borough: string | null
          "Changes/updates": string | null
          Cost: string | null
          Day: string | null
          "Formerly verified": string | null
          "Help other comics! Leave reviews": string | null
          "Host(s) / Organizer": string | null
          "Last verified": string | null
          "Latest End Time": string | null
          Location: string | null
          Neighborhood: string | null
          "Open Mic": string | null
          "Other Rules": string | null
          "Sign-Up Instructions": string | null
          SMS: string | null
          "Stage time": string | null
          "Start Time": string | null
          unique_identifier: string
          "Venue Name": string | null
          "Venue type": string | null
        }
        Insert: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Update: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier?: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_mics_active_duplicate_unique_identifier_fkey"
            columns: ["unique_identifier"]
            isOneToOne: true
            referencedRelation: "open_mics_historical"
            referencedColumns: ["unique_identifier"]
          },
        ]
      }
      open_mics_historical: {
        Row: {
          Borough: string | null
          "Changes/updates": string | null
          Cost: string | null
          Day: string | null
          "Formerly verified": string | null
          "Help other comics! Leave reviews": string | null
          "Host(s) / Organizer": string | null
          "Last verified": string | null
          last_available: string | null
          "Latest End Time": string | null
          Location: string | null
          Neighborhood: string | null
          "Open Mic": string | null
          "Other Rules": string | null
          "Sign-Up Instructions": string | null
          SMS: string | null
          "Stage time": string | null
          "Start Time": string | null
          unique_identifier: string
          "Venue Name": string | null
          "Venue type": string | null
        }
        Insert: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          last_available?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Update: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          last_available?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier?: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Relationships: []
      }
      open_mics_july: {
        Row: {
          Borough: string | null
          "Changes/updates": string | null
          Cost: string | null
          Day: string | null
          "Formerly verified": string | null
          "Help other comics! Leave reviews": string | null
          "Host(s) / Organizer": string | null
          "Last verified": string | null
          "Latest End Time": string | null
          Location: string | null
          Neighborhood: string | null
          "Open Mic": string | null
          "Other Rules": string | null
          "Sign-Up Instructions": string | null
          SMS: string | null
          "Stage time": string | null
          "Start Time": string | null
          unique_identifier: string
          "Venue Name": string | null
          "Venue type": string | null
        }
        Insert: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Update: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier?: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_mics_july_unique_identifier_fkey"
            columns: ["unique_identifier"]
            isOneToOne: true
            referencedRelation: "open_mics_historical"
            referencedColumns: ["unique_identifier"]
          },
        ]
      }
      open_mics_june: {
        Row: {
          Borough: string | null
          "Changes/updates": string | null
          Cost: string | null
          Day: string | null
          "Formerly verified": string | null
          "Help other comics! Leave reviews": string | null
          "Host(s) / Organizer": string | null
          "Last verified": string | null
          "Latest End Time": string | null
          Location: string | null
          Neighborhood: string | null
          "Open Mic": string | null
          "Other Rules": string | null
          "Sign-Up Instructions": string | null
          SMS: string | null
          "Stage time": string | null
          "Start Time": string | null
          unique_identifier: string
          "Venue Name": string | null
          "Venue type": string | null
        }
        Insert: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Update: {
          Borough?: string | null
          "Changes/updates"?: string | null
          Cost?: string | null
          Day?: string | null
          "Formerly verified"?: string | null
          "Help other comics! Leave reviews"?: string | null
          "Host(s) / Organizer"?: string | null
          "Last verified"?: string | null
          "Latest End Time"?: string | null
          Location?: string | null
          Neighborhood?: string | null
          "Open Mic"?: string | null
          "Other Rules"?: string | null
          "Sign-Up Instructions"?: string | null
          SMS?: string | null
          "Stage time"?: string | null
          "Start Time"?: string | null
          unique_identifier?: string
          "Venue Name"?: string | null
          "Venue type"?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_mics_june_unique_identifier_fkey"
            columns: ["unique_identifier"]
            isOneToOne: true
            referencedRelation: "open_mics_historical"
            referencedColumns: ["unique_identifier"]
          },
        ]
      }
      open_mics_requests: {
        Row: {
          borough: string | null
          created_at: string | null
          date: string | null
          reviewed: boolean
          show_title: string | null
          status: string | null
          time: string | null
          unique_identifier: string
          user_id: string | null
          venue_name: string | null
        }
        Insert: {
          borough?: string | null
          created_at?: string | null
          date?: string | null
          reviewed?: boolean
          show_title?: string | null
          status?: string | null
          time?: string | null
          unique_identifier?: string
          user_id?: string | null
          venue_name?: string | null
        }
        Update: {
          borough?: string | null
          created_at?: string | null
          date?: string | null
          reviewed?: boolean
          show_title?: string | null
          status?: string | null
          time?: string | null
          unique_identifier?: string
          user_id?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_mics_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_custom_shows: {
        Row: {
          borough: string | null
          created_at: string
          date: string | null
          id: string
          last_modified: string | null
          notes: string | null
          profile_id: string | null
          schedule_type: Database["public"]["Enums"]["schedule_type"]
          title: string | null
          venue: string | null
        }
        Insert: {
          borough?: string | null
          created_at?: string
          date?: string | null
          id?: string
          last_modified?: string | null
          notes?: string | null
          profile_id?: string | null
          schedule_type?: Database["public"]["Enums"]["schedule_type"]
          title?: string | null
          venue?: string | null
        }
        Update: {
          borough?: string | null
          created_at?: string
          date?: string | null
          id?: string
          last_modified?: string | null
          notes?: string | null
          profile_id?: string | null
          schedule_type?: Database["public"]["Enums"]["schedule_type"]
          title?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_custom_shows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_open_mics: {
        Row: {
          created_at: string
          id: string
          last_modified: string | null
          notes: string | null
          open_mic_id: string | null
          profile_id: string | null
          schedule_type: Database["public"]["Enums"]["schedule_type"] | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_modified?: string | null
          notes?: string | null
          open_mic_id?: string | null
          profile_id?: string | null
          schedule_type?: Database["public"]["Enums"]["schedule_type"] | null
        }
        Update: {
          created_at?: string
          id?: string
          last_modified?: string | null
          notes?: string | null
          open_mic_id?: string | null
          profile_id?: string | null
          schedule_type?: Database["public"]["Enums"]["schedule_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_open_mics_open_mic_id_fkey"
            columns: ["open_mic_id"]
            isOneToOne: false
            referencedRelation: "open_mics_historical"
            referencedColumns: ["unique_identifier"]
          },
          {
            foreignKeyName: "profile_open_mics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          isadmin: boolean
          phone: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          isadmin?: boolean
          phone?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          isadmin?: boolean
          phone?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      profiles_duplicate: {
        Row: {
          created_at: string
          id: string
          isadmin: boolean
          phone: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          isadmin?: boolean
          phone?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          isadmin?: boolean
          phone?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_mic_ratings: {
        Row: {
          created_at: string
          id: string
          mic_unique_identifier: string
          rating: Database["public"]["Enums"]["rating_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mic_unique_identifier: string
          rating: Database["public"]["Enums"]["rating_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mic_unique_identifier?: string
          rating?: Database["public"]["Enums"]["rating_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_visits: {
        Row: {
          id: number
          user_id: string | null
          visit_date: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          visit_date?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notes: {
        Row: {
          id: string
          user_id: string
          content: string
          title: string | null
          created_at: string
          updated_at: string
          is_draft: boolean
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          title?: string | null
          created_at?: string
          updated_at?: string
          is_draft?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          title?: string | null
          created_at?: string
          updated_at?: string
          is_draft?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: number
          instagram_handle: string | null
          monthly_spend: number | null
          name: string
          open_mics_per_month: number | null
          phone: string | null
          years_in_comedy: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          instagram_handle?: string | null
          monthly_spend?: number | null
          name: string
          open_mics_per_month?: number | null
          phone?: string | null
          years_in_comedy?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          instagram_handle?: string | null
          monthly_spend?: number | null
          name?: string
          open_mics_per_month?: number | null
          phone?: string | null
          years_in_comedy?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mic_like_counts: {
        Row: {
          dislikes: number | null
          likes: number | null
          mic_unique_identifier: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      rating_type: "like" | "dislike"
      relation_type: "liked" | "upcoming" | "past"
      schedule_type: "upcoming" | "completed" | "cancelled"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      rating_type: ["like", "dislike"],
      relation_type: ["liked", "upcoming", "past"],
      schedule_type: ["upcoming", "completed", "cancelled"],
    },
  },
} as const
