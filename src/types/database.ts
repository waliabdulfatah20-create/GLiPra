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
      ai_invocations: {
        Row: {
          created_at: string
          function_name: string
          id: string
          model: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          model: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          model?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      content_cards: {
        Row: {
          body: string
          card_key: string
          card_type: string
          created_at: string
          disclaimer_tier: number
          id: string
          medication_ids: string[]
          sort_order: number
          title: string
        }
        Insert: {
          body: string
          card_key: string
          card_type?: string
          created_at?: string
          disclaimer_tier?: number
          id?: string
          medication_ids?: string[]
          sort_order?: number
          title: string
        }
        Update: {
          body?: string
          card_key?: string
          card_type?: string
          created_at?: string
          disclaimer_tier?: number
          id?: string
          medication_ids?: string[]
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checked_in_at: string
          energy: number
          id: string
          nausea: number
          notes: string | null
          red_flag_triggered: boolean
          user_id: string
          water_ml: number
        }
        Insert: {
          checked_in_at?: string
          energy: number
          id?: string
          nausea: number
          notes?: string | null
          red_flag_triggered?: boolean
          user_id: string
          water_ml?: number
        }
        Update: {
          checked_in_at?: string
          energy?: number
          id?: string
          nausea?: number
          notes?: string | null
          red_flag_triggered?: boolean
          user_id?: string
          water_ml?: number
        }
        Relationships: []
      }
      food_corrections: {
        Row: {
          calories_kcal: number | null
          carbs_g: number | null
          corrected_name: string
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          original_ai_name: string
          protein_g: number
          serving_description: string
          user_id: string
        }
        Insert: {
          calories_kcal?: number | null
          carbs_g?: number | null
          corrected_name: string
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          original_ai_name: string
          protein_g: number
          serving_description: string
          user_id: string
        }
        Update: {
          calories_kcal?: number | null
          carbs_g?: number | null
          corrected_name?: string
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          original_ai_name?: string
          protein_g?: number
          serving_description?: string
          user_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          b12_mcg: number | null
          barcode_ean: string | null
          calories_kcal: number | null
          carbs_g: number | null
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          logged_at: string
          magnesium_mg: number | null
          name: string
          protein_g: number
          serving_description: string
          source: string
          user_id: string
          vitamin_d_iu: number | null
          zinc_mg: number | null
        }
        Insert: {
          b12_mcg?: number | null
          barcode_ean?: string | null
          calories_kcal?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          logged_at: string
          magnesium_mg?: number | null
          name: string
          protein_g: number
          serving_description: string
          source?: string
          user_id: string
          vitamin_d_iu?: number | null
          zinc_mg?: number | null
        }
        Update: {
          b12_mcg?: number | null
          barcode_ean?: string | null
          calories_kcal?: number | null
          carbs_g?: number | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          logged_at?: string
          magnesium_mg?: number | null
          name?: string
          protein_g?: number
          serving_description?: string
          source?: string
          user_id?: string
          vitamin_d_iu?: number | null
          zinc_mg?: number | null
        }
        Relationships: []
      }
      injection_logs: {
        Row: {
          created_at: string
          dosage_strength: string | null
          id: string
          injected_at: string
          medication_name: string
          notes: string | null
          pain_level: number
          site_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage_strength?: string | null
          id?: string
          injected_at: string
          medication_name: string
          notes?: string | null
          pain_level: number
          site_code: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage_strength?: string | null
          id?: string
          injected_at?: string
          medication_name?: string
          notes?: string | null
          pain_level?: number
          site_code?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string
          bmi: number | null
          created_at: string
          dose_mg: number | null
          has_kidney_disease: boolean
          height_cm: number | null
          id: string
          injection_day_of_week: number | null
          is_pregnant: boolean
          last_injection_date: string | null
          medication_id: string
          medication_status: string
          onboarding_completed: boolean
          phase: string
          protein_floor_g: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string
          bmi?: number | null
          created_at?: string
          dose_mg?: number | null
          has_kidney_disease?: boolean
          height_cm?: number | null
          id?: string
          injection_day_of_week?: number | null
          is_pregnant?: boolean
          last_injection_date?: string | null
          medication_id?: string
          medication_status?: string
          onboarding_completed?: boolean
          phase?: string
          protein_floor_g?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string
          bmi?: number | null
          created_at?: string
          dose_mg?: number | null
          has_kidney_disease?: boolean
          height_cm?: number | null
          id?: string
          injection_day_of_week?: number | null
          is_pregnant?: boolean
          last_injection_date?: string | null
          medication_id?: string
          medication_status?: string
          onboarding_completed?: boolean
          phase?: string
          protein_floor_g?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      shot_prep_logs: {
        Row: {
          completed_items: Json
          fully_completed: boolean
          id: string
          injection_date: string
          logged_at: string
          user_id: string
        }
        Insert: {
          completed_items?: Json
          fully_completed?: boolean
          id?: string
          injection_date: string
          logged_at?: string
          user_id: string
        }
        Update: {
          completed_items?: Json
          fully_completed?: boolean
          id?: string
          injection_date?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          id: string
          last_streak_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_streak_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_streak_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_food_defaults: {
        Row: {
          b12_mcg: number | null
          calories_kcal: number | null
          carbs_g: number | null
          fat_g: number | null
          fiber_g: number | null
          food_name_key: string
          id: string
          magnesium_mg: number | null
          protein_g: number
          serving_description: string
          updated_at: string
          user_id: string
          vitamin_d_iu: number | null
          zinc_mg: number | null
        }
        Insert: {
          b12_mcg?: number | null
          calories_kcal?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          food_name_key: string
          id?: string
          magnesium_mg?: number | null
          protein_g: number
          serving_description: string
          updated_at?: string
          user_id: string
          vitamin_d_iu?: number | null
          zinc_mg?: number | null
        }
        Update: {
          b12_mcg?: number | null
          calories_kcal?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          food_name_key?: string
          id?: string
          magnesium_mg?: number | null
          protein_g?: number
          serving_description?: string
          updated_at?: string
          user_id?: string
          vitamin_d_iu?: number | null
          zinc_mg?: number | null
        }
        Relationships: []
      }
      user_milestones: {
        Row: {
          id: string
          milestone_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          milestone_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          milestone_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          ewma_weight_kg: number | null
          id: string
          logged_at: string
          notes: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          ewma_weight_kg?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          ewma_weight_kg?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number
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
    Enums: {},
  },
} as const
