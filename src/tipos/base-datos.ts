/**
 * Descripción: Tipos de la base de datos generados por Supabase.
 *
 * Es la foto real del esquema del proyecto. `tipos/modelos.ts` describe el
 * dominio de la app con nombres cómodos; este archivo es el contrato de la
 * base de datos y sirve para dar tipos a las consultas:
 *
 *   const db = supabase as unknown as SupabaseClient<Database>;
 *
 * ARCHIVO GENERADO: no se edita a mano. Para regenerarlo, con el MCP de
 * Supabase (generate_typescript_types) o con la CLI:
 *
 *   npx supabase gen types typescript --project-id <ref> > tipos/base-datos.ts
 */

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
      categorias: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          orden: number | null
          restaurante_id: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          orden?: number | null
          restaurante_id: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          restaurante_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_restaurante_id_fkey"
            columns: ["restaurante_id"]
            isOneToOne: false
            referencedRelation: "restaurantes"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_cloudinary: {
        Row: {
          api_key: string
          api_secret: string
          cloud_name: string
          created_at: string | null
          folder_name: string | null
          id: string
          updated_at: string | null
          upload_preset: string | null
          usuario_id: string
        }
        Insert: {
          api_key: string
          api_secret: string
          cloud_name: string
          created_at?: string | null
          folder_name?: string | null
          id?: string
          updated_at?: string | null
          upload_preset?: string | null
          usuario_id: string
        }
        Update: {
          api_key?: string
          api_secret?: string
          cloud_name?: string
          created_at?: string | null
          folder_name?: string | null
          id?: string
          updated_at?: string | null
          upload_preset?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      opciones_platillo: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          orden: number | null
          platillo_id: string
          requerido: boolean | null
          tipo: string
          valores: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          orden?: number | null
          platillo_id: string
          requerido?: boolean | null
          tipo: string
          valores: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          platillo_id?: string
          requerido?: boolean | null
          tipo?: string
          valores?: Json
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          costo_envio: number | null
          created_at: string | null
          direccion_entrega: string | null
          email_cliente: string | null
          estado: string | null
          hora_entregado: string | null
          hora_estimada_entrega: string | null
          hora_pedido: string | null
          id: string
          impuestos: number | null
          items: Json
          metodo_pago: string | null
          nombre_cliente: string
          notas_cliente: string | null
          notas_restaurante: string | null
          pagado: boolean | null
          restaurante_id: string
          subtotal: number
          telefono_cliente: string
          tipo_pedido: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          costo_envio?: number | null
          created_at?: string | null
          direccion_entrega?: string | null
          email_cliente?: string | null
          estado?: string | null
          hora_entregado?: string | null
          hora_estimada_entrega?: string | null
          hora_pedido?: string | null
          id?: string
          impuestos?: number | null
          items: Json
          metodo_pago?: string | null
          nombre_cliente: string
          notas_cliente?: string | null
          notas_restaurante?: string | null
          pagado?: boolean | null
          restaurante_id: string
          subtotal: number
          telefono_cliente: string
          tipo_pedido?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          costo_envio?: number | null
          created_at?: string | null
          direccion_entrega?: string | null
          email_cliente?: string | null
          estado?: string | null
          hora_entregado?: string | null
          hora_estimada_entrega?: string | null
          hora_pedido?: string | null
          id?: string
          impuestos?: number | null
          items?: Json
          metodo_pago?: string | null
          nombre_cliente?: string
          notas_cliente?: string | null
          notas_restaurante?: string | null
          pagado?: boolean | null
          restaurante_id?: string
          subtotal?: number
          telefono_cliente?: string
          tipo_pedido?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      platillos: {
        Row: {
          activo: boolean | null
          alergenos: string[] | null
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          disponible: boolean | null
          id: string
          imagen_public_id: string | null
          imagen_url: string | null
          ingredientes: string[] | null
          nombre: string
          orden: number | null
          picante: boolean | null
          precio: number
          restaurante_id: string
          updated_at: string | null
          vegano: boolean | null
          vegetariano: boolean | null
        }
        Insert: {
          activo?: boolean | null
          alergenos?: string[] | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          disponible?: boolean | null
          id?: string
          imagen_public_id?: string | null
          imagen_url?: string | null
          ingredientes?: string[] | null
          nombre: string
          orden?: number | null
          picante?: boolean | null
          precio: number
          restaurante_id: string
          updated_at?: string | null
          vegano?: boolean | null
          vegetariano?: boolean | null
        }
        Update: {
          activo?: boolean | null
          alergenos?: string[] | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          disponible?: boolean | null
          id?: string
          imagen_public_id?: string | null
          imagen_url?: string | null
          ingredientes?: string[] | null
          nombre?: string
          orden?: number | null
          picante?: boolean | null
          precio?: number
          restaurante_id?: string
          updated_at?: string | null
          vegano?: boolean | null
          vegetariano?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "platillos_restaurante_id_fkey"
            columns: ["restaurante_id"]
            isOneToOne: false
            referencedRelation: "restaurantes"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurantes: {
        Row: {
          activo: boolean | null
          ciudad: string | null
          codigo_postal: string | null
          created_at: string | null
          departamento: string | null
          descripcion: string | null
          dias_abierto: Json | null
          direccion: string | null
          email: string | null
          eslogan: string | null
          facebook: string | null
          horario_apertura: string | null
          horario_cierre: string | null
          id: string
          idioma: string | null
          imagen_banner_public_id: string | null
          imagen_banner_url: string | null
          imagen_logo_public_id: string | null
          imagen_logo_url: string | null
          instagram: string | null
          moneda: string | null
          municipio: string | null
          nombre: string
          pais: string | null
          telefono: string | null
          twitter: string | null
          updated_at: string | null
          usuario_id: string
          whatsapp: string | null
        }
        Insert: {
          activo?: boolean | null
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string | null
          departamento?: string | null
          descripcion?: string | null
          dias_abierto?: Json | null
          direccion?: string | null
          email?: string | null
          eslogan?: string | null
          facebook?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          id?: string
          idioma?: string | null
          imagen_banner_public_id?: string | null
          imagen_banner_url?: string | null
          imagen_logo_public_id?: string | null
          imagen_logo_url?: string | null
          instagram?: string | null
          moneda?: string | null
          municipio?: string | null
          nombre: string
          pais?: string | null
          telefono?: string | null
          twitter?: string | null
          updated_at?: string | null
          usuario_id: string
          whatsapp?: string | null
        }
        Update: {
          activo?: boolean | null
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string | null
          departamento?: string | null
          descripcion?: string | null
          dias_abierto?: Json | null
          direccion?: string | null
          email?: string | null
          eslogan?: string | null
          facebook?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          id?: string
          idioma?: string | null
          imagen_banner_public_id?: string | null
          imagen_banner_url?: string | null
          imagen_logo_public_id?: string | null
          imagen_logo_url?: string | null
          instagram?: string | null
          moneda?: string | null
          municipio?: string | null
          nombre?: string
          pais?: string | null
          telefono?: string | null
          twitter?: string | null
          updated_at?: string | null
          usuario_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurantes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      temas: {
        Row: {
          color_fondo: string | null
          color_fondo_oscuro: string | null
          color_primario: string | null
          color_primario_oscuro: string | null
          color_secundario: string | null
          color_secundario_oscuro: string | null
          color_texto: string | null
          color_texto_oscuro: string | null
          color_texto_titulos: string | null
          color_texto_titulos_oscuro: string | null
          created_at: string | null
          estilo_plantilla: string | null
          fuente_cuerpo: string | null
          fuente_titulos: string | null
          id: string
          restaurante_id: string
          updated_at: string | null
        }
        Insert: {
          color_fondo?: string | null
          color_fondo_oscuro?: string | null
          color_primario?: string | null
          color_primario_oscuro?: string | null
          color_secundario?: string | null
          color_secundario_oscuro?: string | null
          color_texto?: string | null
          color_texto_oscuro?: string | null
          color_texto_titulos?: string | null
          color_texto_titulos_oscuro?: string | null
          created_at?: string | null
          estilo_plantilla?: string | null
          fuente_cuerpo?: string | null
          fuente_titulos?: string | null
          id?: string
          restaurante_id: string
          updated_at?: string | null
        }
        Update: {
          color_fondo?: string | null
          color_fondo_oscuro?: string | null
          color_primario?: string | null
          color_primario_oscuro?: string | null
          color_secundario?: string | null
          color_secundario_oscuro?: string | null
          color_texto?: string | null
          color_texto_oscuro?: string | null
          color_texto_titulos?: string | null
          color_texto_titulos_oscuro?: string | null
          created_at?: string | null
          estilo_plantilla?: string | null
          fuente_cuerpo?: string | null
          fuente_titulos?: string | null
          id?: string
          restaurante_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temas_restaurante_id_fkey"
            columns: ["restaurante_id"]
            isOneToOne: true
            referencedRelation: "restaurantes"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          apellido: string
          barrio: string | null
          created_at: string | null
          datos_envio_actualizado_en: string | null
          datos_envio_omitidos_en: string | null
          direccion: string | null
          email: string
          id: string
          nombre: string
          referencias: string | null
          rol: string
          telefono: string | null
        }
        Insert: {
          apellido: string
          barrio?: string | null
          created_at?: string | null
          datos_envio_actualizado_en?: string | null
          datos_envio_omitidos_en?: string | null
          direccion?: string | null
          email: string
          id: string
          nombre: string
          referencias?: string | null
          rol?: string
          telefono?: string | null
        }
        Update: {
          apellido?: string
          barrio?: string | null
          created_at?: string | null
          datos_envio_actualizado_en?: string | null
          datos_envio_omitidos_en?: string | null
          direccion?: string | null
          email?: string
          id?: string
          nombre?: string
          referencias?: string | null
          rol?: string
          telefono?: string | null
        }
        Relationships: []
      }
      valoraciones: {
        Row: {
          aprobado: boolean | null
          calificacion: number
          comentario: string | null
          created_at: string | null
          email_cliente: string | null
          foto_url: string | null
          id: string
          nombre_cliente: string
          platillo_id: string | null
          restaurante_id: string
          respuesta_dueno: string | null
          usuario_id: string | null
          visible: boolean | null
        }
        Insert: {
          aprobado?: boolean | null
          calificacion: number
          comentario?: string | null
          created_at?: string | null
          email_cliente?: string | null
          foto_url?: string | null
          id?: string
          nombre_cliente: string
          platillo_id?: string | null
          restaurante_id: string
          respuesta_dueno?: string | null
          usuario_id?: string | null
          visible?: boolean | null
        }
        Update: {
          aprobado?: boolean | null
          calificacion?: number
          comentario?: string | null
          created_at?: string | null
          email_cliente?: string | null
          foto_url?: string | null
          id?: string
          nombre_cliente?: string
          platillo_id?: string | null
          restaurante_id?: string
          respuesta_dueno?: string | null
          usuario_id?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_profile: {
        Args: { user_apellido: string; user_id: string; user_nombre: string }
        Returns: undefined
      }
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
