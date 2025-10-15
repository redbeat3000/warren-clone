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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          contribution_date: string
          contribution_type: Database["public"]["Enums"]["contribution_type"]
          created_at: string
          created_by: string | null
          id: string
          is_dividend_eligible: boolean | null
          member_id: string
          notes: string | null
          payment_method: string | null
          receipt_no: string | null
        }
        Insert: {
          amount: number
          contribution_date?: string
          contribution_type?: Database["public"]["Enums"]["contribution_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_dividend_eligible?: boolean | null
          member_id: string
          notes?: string | null
          payment_method?: string | null
          receipt_no?: string | null
        }
        Update: {
          amount?: number
          contribution_date?: string
          contribution_type?: Database["public"]["Enums"]["contribution_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_dividend_eligible?: boolean | null
          member_id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dividend_allocations: {
        Row: {
          allocated_amount: number | null
          calculation_id: string
          calculation_notes: string | null
          created_at: string | null
          id: string
          member_contribution_for_dividends: number | null
          member_id: string
          payout_date: string | null
          payout_status: string | null
          share_percentage: number | null
          total_contributions_for_dividends: number | null
          updated_at: string | null
        }
        Insert: {
          allocated_amount?: number | null
          calculation_id: string
          calculation_notes?: string | null
          created_at?: string | null
          id?: string
          member_contribution_for_dividends?: number | null
          member_id: string
          payout_date?: string | null
          payout_status?: string | null
          share_percentage?: number | null
          total_contributions_for_dividends?: number | null
          updated_at?: string | null
        }
        Update: {
          allocated_amount?: number | null
          calculation_id?: string
          calculation_notes?: string | null
          created_at?: string | null
          id?: string
          member_contribution_for_dividends?: number | null
          member_id?: string
          payout_date?: string | null
          payout_status?: string | null
          share_percentage?: number | null
          total_contributions_for_dividends?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dividend_allocations_calculation_id_fkey"
            columns: ["calculation_id"]
            isOneToOne: false
            referencedRelation: "dividends_fund_calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividend_allocations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "dividend_allocations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dividends: {
        Row: {
          allocation_amount: number
          created_at: string
          id: string
          member_id: string | null
          payout_date: string | null
          period: string
        }
        Insert: {
          allocation_amount: number
          created_at?: string
          id?: string
          member_id?: string | null
          payout_date?: string | null
          period: string
        }
        Update: {
          allocation_amount?: number
          created_at?: string
          id?: string
          member_id?: string | null
          payout_date?: string | null
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "dividends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "dividends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dividends_fund_calculations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          calculation_date: string
          calculation_formula: string | null
          created_at: string | null
          fines_collected: number | null
          fiscal_year: number
          id: string
          investment_profits: number | null
          loan_interest: number | null
          registration_fees: number | null
          relevant_expenses: number | null
          status: string | null
          total_dividends_fund: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          calculation_date?: string
          calculation_formula?: string | null
          created_at?: string | null
          fines_collected?: number | null
          fiscal_year: number
          id?: string
          investment_profits?: number | null
          loan_interest?: number | null
          registration_fees?: number | null
          relevant_expenses?: number | null
          status?: string | null
          total_dividends_fund?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          calculation_date?: string
          calculation_formula?: string | null
          created_at?: string | null
          fines_collected?: number | null
          fiscal_year?: number
          id?: string
          investment_profits?: number | null
          loan_interest?: number | null
          registration_fees?: number | null
          relevant_expenses?: number | null
          status?: string | null
          total_dividends_fund?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dividends_fund_calculations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "dividends_fund_calculations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          affects_dividends: boolean | null
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          expense_impact: Database["public"]["Enums"]["expense_impact"] | null
          id: string
          receipt_url: string | null
        }
        Insert: {
          affects_dividends?: boolean | null
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          expense_impact?: Database["public"]["Enums"]["expense_impact"] | null
          id?: string
          receipt_url?: string | null
        }
        Update: {
          affects_dividends?: boolean | null
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          expense_impact?: Database["public"]["Enums"]["expense_impact"] | null
          id?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fines: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          fine_date: string
          id: string
          member_id: string
          paid_amount: number | null
          reason: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          fine_date?: string
          id?: string
          member_id: string
          paid_amount?: number | null
          reason?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          fine_date?: string
          id?: string
          member_id?: string
          paid_amount?: number | null
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fines_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fines_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_profits: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          profit_date: string
          source: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          profit_date?: string
          source: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          profit_date?: string
          source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_profits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "investment_profits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_repayments: {
        Row: {
          amount: number
          created_at: string
          id: string
          interest_portion: number | null
          loan_id: string
          member_id: string
          payment_date: string
          payment_method: string | null
          principal_portion: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          interest_portion?: number | null
          loan_id: string
          member_id: string
          payment_date?: string
          payment_method?: string | null
          principal_portion?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          interest_portion?: number | null
          loan_id?: string
          member_id?: string
          payment_date?: string
          payment_method?: string | null
          principal_portion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_repayments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "loan_repayments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          interest_paid: number | null
          interest_rate: number
          interest_type: string
          issue_date: string
          member_id: string
          notes: string | null
          principal: number
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_interest_calculated: number | null
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          interest_paid?: number | null
          interest_rate: number
          interest_type?: string
          issue_date?: string
          member_id: string
          notes?: string | null
          principal: number
          status?: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_interest_calculated?: number | null
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          interest_paid?: number | null
          interest_rate?: number
          interest_type?: string
          issue_date?: string
          member_id?: string
          notes?: string | null
          principal?: number
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number
          total_interest_calculated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "loans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendance: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          member_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          member_id: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          member_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meeting_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          actual_attendees: number | null
          agenda: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expected_attendees: number | null
          id: string
          meeting_date: string
          meeting_time: string
          minutes: string | null
          status: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          actual_attendees?: number | null
          agenda?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_attendees?: number | null
          id?: string
          meeting_date: string
          meeting_time: string
          minutes?: string | null
          status?: string
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          actual_attendees?: number | null
          agenda?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_attendees?: number | null
          id?: string
          meeting_date?: string
          meeting_time?: string
          minutes?: string | null
          status?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      member_fund_balances: {
        Row: {
          closing_balance: number | null
          created_at: string | null
          fiscal_year: number
          fund_type: Database["public"]["Enums"]["contribution_type"]
          id: string
          member_id: string
          opening_balance: number | null
          updated_at: string | null
        }
        Insert: {
          closing_balance?: number | null
          created_at?: string | null
          fiscal_year: number
          fund_type: Database["public"]["Enums"]["contribution_type"]
          id?: string
          member_id: string
          opening_balance?: number | null
          updated_at?: string | null
        }
        Update: {
          closing_balance?: number | null
          created_at?: string | null
          fiscal_year?: number
          fund_type?: Database["public"]["Enums"]["contribution_type"]
          id?: string
          member_id?: string
          opening_balance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_fund_balances_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "member_fund_balances_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: Database["public"]["Enums"]["message_channel"]
          created_at: string
          id: string
          member_id: string | null
          message_content: string | null
          provider_response: Json | null
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
        }
        Insert: {
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          id?: string
          member_id?: string | null
          message_content?: string | null
          provider_response?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          id?: string
          member_id?: string | null
          message_content?: string | null
          provider_response?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "messages_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_uid: string | null
          created_at: string
          email: string | null
          first_name: string
          full_name: string | null
          id: string
          join_date: string
          last_name: string
          member_no: string | null
          national_id: string | null
          phone: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          auth_uid?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          full_name?: string | null
          id?: string
          join_date?: string
          last_name: string
          member_no?: string | null
          national_id?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          auth_uid?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          full_name?: string | null
          id?: string
          join_date?: string
          last_name?: string
          member_no?: string | null
          national_id?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          id: string
          member_id: string | null
          notes: string | null
          requested_at: string
          status: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "withdrawals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_contribution_summary"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "withdrawals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      member_contribution_summary: {
        Row: {
          contribution_count: number | null
          full_name: string | null
          last_contribution: string | null
          member_id: string | null
          total_contributed: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      contribution_type:
        | "regular"
        | "xmas_savings"
        | "land_fund"
        | "security_fund"
        | "registration_fee"
      expense_impact: "operational" | "fund_specific" | "investment"
      loan_status: "active" | "repaid" | "overdue" | "defaulted" | "draft"
      message_channel: "sms" | "email" | "whatsapp"
      message_status: "queued" | "sent" | "delivered" | "failed"
      record_status: "active" | "inactive" | "pending"
      user_role: "chairperson" | "treasurer" | "secretary" | "member" | "viewer"
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
      contribution_type: [
        "regular",
        "xmas_savings",
        "land_fund",
        "security_fund",
        "registration_fee",
      ],
      expense_impact: ["operational", "fund_specific", "investment"],
      loan_status: ["active", "repaid", "overdue", "defaulted", "draft"],
      message_channel: ["sms", "email", "whatsapp"],
      message_status: ["queued", "sent", "delivered", "failed"],
      record_status: ["active", "inactive", "pending"],
      user_role: ["chairperson", "treasurer", "secretary", "member", "viewer"],
    },
  },
} as const
