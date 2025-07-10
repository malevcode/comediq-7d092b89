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
      open_mics: {
        Row: {
          Borough: string | null
          "Changes/updates": string | null
          Cost: string | null
          Day: string | null
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
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          phone: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          phone?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
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
      profile_open_mics: {
        Row: {
          id: string;
          profile_id: string;
          open_mic_id: string;
          schedule_type: "upcoming" | "completed" | "cancelled";
          created_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          open_mic_id: string;
          schedule_type: "upcoming" | "completed" | "cancelled";
          created_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: number;
          profile_id?: string;
          open_mic_id?: string;
          schedule_type?: "upcoming" | "completed" | "cancelled";
          created_at?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_open_mics_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "profile_open_mics_open_mic_id_fkey";
            columns: ["open_mic_id"];
            referencedRelation: "open_mics";
            referencedColumns: ["unique_identifier"];
          }
        ];
      },
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      rating_type: "like" | "dislike"
      relation_type: "liked" | "upcoming" | "past"
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
    },
  },
} as const
