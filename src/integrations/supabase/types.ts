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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_usage_log: {
        Row: {
          actor_user_id: string | null
          amount: number | null
          credit_type: Database["public"]["Enums"]["credit_usage_type"]
          id: string
          metadata: Json
          notes: string | null
          related_id: string | null
          related_table: string | null
          run_url: string | null
          scan_session_id: string | null
          spent_at: string
        }
        Insert: {
          actor_user_id?: string | null
          amount?: number | null
          credit_type: Database["public"]["Enums"]["credit_usage_type"]
          id?: string
          metadata?: Json
          notes?: string | null
          related_id?: string | null
          related_table?: string | null
          run_url?: string | null
          scan_session_id?: string | null
          spent_at?: string
        }
        Update: {
          actor_user_id?: string | null
          amount?: number | null
          credit_type?: Database["public"]["Enums"]["credit_usage_type"]
          id?: string
          metadata?: Json
          notes?: string | null
          related_id?: string | null
          related_table?: string | null
          run_url?: string | null
          scan_session_id?: string | null
          spent_at?: string
        }
        Relationships: []
      }
      digest_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      listing_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          listing_id: string
          reason: string
          reason_category: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          listing_id: string
          reason: string
          reason_category?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string
          reason_category?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          category: string
          contact_email: string
          created_at: string
          description: string
          duplicate_fingerprint: string | null
          expired_at: string | null
          expiry_date: string | null
          featured_order: number | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          last_quality_checked_at: string | null
          link: string
          location: string
          organisation: string
          quality_score: number
          source: string
          title: string
          user_id: string
          view_count: number
        }
        Insert: {
          category: string
          contact_email: string
          created_at?: string
          description: string
          duplicate_fingerprint?: string | null
          expired_at?: string | null
          expiry_date?: string | null
          featured_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          last_quality_checked_at?: string | null
          link: string
          location: string
          organisation: string
          quality_score?: number
          source?: string
          title: string
          user_id: string
          view_count?: number
        }
        Update: {
          category?: string
          contact_email?: string
          created_at?: string
          description?: string
          duplicate_fingerprint?: string | null
          expired_at?: string | null
          expiry_date?: string | null
          featured_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          last_quality_checked_at?: string | null
          link?: string
          location?: string
          organisation?: string
          quality_score?: number
          source?: string
          title?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_suspended: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_suspended?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_suspended?: boolean
          user_id?: string
        }
        Relationships: []
      }
      rejected_sources: {
        Row: {
          domain: string
          id: string
          reason: string
          rejected_at: string
          url: string
        }
        Insert: {
          domain: string
          id?: string
          reason: string
          rejected_at?: string
          url: string
        }
        Update: {
          domain?: string
          id?: string
          reason?: string
          rejected_at?: string
          url?: string
        }
        Relationships: []
      }
      scan_log: {
        Row: {
          error_message: string | null
          id: string
          images_from_unsplash: number | null
          images_pending: number | null
          images_resolved: number | null
          listings_created: number
          listings_found: number
          listings_skipped: number
          scan_session_id: string | null
          scanned_at: string
          source_url: string
          status: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          images_from_unsplash?: number | null
          images_pending?: number | null
          images_resolved?: number | null
          listings_created?: number
          listings_found?: number
          listings_skipped?: number
          scan_session_id?: string | null
          scanned_at?: string
          source_url: string
          status?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          images_from_unsplash?: number | null
          images_pending?: number | null
          images_resolved?: number | null
          listings_created?: number
          listings_found?: number
          listings_skipped?: number
          scan_session_id?: string | null
          scanned_at?: string
          source_url?: string
          status?: string
        }
        Relationships: []
      }
      scan_sources: {
        Row: {
          category: string
          consecutive_failures: number
          created_at: string
          discovered_at: string | null
          discovered_by_ai: boolean
          failed_scans: number
          id: string
          is_active: boolean
          last_scan_at: string | null
          last_scan_error: string | null
          last_scan_status: string | null
          last_success_at: string | null
          name: string
          quality_score: number
          successful_scans: number
          total_listings_created: number
          total_listings_found: number
          total_listings_skipped: number
          total_scans: number
          url: string
        }
        Insert: {
          category: string
          consecutive_failures?: number
          created_at?: string
          discovered_at?: string | null
          discovered_by_ai?: boolean
          failed_scans?: number
          id?: string
          is_active?: boolean
          last_scan_at?: string | null
          last_scan_error?: string | null
          last_scan_status?: string | null
          last_success_at?: string | null
          name: string
          quality_score?: number
          successful_scans?: number
          total_listings_created?: number
          total_listings_found?: number
          total_listings_skipped?: number
          total_scans?: number
          url: string
        }
        Update: {
          category?: string
          consecutive_failures?: number
          created_at?: string
          discovered_at?: string | null
          discovered_by_ai?: boolean
          failed_scans?: number
          id?: string
          is_active?: boolean
          last_scan_at?: string | null
          last_scan_error?: string | null
          last_scan_status?: string | null
          last_success_at?: string | null
          name?: string
          quality_score?: number
          successful_scans?: number
          total_listings_created?: number
          total_listings_found?: number
          total_listings_skipped?: number
          total_scans?: number
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_listing_quality: {
        Row: {
          category: string | null
          duplicate_count: number | null
          duplicate_fingerprint: string | null
          expiry_date: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          last_quality_checked_at: string | null
          organisation: string | null
          quality_label: string | null
          quality_score: number | null
          source: string | null
          title: string | null
        }
        Relationships: []
      }
      admin_scan_source_health: {
        Row: {
          category: string | null
          consecutive_failures: number | null
          failed_scans: number | null
          health_label: string | null
          id: string | null
          is_active: boolean | null
          last_scan_at: string | null
          last_scan_error: string | null
          last_scan_status: string | null
          last_success_at: string | null
          name: string | null
          quality_score: number | null
          successful_scans: number | null
          total_listings_created: number | null
          total_listings_found: number | null
          total_listings_skipped: number | null
          total_scans: number | null
          url: string | null
        }
        Insert: {
          category?: string | null
          consecutive_failures?: number | null
          failed_scans?: number | null
          health_label?: never
          id?: string | null
          is_active?: boolean | null
          last_scan_at?: string | null
          last_scan_error?: string | null
          last_scan_status?: string | null
          last_success_at?: string | null
          name?: string | null
          quality_score?: number | null
          successful_scans?: number | null
          total_listings_created?: number | null
          total_listings_found?: number | null
          total_listings_skipped?: number | null
          total_scans?: number | null
          url?: string | null
        }
        Update: {
          category?: string | null
          consecutive_failures?: number | null
          failed_scans?: number | null
          health_label?: never
          id?: string | null
          is_active?: boolean | null
          last_scan_at?: string | null
          last_scan_error?: string | null
          last_scan_status?: string | null
          last_success_at?: string | null
          name?: string | null
          quality_score?: number | null
          successful_scans?: number | null
          total_listings_created?: number | null
          total_listings_found?: number | null
          total_listings_skipped?: number | null
          total_scans?: number | null
          url?: string | null
        }
        Relationships: []
      }
      listings_public: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          location: string | null
          organisation: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          location?: string | null
          organisation?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          location?: string | null
          organisation?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_listing_quality_score: {
        Args: {
          _category: string
          _description: string
          _expiry_date: string
          _image_url: string
          _link: string
          _location: string
          _organisation: string
          _title: string
        }
        Returns: number
      }
      deactivate_expired_listings: { Args: never; Returns: number }
      increment_listing_views: {
        Args: { listing_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
          raw_user_meta_data: Json
        }[]
      }
      listing_duplicate_fingerprint: {
        Args: { _link: string; _organisation: string; _title: string }
        Returns: string
      }
    }
    Enums: {
      credit_usage_type:
        | "chat_message"
        | "build_action"
        | "scanner_run"
        | "cloud_ai"
        | "cloud_runtime"
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
      credit_usage_type: [
        "chat_message",
        "build_action",
        "scanner_run",
        "cloud_ai",
        "cloud_runtime",
      ],
    },
  },
} as const
