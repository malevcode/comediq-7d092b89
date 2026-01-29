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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audience_shows: {
        Row: {
          age_restriction: string | null
          allows_rsvp: boolean | null
          borough: string | null
          created_at: string
          description: string | null
          doors_time: string | null
          external_ticket_url: string | null
          host_name: string | null
          id: string
          image_url: string | null
          instagram_handle: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_recurring: boolean | null
          lineup: string | null
          parent_show_id: string | null
          recurrence_day: string | null
          recurrence_pattern: string | null
          show_date: string
          show_time: string
          show_type: string | null
          submitted_by: string | null
          ticket_price: string | null
          ticket_url: string | null
          title: string
          updated_at: string
          venue_address: string | null
          venue_name: string
          verified: boolean | null
        }
        Insert: {
          age_restriction?: string | null
          allows_rsvp?: boolean | null
          borough?: string | null
          created_at?: string
          description?: string | null
          doors_time?: string | null
          external_ticket_url?: string | null
          host_name?: string | null
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          lineup?: string | null
          parent_show_id?: string | null
          recurrence_day?: string | null
          recurrence_pattern?: string | null
          show_date: string
          show_time: string
          show_type?: string | null
          submitted_by?: string | null
          ticket_price?: string | null
          ticket_url?: string | null
          title: string
          updated_at?: string
          venue_address?: string | null
          venue_name: string
          verified?: boolean | null
        }
        Update: {
          age_restriction?: string | null
          allows_rsvp?: boolean | null
          borough?: string | null
          created_at?: string
          description?: string | null
          doors_time?: string | null
          external_ticket_url?: string | null
          host_name?: string | null
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          lineup?: string | null
          parent_show_id?: string | null
          recurrence_day?: string | null
          recurrence_pattern?: string | null
          show_date?: string
          show_time?: string
          show_type?: string | null
          submitted_by?: string | null
          ticket_price?: string | null
          ticket_url?: string | null
          title?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "audience_shows_parent_show_id_fkey"
            columns: ["parent_show_id"]
            isOneToOne: false
            referencedRelation: "audience_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      comedian_social_links: {
        Row: {
          created_at: string | null
          handle: string
          id: string
          is_primary: boolean | null
          platform: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          handle: string
          id?: string
          is_primary?: boolean | null
          platform: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          handle?: string
          id?: string
          is_primary?: boolean | null
          platform?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comedian_social_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gcal_clicks: {
        Row: {
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gcal_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          applied_at: string | null
          id: string
          message: string | null
          producer_notes: string | null
          responded_at: string | null
          role_id: string
          status: Database["public"]["Enums"]["application_status"] | null
        }
        Insert: {
          applicant_id: string
          applied_at?: string | null
          id?: string
          message?: string | null
          producer_notes?: string | null
          responded_at?: string | null
          role_id: string
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Update: {
          applicant_id?: string
          applied_at?: string | null
          id?: string
          message?: string | null
          producer_notes?: string | null
          responded_at?: string | null
          role_id?: string
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_applications_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_messages: {
        Row: {
          application_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      mic_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          mic_unique_identifier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          mic_unique_identifier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          mic_unique_identifier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mic_hosts: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          mic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          mic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          mic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mic_hosts_mic_id_fkey"
            columns: ["mic_id"]
            isOneToOne: false
            referencedRelation: "open_mics_display"
            referencedColumns: ["unique_identifier"]
          },
          {
            foreignKeyName: "mic_hosts_mic_id_fkey"
            columns: ["mic_id"]
            isOneToOne: false
            referencedRelation: "open_mics_historical"
            referencedColumns: ["unique_identifier"]
          },
          {
            foreignKeyName: "mic_hosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mic_playlist_items: {
        Row: {
          added_at: string
          id: string
          mic_unique_identifier: string
          notes: string | null
          order_index: number
          playlist_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          mic_unique_identifier: string
          notes?: string | null
          order_index?: number
          playlist_id: string
        }
        Update: {
          added_at?: string
          id?: string
          mic_unique_identifier?: string
          notes?: string | null
          order_index?: number
          playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mic_playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "mic_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      mic_playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mic_signup_events: {
        Row: {
          created_at: string
          event_date: string
          event_time: string | null
          host_id: string
          id: string
          is_active: boolean
          mic_id: string
          notes: string | null
          signup_closes_at: string | null
          signup_mode: Database["public"]["Enums"]["signup_mode"]
          signup_opens_at: string | null
          spots_remaining: number
          total_spots: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_time?: string | null
          host_id: string
          id?: string
          is_active?: boolean
          mic_id: string
          notes?: string | null
          signup_closes_at?: string | null
          signup_mode?: Database["public"]["Enums"]["signup_mode"]
          signup_opens_at?: string | null
          spots_remaining?: number
          total_spots?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_time?: string | null
          host_id?: string
          id?: string
          is_active?: boolean
          mic_id?: string
          notes?: string | null
          signup_closes_at?: string | null
          signup_mode?: Database["public"]["Enums"]["signup_mode"]
          signup_opens_at?: string | null
          spots_remaining?: number
          total_spots?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mic_signup_events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "mic_hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mic_signup_events_mic_id_fkey"
            columns: ["mic_id"]
            isOneToOne: false
            referencedRelation: "open_mics_display"
            referencedColumns: ["unique_identifier"]
          },
          {
            foreignKeyName: "mic_signup_events_mic_id_fkey"
            columns: ["mic_id"]
            isOneToOne: false
            referencedRelation: "open_mics_historical"
            referencedColumns: ["unique_identifier"]
          },
        ]
      }
      mic_signups: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notes: string | null
          signup_order: number | null
          status: Database["public"]["Enums"]["signup_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          signup_order?: number | null
          status?: Database["public"]["Enums"]["signup_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          signup_order?: number | null
          status?: Database["public"]["Enums"]["signup_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mic_signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mic_signup_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mic_signups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mic_verifications: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          mic_unique_identifier: string
          status: string | null
          user_id: string | null
          verified_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          mic_unique_identifier: string
          status?: string | null
          user_id?: string | null
          verified_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          mic_unique_identifier?: string
          status?: string | null
          user_id?: string | null
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mic_verifications_mic"
            columns: ["mic_unique_identifier"]
            isOneToOne: false
            referencedRelation: "open_mics_display"
            referencedColumns: ["unique_identifier"]
          },
          {
            foreignKeyName: "fk_mic_verifications_mic"
            columns: ["mic_unique_identifier"]
            isOneToOne: false
            referencedRelation: "open_mics_historical"
            referencedColumns: ["unique_identifier"]
          },
        ]
      }
      open_mics_historical: {
        Row: {
          active: boolean | null
          borough: string | null
          changes_updates: string | null
          city: string | null
          cost: string | null
          day: string | null
          hosts_organizers: string | null
          last_verified: string | null
          latest_end_time: string | null
          location: string | null
          neighborhood: string | null
          open_mic: string
          other_rules: string | null
          sign_up_instructions: string | null
          signup_enabled: boolean
          sms_response: string | null
          stage_time: string | null
          start_time: string | null
          unique_identifier: string
          venue_name: string | null
          venue_type: string | null
        }
        Insert: {
          active?: boolean | null
          borough?: string | null
          changes_updates?: string | null
          city?: string | null
          cost?: string | null
          day?: string | null
          hosts_organizers?: string | null
          last_verified?: string | null
          latest_end_time?: string | null
          location?: string | null
          neighborhood?: string | null
          open_mic: string
          other_rules?: string | null
          sign_up_instructions?: string | null
          signup_enabled?: boolean
          sms_response?: string | null
          stage_time?: string | null
          start_time?: string | null
          unique_identifier?: string
          venue_name?: string | null
          venue_type?: string | null
        }
        Update: {
          active?: boolean | null
          borough?: string | null
          changes_updates?: string | null
          city?: string | null
          cost?: string | null
          day?: string | null
          hosts_organizers?: string | null
          last_verified?: string | null
          latest_end_time?: string | null
          location?: string | null
          neighborhood?: string | null
          open_mic?: string
          other_rules?: string | null
          sign_up_instructions?: string | null
          signup_enabled?: boolean
          sms_response?: string | null
          stage_time?: string | null
          start_time?: string | null
          unique_identifier?: string
          venue_name?: string | null
          venue_type?: string | null
        }
        Relationships: []
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
          stage_time_minutes: number | null
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
          stage_time_minutes?: number | null
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
          stage_time_minutes?: number | null
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
          custom_stage_time: number | null
          id: string
          last_modified: string | null
          notes: string | null
          open_mic_id: string | null
          profile_id: string | null
          schedule_type: Database["public"]["Enums"]["schedule_type"] | null
        }
        Insert: {
          created_at?: string
          custom_stage_time?: number | null
          id?: string
          last_modified?: string | null
          notes?: string | null
          open_mic_id?: string | null
          profile_id?: string | null
          schedule_type?: Database["public"]["Enums"]["schedule_type"] | null
        }
        Update: {
          created_at?: string
          custom_stage_time?: number | null
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
            referencedRelation: "open_mics_display"
            referencedColumns: ["unique_identifier"]
          },
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
          bio: string | null
          created_at: string
          credit: string | null
          headshot_url: string | null
          id: string
          isadmin: boolean
          phone: string | null
          stage_name: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          years_performing: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          credit?: string | null
          headshot_url?: string | null
          id?: string
          isadmin?: boolean
          phone?: string | null
          stage_name?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          years_performing?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          credit?: string | null
          headshot_url?: string | null
          id?: string
          isadmin?: boolean
          phone?: string | null
          stage_name?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          years_performing?: number | null
        }
        Relationships: []
      }
      role_openings: {
        Row: {
          compensation_amount: number | null
          compensation_details: string | null
          compensation_type: Database["public"]["Enums"]["compensation_type"]
          created_at: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id: string
          is_custom_role: boolean | null
          posting_id: string
          requirements: string | null
          role_category: Database["public"]["Enums"]["role_category"]
          role_type: string
          spots_available: number | null
          spots_filled: number | null
          stage_time_minutes: number | null
          status: Database["public"]["Enums"]["posting_status"] | null
        }
        Insert: {
          compensation_amount?: number | null
          compensation_details?: string | null
          compensation_type: Database["public"]["Enums"]["compensation_type"]
          created_at?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          is_custom_role?: boolean | null
          posting_id: string
          requirements?: string | null
          role_category: Database["public"]["Enums"]["role_category"]
          role_type: string
          spots_available?: number | null
          spots_filled?: number | null
          stage_time_minutes?: number | null
          status?: Database["public"]["Enums"]["posting_status"] | null
        }
        Update: {
          compensation_amount?: number | null
          compensation_details?: string | null
          compensation_type?: Database["public"]["Enums"]["compensation_type"]
          created_at?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          is_custom_role?: boolean | null
          posting_id?: string
          requirements?: string | null
          role_category?: Database["public"]["Enums"]["role_category"]
          role_type?: string
          spots_available?: number | null
          spots_filled?: number | null
          stage_time_minutes?: number | null
          status?: Database["public"]["Enums"]["posting_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "role_openings_posting_id_fkey"
            columns: ["posting_id"]
            isOneToOne: false
            referencedRelation: "show_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_mics: {
        Row: {
          created_at: string
          id: string
          mic_unique_identifier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mic_unique_identifier: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mic_unique_identifier?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_shows: {
        Row: {
          created_at: string | null
          id: string
          posting_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          posting_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          posting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_shows_posting_id_fkey"
            columns: ["posting_id"]
            isOneToOne: false
            referencedRelation: "show_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      show_postings: {
        Row: {
          application_deadline: string | null
          boost_expires_at: string | null
          borough: string | null
          call_time: string | null
          created_at: string | null
          description: string | null
          expected_audience: number | null
          id: string
          is_boosted: boolean | null
          is_featured: boolean | null
          producer_id: string
          show_date: string
          show_time: string | null
          show_type: string | null
          status: Database["public"]["Enums"]["posting_status"] | null
          title: string
          updated_at: string | null
          venue_address: string | null
          venue_name: string
        }
        Insert: {
          application_deadline?: string | null
          boost_expires_at?: string | null
          borough?: string | null
          call_time?: string | null
          created_at?: string | null
          description?: string | null
          expected_audience?: number | null
          id?: string
          is_boosted?: boolean | null
          is_featured?: boolean | null
          producer_id: string
          show_date: string
          show_time?: string | null
          show_type?: string | null
          status?: Database["public"]["Enums"]["posting_status"] | null
          title: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name: string
        }
        Update: {
          application_deadline?: string | null
          boost_expires_at?: string | null
          borough?: string | null
          call_time?: string | null
          created_at?: string | null
          description?: string | null
          expected_audience?: number | null
          id?: string
          is_boosted?: boolean | null
          is_featured?: boolean | null
          producer_id?: string
          show_date?: string
          show_time?: string | null
          show_type?: string | null
          status?: Database["public"]["Enums"]["posting_status"] | null
          title?: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_postings_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      show_reviews: {
        Row: {
          attended_date: string
          created_at: string
          favorite_comedian: string | null
          id: string
          rating: number
          review_text: string | null
          show_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attended_date: string
          created_at?: string
          favorite_comedian?: string | null
          id?: string
          rating: number
          review_text?: string | null
          show_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attended_date?: string
          created_at?: string
          favorite_comedian?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          show_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_reviews_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "audience_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      show_rsvps: {
        Row: {
          created_at: string
          id: string
          party_size: number
          show_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          party_size?: number
          show_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          party_size?: number
          show_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_rsvps_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "audience_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_purchases: {
        Row: {
          created_at: string
          email: string | null
          id: string
          quantity: number
          show_id: string
          status: string
          stripe_checkout_id: string | null
          stripe_payment_id: string | null
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          quantity?: number
          show_id: string
          status?: string
          stripe_checkout_id?: string | null
          stripe_payment_id?: string | null
          total_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          quantity?: number
          show_id?: string
          status?: string
          stripe_checkout_id?: string | null
          stripe_payment_id?: string | null
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_purchases_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "audience_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      user_admin: {
        Row: {
          is_admin: boolean | null
          phone: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          is_admin?: boolean | null
          phone?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          is_admin?: boolean | null
          phone?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_admin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_job_roles: {
        Row: {
          company_name: string | null
          created_at: string | null
          id: string
          is_verified_producer: boolean | null
          producer_bio: string | null
          role: Database["public"]["Enums"]["job_board_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          id?: string
          is_verified_producer?: boolean | null
          producer_bio?: string | null
          role?: Database["public"]["Enums"]["job_board_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          id?: string
          is_verified_producer?: boolean | null
          producer_bio?: string | null
          role?: Database["public"]["Enums"]["job_board_role"]
          updated_at?: string | null
          user_id?: string
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
      user_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_draft: boolean | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_draft?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_draft?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      work_history: {
        Row: {
          application_id: string | null
          borough: string | null
          compensation_amount: number | null
          compensation_type:
            | Database["public"]["Enums"]["compensation_type"]
            | null
          completed_at: string | null
          confirmed_by_producer: boolean | null
          created_at: string | null
          id: string
          posting_id: string | null
          producer_id: string | null
          producer_notes: string | null
          producer_rating: number | null
          role_category: Database["public"]["Enums"]["role_category"]
          role_id: string | null
          role_type: string
          show_date: string
          show_title: string
          show_type: string | null
          stage_time_minutes: number | null
          user_id: string
          venue_address: string | null
          venue_name: string
        }
        Insert: {
          application_id?: string | null
          borough?: string | null
          compensation_amount?: number | null
          compensation_type?:
            | Database["public"]["Enums"]["compensation_type"]
            | null
          completed_at?: string | null
          confirmed_by_producer?: boolean | null
          created_at?: string | null
          id?: string
          posting_id?: string | null
          producer_id?: string | null
          producer_notes?: string | null
          producer_rating?: number | null
          role_category: Database["public"]["Enums"]["role_category"]
          role_id?: string | null
          role_type: string
          show_date: string
          show_title: string
          show_type?: string | null
          stage_time_minutes?: number | null
          user_id: string
          venue_address?: string | null
          venue_name: string
        }
        Update: {
          application_id?: string | null
          borough?: string | null
          compensation_amount?: number | null
          compensation_type?:
            | Database["public"]["Enums"]["compensation_type"]
            | null
          completed_at?: string | null
          confirmed_by_producer?: boolean | null
          created_at?: string | null
          id?: string
          posting_id?: string | null
          producer_id?: string | null
          producer_notes?: string | null
          producer_rating?: number | null
          role_category?: Database["public"]["Enums"]["role_category"]
          role_id?: string | null
          role_type?: string
          show_date?: string
          show_title?: string
          show_type?: string | null
          stage_time_minutes?: number | null
          user_id?: string
          venue_address?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_history_posting_id_fkey"
            columns: ["posting_id"]
            isOneToOne: false
            referencedRelation: "show_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_history_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role_openings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mic_comment_counts: {
        Row: {
          comment_count: number | null
          mic_unique_identifier: string | null
        }
        Relationships: []
      }
      mic_latest_verification: {
        Row: {
          mic_unique_identifier: string | null
          user_id: string | null
          verified_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mic_verifications_mic"
            columns: ["mic_unique_identifier"]
            isOneToOne: false
            referencedRelation: "open_mics_display"
            referencedColumns: ["unique_identifier"]
          },
          {
            foreignKeyName: "fk_mic_verifications_mic"
            columns: ["mic_unique_identifier"]
            isOneToOne: false
            referencedRelation: "open_mics_historical"
            referencedColumns: ["unique_identifier"]
          },
        ]
      }
      mic_like_counts: {
        Row: {
          dislikes: number | null
          likes: number | null
          mic_unique_identifier: string | null
        }
        Relationships: []
      }
      mic_saved_counts: {
        Row: {
          mic_unique_identifier: string | null
          saved_count: number | null
        }
        Relationships: []
      }
      open_mics_display: {
        Row: {
          active: boolean | null
          borough: string | null
          changes_updates: string | null
          city: string | null
          cost: string | null
          day: string | null
          end_time_display: string | null
          hosts_organizers: string | null
          last_verified: string | null
          last_verified_display: string | null
          latest_end_time: string | null
          location: string | null
          neighborhood: string | null
          open_mic: string | null
          other_rules: string | null
          sign_up_instructions: string | null
          signup_enabled: boolean | null
          sms_response: string | null
          stage_time: string | null
          start_time: string | null
          start_time_display: string | null
          unique_identifier: string | null
          venue_name: string | null
          venue_type: string | null
        }
        Insert: {
          active?: boolean | null
          borough?: string | null
          changes_updates?: string | null
          city?: string | null
          cost?: string | null
          day?: string | null
          end_time_display?: never
          hosts_organizers?: string | null
          last_verified?: string | null
          last_verified_display?: never
          latest_end_time?: string | null
          location?: string | null
          neighborhood?: string | null
          open_mic?: string | null
          other_rules?: string | null
          sign_up_instructions?: string | null
          signup_enabled?: boolean | null
          sms_response?: string | null
          stage_time?: string | null
          start_time?: string | null
          start_time_display?: never
          unique_identifier?: string | null
          venue_name?: string | null
          venue_type?: string | null
        }
        Update: {
          active?: boolean | null
          borough?: string | null
          changes_updates?: string | null
          city?: string | null
          cost?: string | null
          day?: string | null
          end_time_display?: never
          hosts_organizers?: string | null
          last_verified?: string | null
          last_verified_display?: never
          latest_end_time?: string | null
          location?: string | null
          neighborhood?: string | null
          open_mic?: string | null
          other_rules?: string | null
          sign_up_instructions?: string | null
          signup_enabled?: boolean | null
          sms_response?: string | null
          stage_time?: string | null
          start_time?: string | null
          start_time_display?: never
          unique_identifier?: string | null
          venue_name?: string | null
          venue_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_or_create_system_host: {
        Args: { mic_id_param: string }
        Returns: string
      }
      is_producer: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      application_status:
        | "pending"
        | "accepted"
        | "declined"
        | "withdrawn"
        | "waitlisted"
        | "completed"
        | "no_show"
      compensation_type:
        | "paid"
        | "unpaid"
        | "door_split"
        | "bringer"
        | "stage_time"
        | "tip_jar"
        | "negotiable"
      experience_level: "beginner" | "intermediate" | "experienced" | "pro"
      job_board_role: "producer" | "talent" | "both"
      posting_status: "open" | "filled" | "cancelled" | "draft"
      rating_type: "like" | "dislike"
      relation_type: "liked" | "upcoming" | "past"
      role_category: "performer" | "crew"
      schedule_type: "upcoming" | "completed" | "cancelled"
      signup_mode: "first_come" | "lottery" | "bucket"
      signup_status: "confirmed" | "waitlist" | "lottery_pending" | "cancelled"
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
      application_status: [
        "pending",
        "accepted",
        "declined",
        "withdrawn",
        "waitlisted",
        "completed",
        "no_show",
      ],
      compensation_type: [
        "paid",
        "unpaid",
        "door_split",
        "bringer",
        "stage_time",
        "tip_jar",
        "negotiable",
      ],
      experience_level: ["beginner", "intermediate", "experienced", "pro"],
      job_board_role: ["producer", "talent", "both"],
      posting_status: ["open", "filled", "cancelled", "draft"],
      rating_type: ["like", "dislike"],
      relation_type: ["liked", "upcoming", "past"],
      role_category: ["performer", "crew"],
      schedule_type: ["upcoming", "completed", "cancelled"],
      signup_mode: ["first_come", "lottery", "bucket"],
      signup_status: ["confirmed", "waitlist", "lottery_pending", "cancelled"],
    },
  },
} as const
