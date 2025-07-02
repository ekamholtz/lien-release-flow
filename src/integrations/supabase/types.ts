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
      app_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          project_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          project_id?: string | null
          read?: boolean
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          project_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_line_items: {
        Row: {
          amount: number
          bill_id: string | null
          billable: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          invoice_line_item_id: string | null
          invoiced: boolean | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bill_id?: string | null
          billable?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_line_item_id?: string | null
          invoiced?: boolean | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string | null
          billable?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_line_item_id?: string | null
          invoiced?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_line_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_line_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_line_items_invoice_line_item_id_fkey"
            columns: ["invoice_line_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          bill_number: string
          company_id: string | null
          created_at: string
          due_date: string
          has_line_items: boolean | null
          id: string
          lien_release_status: string | null
          payment_date: string | null
          payment_provider: string | null
          payment_reference: string | null
          project_id: string | null
          project_manager_id: string | null
          qbo_bill_id: string | null
          requires_lien_release: boolean | null
          status: string
          vendor_email: string
          vendor_id: string | null
          vendor_name: string
        }
        Insert: {
          amount: number
          bill_number: string
          company_id?: string | null
          created_at?: string
          due_date: string
          has_line_items?: boolean | null
          id?: string
          lien_release_status?: string | null
          payment_date?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          project_id?: string | null
          project_manager_id?: string | null
          qbo_bill_id?: string | null
          requires_lien_release?: boolean | null
          status?: string
          vendor_email: string
          vendor_id?: string | null
          vendor_name: string
        }
        Update: {
          amount?: number
          bill_number?: string
          company_id?: string | null
          created_at?: string
          due_date?: string
          has_line_items?: boolean | null
          id?: string
          lien_release_status?: string | null
          payment_date?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          project_id?: string | null
          project_manager_id?: string | null
          qbo_bill_id?: string | null
          requires_lien_release?: boolean | null
          status?: string
          vendor_email?: string
          vendor_id?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          id: string
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          external_id: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          street_address: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          first_name: string | null
          id: string
          invited_at: string
          invited_email: string
          last_name: string | null
          role: Database["public"]["Enums"]["role_code"]
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          first_name?: string | null
          id?: string
          invited_at?: string
          invited_email: string
          last_name?: string | null
          role: Database["public"]["Enums"]["role_code"]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          first_name?: string | null
          id?: string
          invited_at?: string
          invited_email?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["role_code"]
          status?: string
          updated_at?: string
          user_id?: string | null
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
      expense_categories: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          category_id: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          invoice_id: string | null
          markup_percentage: number | null
          price: number
          pricing_method: string
          source_bill_line_item_id: string | null
          source_milestone_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          markup_percentage?: number | null
          price: number
          pricing_method?: string
          source_bill_line_item_id?: string | null
          source_milestone_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          markup_percentage?: number | null
          price?: number
          pricing_method?: string
          source_bill_line_item_id?: string | null
          source_milestone_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_source_bill_line_item_id_fkey"
            columns: ["source_bill_line_item_id"]
            isOneToOne: false
            referencedRelation: "bill_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_source_milestone_id_fkey"
            columns: ["source_milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_email: string
          client_id: string | null
          client_name: string
          company_id: string | null
          created_at: string
          due_date: string
          has_line_items: boolean | null
          id: string
          invoice_number: string
          payment_date: string | null
          payment_link: string | null
          payment_method: string
          payment_provider: string | null
          payment_reference: string | null
          project_id: string | null
          project_manager_id: string | null
          qbo_invoice_id: string | null
          source_milestone_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          client_email: string
          client_id?: string | null
          client_name: string
          company_id?: string | null
          created_at?: string
          due_date: string
          has_line_items?: boolean | null
          id?: string
          invoice_number: string
          payment_date?: string | null
          payment_link?: string | null
          payment_method?: string
          payment_provider?: string | null
          payment_reference?: string | null
          project_id?: string | null
          project_manager_id?: string | null
          qbo_invoice_id?: string | null
          source_milestone_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          client_email?: string
          client_id?: string | null
          client_name?: string
          company_id?: string | null
          created_at?: string
          due_date?: string
          has_line_items?: boolean | null
          id?: string
          invoice_number?: string
          payment_date?: string | null
          payment_link?: string | null
          payment_method?: string
          payment_provider?: string | null
          payment_reference?: string | null
          project_id?: string | null
          project_manager_id?: string | null
          qbo_invoice_id?: string | null
          source_milestone_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_source_milestone_id_fkey"
            columns: ["source_milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          milestone_id: string
          system_generated: boolean
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone_id: string
          system_generated?: boolean
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone_id?: string
          system_generated?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_logs_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_recurring: boolean
          name: string
          project_type_id: string | null
          template_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          name: string
          project_type_id?: string | null
          template_data: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          name?: string
          project_type_id?: string | null
          template_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_templates_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          amount: number
          change_order_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_type: string
          id: string
          invoice_id: string | null
          is_completed: boolean
          name: string
          percentage: number | null
          project_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          change_order_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_type?: string
          id?: string
          invoice_id?: string | null
          is_completed?: boolean
          name: string
          percentage?: number | null
          project_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          change_order_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_type?: string
          id?: string
          invoice_id?: string | null
          is_completed?: boolean
          name?: string
          percentage?: number | null
          project_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_offline: boolean | null
          metadata: Json | null
          notes: string | null
          payment_date: string | null
          payment_details: string | null
          payment_method: string
          payment_provider: string | null
          payment_type: string | null
          payor_company: string | null
          payor_name: string | null
          provider_transaction_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_offline?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_details?: string | null
          payment_method: string
          payment_provider?: string | null
          payment_type?: string | null
          payor_company?: string | null
          payor_name?: string | null
          provider_transaction_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_offline?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_details?: string | null
          payment_method?: string
          payment_provider?: string | null
          payment_type?: string | null
          payor_company?: string | null
          payor_name?: string | null
          provider_transaction_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      project_files: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          name: string
          project_id: string
          shared_with_client: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          name: string
          project_id: string
          shared_with_client?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          name?: string
          project_id?: string
          shared_with_client?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string
          client_id: string | null
          company_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          original_value: number | null
          project_manager_id: string | null
          project_type_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string
          value: number
        }
        Insert: {
          client: string
          client_id?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          original_value?: number | null
          project_manager_id?: string | null
          project_type_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
          value: number
        }
        Update: {
          client?: string
          client_id?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          original_value?: number | null
          project_manager_id?: string | null
          project_type_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "project_types"
            referencedColumns: ["id"]
          },
        ]
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
      role_permissions: {
        Row: {
          company_id: string
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["role_code"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["role_code"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["role_code"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      signed_contracts: {
        Row: {
          created_at: string | null
          document_id: string
          document_url: string | null
          id: string
          signer_email: string | null
          signer_name: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          document_url?: string | null
          id?: string
          signer_email?: string | null
          signer_name?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          document_url?: string | null
          id?: string
          signer_email?: string | null
          signer_name?: string | null
          status?: string | null
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
      vendors: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      legacy_unassigned_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          due_date: string | null
          entity_name: string | null
          id: string | null
          reference_number: string | null
          status: string | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_company_invitation: {
        Args: { p_invitation_id: string; p_user_id: string }
        Returns: boolean
      }
      can_access_project: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      create_change_order: {
        Args: {
          p_project_id: string
          p_description: string
          p_amount: number
          p_status: string
          p_created_by: string
        }
        Returns: string
      }
      create_company_with_admin: {
        Args: { p_name: string; p_user_id: string; p_email: string }
        Returns: {
          city: string | null
          created_at: string
          email: string | null
          external_id: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          street_address: string | null
          updated_at: string
        }
      }
      decline_company_invitation: {
        Args: { p_invitation_id: string }
        Returns: boolean
      }
      delete_company_member: {
        Args: { p_id: string }
        Returns: undefined
      }
      get_company_members: {
        Args: { p_company_id: string }
        Returns: {
          accepted_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          first_name: string | null
          id: string
          invited_at: string
          invited_email: string
          last_name: string | null
          role: Database["public"]["Enums"]["role_code"]
          status: string
          updated_at: string
          user_id: string | null
        }[]
      }
      get_pending_invitations_by_email: {
        Args: { p_email: string }
        Returns: {
          id: string
          company_id: string
          company_name: string
          role: Database["public"]["Enums"]["role_code"]
          invited_by: string
          invited_email: string
          status: string
        }[]
      }
      get_user_companies: {
        Args: Record<PropertyKey, never>
        Returns: {
          city: string | null
          created_at: string
          email: string | null
          external_id: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          street_address: string | null
          updated_at: string
        }[]
      }
      get_user_company_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
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
      invite_company_member: {
        Args: {
          p_company_id: string
          p_email: string
          p_first_name: string
          p_last_name: string
          p_role: string
        }
        Returns: {
          accepted_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          first_name: string | null
          id: string
          invited_at: string
          invited_email: string
          last_name: string | null
          role: Database["public"]["Enums"]["role_code"]
          status: string
          updated_at: string
          user_id: string | null
        }
      }
      is_platform_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_project_manager: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      update_company: {
        Args: { p_id: string; p_name: string; p_external_id?: string }
        Returns: {
          city: string | null
          created_at: string
          email: string | null
          external_id: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          street_address: string | null
          updated_at: string
        }
      }
      update_company_member: {
        Args: { p_id: string; p_status: string; p_role: string }
        Returns: {
          accepted_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          first_name: string | null
          id: string
          invited_at: string
          invited_email: string
          last_name: string | null
          role: Database["public"]["Enums"]["role_code"]
          status: string
          updated_at: string
          user_id: string | null
        }
      }
      update_project_status: {
        Args: { p_project_id: string; p_status: string }
        Returns: undefined
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
      user_has_permission_for_company: {
        Args: {
          p_user_id: string
          p_company_id: string
          p_permission_code: string
        }
        Returns: boolean
      }
      validate_milestone_template_percentages: {
        Args: { template_data: Json }
        Returns: boolean
      }
    }
    Enums: {
      project_status:
        | "draft"
        | "active"
        | "completed"
        | "cancelled"
        | "in_progress"
        | "closed"
      qbo_sync_status: "pending" | "success" | "error"
      role_code:
        | "company_admin"
        | "project_manager"
        | "viewer"
        | "company_owner"
        | "office_manager"
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
      project_status: [
        "draft",
        "active",
        "completed",
        "cancelled",
        "in_progress",
        "closed",
      ],
      qbo_sync_status: ["pending", "success", "error"],
      role_code: [
        "company_admin",
        "project_manager",
        "viewer",
        "company_owner",
        "office_manager",
      ],
      sync_status: ["pending", "processing", "success", "error"],
      user_role: ["platform_admin", "account_admin", "user", "guest"],
    },
  },
} as const
