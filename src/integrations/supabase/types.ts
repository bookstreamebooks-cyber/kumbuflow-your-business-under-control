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
      audit_logs: {
        Row: {
          actor_id: string | null
          business_id: string | null
          created_at: string
          details: Json
          event: string
          id: string
          record_id: string | null
        }
        Insert: {
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          details?: Json
          event: string
          id?: string
          record_id?: string | null
        }
        Update: {
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          details?: Json
          event?: string
          id?: string
          record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          phone: string | null
          sector: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          sector?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          sector?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          business_id: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string
          id?: string
          name: string
          phone?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string
          category: string
          created_at: string
          expense_date: string
          id: string
          notes: string
          receipt_path: string | null
        }
        Insert: {
          amount: number
          business_id: string
          category: string
          created_at?: string
          expense_date?: string
          id?: string
          notes?: string
          receipt_path?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          created_at?: string
          expense_date?: string
          id?: string
          notes?: string
          receipt_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          business_id: string
          created_at: string
          id: string
          kind: string
          notes: string
          product_id: string
          quantity: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          kind: string
          notes?: string
          product_id: string
          quantity: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          kind?: string
          notes?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_business_id_fkey"
            columns: ["product_id", "business_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      notifications: {
        Row: {
          business_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          business_id: string
          created_at: string
          id: string
          plan_id: string
          receipt_path: string | null
          reference: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          plan_id: string
          receipt_path?: string | null
          reference: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          plan_id?: string
          receipt_path?: string | null
          reference?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          account_holder: string
          bank_name: string
          iban: string
          id: boolean
          updated_at: string
        }
        Insert: {
          account_holder?: string
          bank_name?: string
          iban?: string
          id?: boolean
          updated_at?: string
        }
        Update: {
          account_holder?: string
          bank_name?: string
          iban?: string
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          id: string
          method: string
          receivable_id: string
          request_id: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          id?: string
          method?: string
          receivable_id: string
          request_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          id?: string
          method?: string
          receivable_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_receivable_id_business_id_fkey"
            columns: ["receivable_id", "business_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      plans: {
        Row: {
          duration_days: number
          enabled: boolean
          id: string
          name: string
          price: number
        }
        Insert: {
          duration_days: number
          enabled?: boolean
          id: string
          name: string
          price: number
        }
        Update: {
          duration_days?: number
          enabled?: boolean
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          business_id: string
          category: string
          cost: number
          created_at: string
          id: string
          min_stock: number
          name: string
          price: number
          sku: string
          stock: number
        }
        Insert: {
          active?: boolean
          business_id: string
          category?: string
          cost?: number
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          price: number
          sku?: string
          stock?: number
        }
        Update: {
          active?: boolean
          business_id?: string
          category?: string
          cost?: number
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          price?: number
          sku?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          business_id: string
          created_at: string
          id: string
          paid: number
          product_id: string
          quantity: number
          request_id: string
          supplier_id: string
          unit_cost: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          paid: number
          product_id: string
          quantity: number
          request_id: string
          supplier_id: string
          unit_cost: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          paid?: number
          product_id?: string
          quantity?: number
          request_id?: string
          supplier_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_id_business_id_fkey"
            columns: ["product_id", "business_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_business_id_fkey"
            columns: ["supplier_id", "business_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      receivables: {
        Row: {
          amount: number
          business_id: string
          cancelled: boolean
          created_at: string
          customer_id: string
          due_date: string
          id: string
          paid: number
          sale_id: string
        }
        Insert: {
          amount: number
          business_id: string
          cancelled?: boolean
          created_at?: string
          customer_id: string
          due_date: string
          id?: string
          paid?: number
          sale_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          cancelled?: boolean
          created_at?: string
          customer_id?: string
          due_date?: string
          id?: string
          paid?: number
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_customer_id_business_id_fkey"
            columns: ["customer_id", "business_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "receivables_sale_id_business_id_fkey"
            columns: ["sale_id", "business_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      sale_items: {
        Row: {
          business_id: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          unit_cost: number
          unit_price: number
        }
        Insert: {
          business_id: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          unit_cost: number
          unit_price: number
        }
        Update: {
          business_id?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_business_id_fkey"
            columns: ["product_id", "business_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_business_id_fkey"
            columns: ["sale_id", "business_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          paid: number
          payment_method: string
          request_id: string
          reversal_reason: string | null
          status: string
          total: number
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          paid: number
          payment_method: string
          request_id: string
          reversal_reason?: string | null
          status?: string
          total: number
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          paid?: number
          payment_method?: string
          request_id?: string
          reversal_reason?: string | null
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_business_id_fkey"
            columns: ["customer_id", "business_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          expires_at: string
          id: string
          is_trial: boolean
          plan_id: string | null
          starts_at: string
        }
        Insert: {
          business_id: string
          expires_at: string
          id?: string
          is_trial?: boolean
          plan_id?: string | null
          starts_at?: string
        }
        Update: {
          business_id?: string
          expires_at?: string
          id?: string
          is_trial?: boolean
          plan_id?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          business_id: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string
          id?: string
          name: string
          phone?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      business_active: { Args: { b: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      onboard_business: {
        Args: { p_name: string; p_phone: string; p_sector: string }
        Returns: string
      }
      owns_business: { Args: { b: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
