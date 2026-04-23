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
      profiles: {
        Row: {
          contributor_id: string | null
          created_at: string
          full_name: string | null
          id: string
          organisation: string | null
          professional_role: string | null
          profile_completed: boolean
          sector: Database["public"]["Enums"]["sector_type"] | null
          updated_at: string
        }
        Insert: {
          contributor_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          organisation?: string | null
          professional_role?: string | null
          profile_completed?: boolean
          sector?: Database["public"]["Enums"]["sector_type"] | null
          updated_at?: string
        }
        Update: {
          contributor_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organisation?: string | null
          professional_role?: string | null
          profile_completed?: boolean
          sector?: Database["public"]["Enums"]["sector_type"] | null
          updated_at?: string
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
      contract_type: "Off-chain" | "On-chain reference"
      counterparty_type:
        | "Company"
        | "Cooperative"
        | "University"
        | "Platform"
        | "Individual"
        | "Government"
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
      stake_type: "Financial" | "Attribution" | "Governance" | "Mixed"
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
      stake_type: ["Financial", "Attribution", "Governance", "Mixed"],
    },
  },
} as const
