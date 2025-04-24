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
      accounting_sync: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          error: Json | null
          error_message: string | null
          id: string
          last_synced_at: string | null
          provider: string
          provider_meta: Json | null
          provider_ref: string | null
          retries: number | null
          status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          error?: Json | null
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          provider: string
          provider_meta?: Json | null
          provider_ref?: string | null
          retries?: number | null
          status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error?: Json | null
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          provider_meta?: Json | null
          provider_ref?: string | null
          retries?: number | null
          status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          bill_number: string
          created_at: string
          due_date: string
          id: string
          project_id: string | null
          qbo_bill_id: string | null
          status: string
          vendor_email: string
          vendor_name: string
        }
        Insert: {
          amount: number
          bill_number: string
          created_at?: string
          due_date: string
          id?: string
          project_id?: string | null
          qbo_bill_id?: string | null
          status?: string
          vendor_email: string
          vendor_name: string
        }
        Update: {
          amount?: number
          bill_number?: string
          created_at?: string
          due_date?: string
          id?: string
          project_id?: string | null
          qbo_bill_id?: string | null
          status?: string
          vendor_email?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          name: string
          project_id: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          name: string
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          name?: string
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_email: string
          client_name: string
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          payment_method: string
          project_id: string | null
          qbo_invoice_id: string | null
          status: string
        }
        Insert: {
          amount: number
          client_email: string
          client_name: string
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          payment_method?: string
          project_id?: string | null
          qbo_invoice_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_email?: string
          client_name?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          payment_method?: string
          project_id?: string | null
          qbo_invoice_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          gc_account_id: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          gc_account_id?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          gc_account_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: string
          value: number
        }
        Insert: {
          client: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status: string
          value: number
        }
        Update: {
          client?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string
          value?: number
        }
        Relationships: []
      }
      qbo_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          realm_id: string
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string
          id?: string
          realm_id: string
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          realm_id?: string
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qbo_contacts_cache: {
        Row: {
          contact_type: string
          created_at: string
          data: Json | null
          external_id: string
          id: string
          qbo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_type: string
          created_at?: string
          data?: Json | null
          external_id: string
          id?: string
          qbo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_type?: string
          created_at?: string
          data?: Json | null
          external_id?: string
          id?: string
          qbo_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qbo_logs: {
        Row: {
          created_at: string
          error: string | null
          function_name: string
          id: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          function_name: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          function_name?: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          plan_name: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          plan_name?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          plan_name?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          role: string
          status: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          role: string
          status?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_subscription: {
        Args: { user_id_param: string }
        Returns: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          plan_name: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }[]
      }
      is_platform_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_sync_status: {
        Args: {
          p_entity_type: string
          p_entity_id: string
          p_provider: string
          p_status: string
          p_provider_ref?: string
          p_provider_meta?: Json
          p_error?: Json
          p_error_message?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      qbo_sync_status: "pending" | "success" | "error"
      sync_status: "pending" | "processing" | "success" | "error"
      user_role: "platform_admin" | "account_admin" | "user" | "guest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      qbo_sync_status: ["pending", "success", "error"],
      sync_status: ["pending", "processing", "success", "error"],
      user_role: ["platform_admin", "account_admin", "user", "guest"],
    },
  },
} as const
