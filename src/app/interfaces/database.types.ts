export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      perfil_acesso: {
        Row: {
          id: number
          nome: string
          descricao: string | null
        }
        Insert: {
          id?: number
          nome: string
          descricao?: string | null
        }
        Update: {
          id?: number
          nome?: string
          descricao?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          nome: string
          perfil_acesso_id: number
          created_at: string
        }
        Insert: {
          id: string
          nome: string
          perfil_acesso_id: number
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          perfil_acesso_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedSchema: "auth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_perfil_acesso_id_fkey"
            columns: ["perfil_acesso_id"]
            isOneToOne: false
            referencedRelation: "perfil_acesso"
            referencedSchema: "public"
            referencedColumns: ["id"]
          }
        ]
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
