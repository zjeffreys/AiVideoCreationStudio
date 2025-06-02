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
      videos: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          description: string | null
          script: string | null
          characters: string[] | null
          music_style: string | null
          status: 'draft' | 'processing' | 'complete'
          thumbnail_url: string | null
          video_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          description?: string | null
          script?: string | null
          characters?: string[] | null
          music_style?: string | null
          status?: 'draft' | 'processing' | 'complete'
          thumbnail_url?: string | null
          video_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          description?: string | null
          script?: string | null
          characters?: string[] | null
          music_style?: string | null
          status?: 'draft' | 'processing' | 'complete'
          thumbnail_url?: string | null
          video_url?: string | null
        }
      }
      characters: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          personality: string | null
          avatar_url: string | null
          voice_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          personality?: string | null
          avatar_url?: string | null
          voice_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          personality?: string | null
          avatar_url?: string | null
          voice_id?: string | null
        }
      }
      music_styles: {
        Row: {
          id: string
          name: string
          description: string | null
          is_favorite: boolean
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_favorite?: boolean
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_favorite?: boolean
          user_id?: string | null
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