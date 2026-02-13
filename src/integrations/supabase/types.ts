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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_comments: {
        Row: {
          attendance_record_id: string
          comment: string
          created_at: string
          created_by: string
          id: string
          user_id: string
        }
        Insert: {
          attendance_record_id: string
          comment: string
          created_at?: string
          created_by?: string
          id?: string
          user_id: string
        }
        Update: {
          attendance_record_id?: string
          comment?: string
          created_at?: string
          created_by?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_comments_attendance_record_id_fkey"
            columns: ["attendance_record_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_date: string
          check_in_time: string | null
          created_at: string
          event_id: string
          id: string
          ranking_points: number
          recorded_by: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_date?: string
          check_in_time?: string | null
          created_at?: string
          event_id: string
          id?: string
          ranking_points?: number
          recorded_by: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_date?: string
          check_in_time?: string | null
          created_at?: string
          event_id?: string
          id?: string
          ranking_points?: number
          recorded_by?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_signatures: {
        Row: {
          contract_text: string
          created_at: string
          event_id: string
          id: string
          signed_at: string
          signer_name: string
          user_id: string
        }
        Insert: {
          contract_text: string
          created_at?: string
          event_id: string
          id?: string
          signed_at?: string
          signer_name: string
          user_id: string
        }
        Update: {
          contract_text?: string
          created_at?: string
          event_id?: string
          id?: string
          signed_at?: string
          signer_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_signatures_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_accreditors: {
        Row: {
          application_status: Database["public"]["Enums"]["application_status"]
          contract_status: Database["public"]["Enums"]["contract_status"]
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["accreditor_assignment_status"]
          user_id: string
        }
        Insert: {
          application_status?: Database["public"]["Enums"]["application_status"]
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["accreditor_assignment_status"]
          user_id: string
        }
        Update: {
          application_status?: Database["public"]["Enums"]["application_status"]
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["accreditor_assignment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_accreditors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_expenses: {
        Row: {
          amount: number
          approval_status: Database["public"]["Enums"]["expense_approval_status"]
          approved_by: string | null
          created_at: string
          created_by: string
          event_id: string
          id: string
          name: string
          receipt_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          approval_status?: Database["public"]["Enums"]["expense_approval_status"]
          approved_by?: string | null
          created_at?: string
          created_by?: string
          event_id: string
          id?: string
          name: string
          receipt_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          approval_status?: Database["public"]["Enums"]["expense_approval_status"]
          approved_by?: string | null
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          name?: string
          receipt_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          description: string | null
          event_date: string
          hubspot_deal_id: string | null
          id: string
          location: string | null
          name: string
          reimbursement_closed_at: string | null
          reimbursement_closed_by: string | null
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          hubspot_deal_id?: string | null
          id?: string
          location?: string | null
          name: string
          reimbursement_closed_at?: string | null
          reimbursement_closed_by?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          hubspot_deal_id?: string | null
          id?: string
          location?: string | null
          name?: string
          reimbursement_closed_at?: string | null
          reimbursement_closed_by?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          emission_date: string
          event_id: string
          file_url: string | null
          id: string
          invoice_number: number
          numero_boleta: string | null
          payment_date: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          emission_date?: string
          event_id: string
          file_url?: string | null
          id?: string
          invoice_number?: number
          numero_boleta?: string | null
          payment_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          emission_date?: string
          event_id?: string
          file_url?: string | null
          id?: string
          invoice_number?: number
          numero_boleta?: string | null
          payment_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          altura: string | null
          apellido: string
          approval_status: Database["public"]["Enums"]["approval_status"]
          banco: string | null
          carrera: string | null
          created_at: string
          email: string
          foto_url: string | null
          id: string
          idioma: string | null
          is_active: boolean
          nombre: string
          numero_cuenta: string | null
          ranking: number | null
          referencia_contacto: string | null
          rut: string
          telefono: string | null
          tipo_cuenta: string | null
          universidad: string | null
          updated_at: string
        }
        Insert: {
          altura?: string | null
          apellido: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          banco?: string | null
          carrera?: string | null
          created_at?: string
          email: string
          foto_url?: string | null
          id: string
          idioma?: string | null
          is_active?: boolean
          nombre: string
          numero_cuenta?: string | null
          ranking?: number | null
          referencia_contacto?: string | null
          rut: string
          telefono?: string | null
          tipo_cuenta?: string | null
          universidad?: string | null
          updated_at?: string
        }
        Update: {
          altura?: string | null
          apellido?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          banco?: string | null
          carrera?: string | null
          created_at?: string
          email?: string
          foto_url?: string | null
          id?: string
          idioma?: string | null
          is_active?: boolean
          nombre?: string
          numero_cuenta?: string | null
          ranking?: number | null
          referencia_contacto?: string | null
          rut?: string
          telefono?: string | null
          tipo_cuenta?: string | null
          universidad?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          created_by: string
          creator_apellido: string
          creator_email: string
          creator_nombre: string
          creator_role: string
          creator_rut: string
          creator_telefono: string | null
          editor_apellido: string | null
          editor_email: string | null
          editor_nombre: string | null
          editor_role: string | null
          editor_rut: string | null
          editor_telefono: string | null
          evidence_url: string | null
          id: string
          motivo: string
          observaciones: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          response_evidence_url: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          creator_apellido?: string
          creator_email?: string
          creator_nombre?: string
          creator_role?: string
          creator_rut?: string
          creator_telefono?: string | null
          editor_apellido?: string | null
          editor_email?: string | null
          editor_nombre?: string | null
          editor_role?: string | null
          editor_rut?: string | null
          editor_telefono?: string | null
          evidence_url?: string | null
          id?: string
          motivo: string
          observaciones?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          response_evidence_url?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          creator_apellido?: string
          creator_email?: string
          creator_nombre?: string
          creator_role?: string
          creator_rut?: string
          creator_telefono?: string | null
          editor_apellido?: string | null
          editor_email?: string | null
          editor_nombre?: string | null
          editor_role?: string | null
          editor_rut?: string | null
          editor_telefono?: string | null
          evidence_url?: string | null
          id?: string
          motivo?: string
          observaciones?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          response_evidence_url?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          body_text: string
          buttons: Json | null
          category: string
          created_at: string
          footer_text: string | null
          header_image_url: string | null
          header_text: string | null
          header_type: string
          id: string
          language: string
          meta_template_id: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          body_text: string
          buttons?: Json | null
          category?: string
          created_at?: string
          footer_text?: string | null
          header_image_url?: string | null
          header_text?: string | null
          header_type?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          body_text?: string
          buttons?: Json | null
          category?: string
          created_at?: string
          footer_text?: string | null
          header_image_url?: string | null
          header_text?: string | null
          header_type?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      accreditor_assignment_status: "assigned" | "completed"
      app_role: "superadmin" | "administracion" | "supervisor" | "acreditador"
      application_status: "pendiente" | "aceptado" | "rechazado"
      approval_status: "pending" | "rejected" | "approved"
      attendance_status: "presente" | "atrasado" | "ausente"
      contract_status: "pendiente" | "firmado" | "rechazado"
      event_status: "pending" | "in_progress" | "completed" | "cancelled"
      expense_approval_status: "pendiente" | "aprobado" | "rechazado"
      invoice_status: "pendiente" | "pagado" | "rechazado"
      ticket_priority: "alta" | "media" | "baja"
      ticket_status: "pendiente" | "resuelto" | "inactivo"
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
      accreditor_assignment_status: ["assigned", "completed"],
      app_role: ["superadmin", "administracion", "supervisor", "acreditador"],
      application_status: ["pendiente", "aceptado", "rechazado"],
      approval_status: ["pending", "rejected", "approved"],
      attendance_status: ["presente", "atrasado", "ausente"],
      contract_status: ["pendiente", "firmado", "rechazado"],
      event_status: ["pending", "in_progress", "completed", "cancelled"],
      expense_approval_status: ["pendiente", "aprobado", "rechazado"],
      invoice_status: ["pendiente", "pagado", "rechazado"],
      ticket_priority: ["alta", "media", "baja"],
      ticket_status: ["pendiente", "resuelto", "inactivo"],
    },
  },
} as const
