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
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          properties: Json | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          properties?: Json | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json | null
          session_id?: string | null
        }
        Relationships: []
      }
      contract_attestors: {
        Row: {
          added_at: string
          attestor_email: string
          attestor_name: string
          attestor_role: string | null
          contract_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          attestor_email: string
          attestor_name: string
          attestor_role?: string | null
          contract_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          attestor_email?: string
          attestor_name?: string
          attestor_role?: string | null
          contract_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_attestors_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          attestation_required: boolean
          contract_type: Database["public"]["Enums"]["contract_type"]
          counterparty_name: string
          counterparty_type: Database["public"]["Enums"]["counterparty_type"]
          created_at: string
          entitlement_description: string
          id: string
          name: string
          reference: string | null
          stake_type: Database["public"]["Enums"]["stake_type"]
          trigger_description: string
          user_id: string
        }
        Insert: {
          attestation_required?: boolean
          contract_type: Database["public"]["Enums"]["contract_type"]
          counterparty_name: string
          counterparty_type: Database["public"]["Enums"]["counterparty_type"]
          created_at?: string
          entitlement_description: string
          id?: string
          name: string
          reference?: string | null
          stake_type: Database["public"]["Enums"]["stake_type"]
          trigger_description: string
          user_id: string
        }
        Update: {
          attestation_required?: boolean
          contract_type?: Database["public"]["Enums"]["contract_type"]
          counterparty_name?: string
          counterparty_type?: Database["public"]["Enums"]["counterparty_type"]
          created_at?: string
          entitlement_description?: string
          id?: string
          name?: string
          reference?: string | null
          stake_type?: Database["public"]["Enums"]["stake_type"]
          trigger_description?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          email: string
          id: string
          message: string | null
          name: string | null
          organisation: string | null
          source: string | null
          submitted_at: string
          use_case: string | null
        }
        Insert: {
          email: string
          id?: string
          message?: string | null
          name?: string | null
          organisation?: string | null
          source?: string | null
          submitted_at?: string
          use_case?: string | null
        }
        Update: {
          email?: string
          id?: string
          message?: string | null
          name?: string | null
          organisation?: string | null
          source?: string | null
          submitted_at?: string
          use_case?: string | null
        }
        Relationships: []
      }
      evidence: {
        Row: {
          contract_id: string
          created_at: string
          description: string | null
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          execution_id: string | null
          fingerprint: string
          id: string
          notes: string | null
          source_url: string | null
          timestamp_created: string
          title: string
          user_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          description?: string | null
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          execution_id?: string | null
          fingerprint: string
          id?: string
          notes?: string | null
          source_url?: string | null
          timestamp_created?: string
          title: string
          user_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          description?: string | null
          evidence_type?: Database["public"]["Enums"]["evidence_type"]
          execution_id?: string | null
          fingerprint?: string
          id?: string
          notes?: string | null
          source_url?: string | null
          timestamp_created?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "executions"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_attestations: {
        Row: {
          attestation_type: string
          attestor_email: string | null
          attestor_name: string
          contract_id: string
          document_fingerprint: string | null
          email_sent: boolean
          email_sent_at: string | null
          execution_id: string
          id: string
          last_nudged_at: string | null
          notes: string | null
          requested_at: string
          responded_at: string | null
          status: Database["public"]["Enums"]["attestation_status"]
          token: string
          user_id: string
        }
        Insert: {
          attestation_type?: string
          attestor_email?: string | null
          attestor_name: string
          contract_id: string
          document_fingerprint?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          execution_id: string
          id?: string
          last_nudged_at?: string | null
          notes?: string | null
          requested_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["attestation_status"]
          token?: string
          user_id: string
        }
        Update: {
          attestation_type?: string
          attestor_email?: string | null
          attestor_name?: string
          contract_id?: string
          document_fingerprint?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          execution_id?: string
          id?: string
          last_nudged_at?: string | null
          notes?: string | null
          requested_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["attestation_status"]
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_attestations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_attestations_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "executions"
            referencedColumns: ["id"]
          },
        ]
      }
      executions: {
        Row: {
          confidence: string | null
          contract_id: string
          created_at: string
          currency: string
          evidence_ids: string[]
          execution_date: string
          expected_resolution: string | null
          id: string
          notes: string | null
          resolver_description: string | null
          settled_amount: number | null
          settlement_channel:
            | Database["public"]["Enums"]["settlement_channel"]
            | null
          settlement_reference: string | null
          status: Database["public"]["Enums"]["execution_status"]
          title: string
          trigger_met: boolean
          updated_at: string
          user_id: string
          work_description: string
        }
        Insert: {
          confidence?: string | null
          contract_id: string
          created_at?: string
          currency?: string
          evidence_ids?: string[]
          execution_date?: string
          expected_resolution?: string | null
          id?: string
          notes?: string | null
          resolver_description?: string | null
          settled_amount?: number | null
          settlement_channel?:
            | Database["public"]["Enums"]["settlement_channel"]
            | null
          settlement_reference?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
          title: string
          trigger_met?: boolean
          updated_at?: string
          user_id: string
          work_description: string
        }
        Update: {
          confidence?: string | null
          contract_id?: string
          created_at?: string
          currency?: string
          evidence_ids?: string[]
          execution_date?: string
          expected_resolution?: string | null
          id?: string
          notes?: string | null
          resolver_description?: string | null
          settled_amount?: number | null
          settlement_channel?:
            | Database["public"]["Enums"]["settlement_channel"]
            | null
          settlement_reference?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
          title?: string
          trigger_met?: boolean
          updated_at?: string
          user_id?: string
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "executions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string | null
          id: string
          max_uses: number
          note: string | null
          use_count: number
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          use_count?: number
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          note?: string | null
          use_count?: number
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          contract_id: string | null
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          execution_id: string | null
          id: string
          message: string
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          execution_id?: string | null
          id?: string
          message: string
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          execution_id?: string | null
          id?: string
          message?: string
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anonymised: boolean
          contributor_id: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          organisation: string | null
          passport_first_shared_at: string | null
          passport_visible: boolean
          professional_role: string | null
          profile_completed: boolean
          sector: Database["public"]["Enums"]["sector_type"] | null
          show_amounts: boolean
          show_contracts: boolean
          show_counterparties: boolean
          updated_at: string
        }
        Insert: {
          anonymised?: boolean
          contributor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          organisation?: string | null
          passport_first_shared_at?: string | null
          passport_visible?: boolean
          professional_role?: string | null
          profile_completed?: boolean
          sector?: Database["public"]["Enums"]["sector_type"] | null
          show_amounts?: boolean
          show_contracts?: boolean
          show_counterparties?: boolean
          updated_at?: string
        }
        Update: {
          anonymised?: boolean
          contributor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          organisation?: string | null
          passport_first_shared_at?: string | null
          passport_visible?: boolean
          professional_role?: string | null
          profile_completed?: boolean
          sector?: Database["public"]["Enums"]["sector_type"] | null
          show_amounts?: boolean
          show_contracts?: boolean
          show_counterparties?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      trigger_events: {
        Row: {
          id: string
          received_at: string
          source_ip: string | null
          trigger_id: string
          value: number
        }
        Insert: {
          id?: string
          received_at?: string
          source_ip?: string | null
          trigger_id: string
          value: number
        }
        Update: {
          id?: string
          received_at?: string
          source_ip?: string | null
          trigger_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "trigger_events_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      triggers: {
        Row: {
          confidence: string | null
          contract_id: string
          created_at: string
          current_value: number
          direction: Database["public"]["Enums"]["trigger_direction"]
          id: string
          label: string
          last_updated: string | null
          notes: string | null
          source_type: Database["public"]["Enums"]["trigger_source"]
          threshold_value: number
          unit: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          confidence?: string | null
          contract_id: string
          created_at?: string
          current_value?: number
          direction?: Database["public"]["Enums"]["trigger_direction"]
          id?: string
          label: string
          last_updated?: string | null
          notes?: string | null
          source_type?: Database["public"]["Enums"]["trigger_source"]
          threshold_value: number
          unit?: string | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          confidence?: string | null
          contract_id?: string
          created_at?: string
          current_value?: number
          direction?: Database["public"]["Enums"]["trigger_direction"]
          id?: string
          label?: string
          last_updated?: string | null
          notes?: string | null
          source_type?: Database["public"]["Enums"]["trigger_source"]
          threshold_value?: number
          unit?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "triggers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_entries: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          hours: number | null
          id: string
          reference_url: string | null
          settled_amount: number | null
          settled_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          hours?: number | null
          id?: string
          reference_url?: string | null
          settled_amount?: number | null
          settled_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          work_date?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          hours?: number | null
          id?: string
          reference_url?: string | null
          settled_amount?: number | null
          settled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_profile_with_contributor_id: {
        Args: {
          p_full_name: string
          p_organisation: string
          p_professional_role: string
          p_sector: Database["public"]["Enums"]["sector_type"]
        }
        Returns: Json
      }
      get_admin_stats: { Args: never; Returns: Json }
      get_admin_user_list: { Args: never; Returns: Json }
      get_attestation_by_token: { Args: { p_token: string }; Returns: Json }
      get_public_passport: { Args: { p_contributor_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_invite_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: boolean
      }
      soft_delete_account: { Args: never; Returns: Json }
      submit_attestation: {
        Args: { p_decision: string; p_notes?: string; p_token: string }
        Returns: Json
      }
      validate_invite_code: {
        Args: { p_code: string; p_email: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "support"
      attestation_status: "Pending" | "Confirmed" | "Declined"
      contract_type: "Off-chain" | "On-chain reference"
      counterparty_type:
        | "Company"
        | "Cooperative"
        | "University"
        | "Platform"
        | "Individual"
        | "Government"
      evidence_type:
        | "Document"
        | "Dataset"
        | "Code"
        | "Measurement"
        | "Training record"
        | "Patent filing"
        | "Batch record"
        | "Session file"
        | "Other"
      execution_status:
        | "Pending"
        | "Attested"
        | "Settled"
        | "Intent logged"
        | "Declined"
      notification_type:
        | "trigger_met"
        | "execution_pending"
        | "settlement_due"
        | "attestation_requested"
        | "system"
        | "attestation_confirmed"
        | "attestation_declined"
        | "evidence_required"
      sector_type:
        | "Software"
        | "Pharma & Biotech"
        | "Agriculture"
        | "Manufacturing"
        | "Music & Publishing"
        | "Film & Television"
        | "AI & Data"
        | "College Athletics"
        | "Other"
      settlement_channel:
        | "Bank transfer"
        | "Stripe"
        | "Coinbase"
        | "USDC"
        | "Other"
        | "Not applicable"
      stake_type: "Financial" | "Attribution" | "Governance" | "Mixed"
      trigger_direction: "Above" | "Below"
      trigger_source: "Manual" | "Webhook" | "File import"
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
      app_role: ["admin", "support"],
      attestation_status: ["Pending", "Confirmed", "Declined"],
      contract_type: ["Off-chain", "On-chain reference"],
      counterparty_type: [
        "Company",
        "Cooperative",
        "University",
        "Platform",
        "Individual",
        "Government",
      ],
      evidence_type: [
        "Document",
        "Dataset",
        "Code",
        "Measurement",
        "Training record",
        "Patent filing",
        "Batch record",
        "Session file",
        "Other",
      ],
      execution_status: [
        "Pending",
        "Attested",
        "Settled",
        "Intent logged",
        "Declined",
      ],
      notification_type: [
        "trigger_met",
        "execution_pending",
        "settlement_due",
        "attestation_requested",
        "system",
        "attestation_confirmed",
        "attestation_declined",
        "evidence_required",
      ],
      sector_type: [
        "Software",
        "Pharma & Biotech",
        "Agriculture",
        "Manufacturing",
        "Music & Publishing",
        "Film & Television",
        "AI & Data",
        "College Athletics",
        "Other",
      ],
      settlement_channel: [
        "Bank transfer",
        "Stripe",
        "Coinbase",
        "USDC",
        "Other",
        "Not applicable",
      ],
      stake_type: ["Financial", "Attribution", "Governance", "Mixed"],
      trigger_direction: ["Above", "Below"],
      trigger_source: ["Manual", "Webhook", "File import"],
    },
  },
} as const
