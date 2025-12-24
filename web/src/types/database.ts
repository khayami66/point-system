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
      families: {
        Row: {
          id: string
          share_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          share_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          share_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      children: {
        Row: {
          id: string
          family_id: string
          name: string
          nickname: string | null
          total_points: number
          cycle_points: number
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          nickname?: string | null
          total_points?: number
          cycle_points?: number
          level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          nickname?: string | null
          total_points?: number
          cycle_points?: number
          level?: number
          created_at?: string
          updated_at?: string
        }
      }
      actions: {
        Row: {
          id: string
          family_id: string
          name: string
          points: number
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          points?: number
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          points?: number
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      records: {
        Row: {
          id: string
          child_id: string
          action_id: string
          points: number
          recorded_at: string
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          child_id: string
          action_id: string
          points: number
          recorded_at?: string
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          action_id?: string
          points?: number
          recorded_at?: string
          source?: string
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          family_id: string
          title: string
          description: string | null
          target_points: number | null
          display_order: number
          is_achieved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          description?: string | null
          target_points?: number | null
          display_order?: number
          is_achieved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          title?: string
          description?: string | null
          target_points?: number | null
          display_order?: number
          is_achieved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_families: {
        Row: {
          id: string
          user_id: string
          family_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          family_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string
          role?: string
          created_at?: string
        }
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
  }
}

// 便利な型エイリアス
export type Family = Database['public']['Tables']['families']['Row']
export type Child = Database['public']['Tables']['children']['Row']
export type Action = Database['public']['Tables']['actions']['Row']
export type Record = Database['public']['Tables']['records']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type UserFamily = Database['public']['Tables']['user_families']['Row']
