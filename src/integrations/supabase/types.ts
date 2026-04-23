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
      evidence: {
        Row: {
          contract_id: string
          created_at: string
          description: string | null
          evidence_type: Database["public"]["Enums"]["evidence_type"]
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
        ]
      }
      executions: {
        Row: {
          contract_id: string
          created_at: string
          currency: string
          evidence_ids: string[]
          execution_date: string
          id: string
          notes: string | null
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
          contract_id: string
          created_at?: string
          currency?: string
          evidence_ids?: string[]
          execution_date?: string
          id?: string
          notes?: string | null
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
          contract_id?: string
          created_at?: string
          currency?: string
          evidence_ids?: string[]
          execution_date?: string
          id?: string
          notes?: string | null
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
          contributor_id: string | null
          created_at: string
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
          contributor_id?: string | null
          created_at?: string
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
          contributor_id?: string | null
          created_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_passport: { Args: { p_contributor_id: string }; Returns: Json }
    }
    Enums: {
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
      execution_status: "Pending" | "Attested" | "Settled" | "Intent logged"
      notification_type:
        | "trigger_met"
        | "execution_pending"
        | "settlement_due"
        | "attestation_requested"
        | "system"
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
      execution_status: ["Pending", "Attested", "Settled", "Intent logged"],
      notification_type: [
        "trigger_met",
        "execution_pending",
        "settlement_due",
        "attestation_requested",
        "system",
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
