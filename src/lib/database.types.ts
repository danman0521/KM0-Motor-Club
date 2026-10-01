
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "event_attendance": {
                  Row: {
                    "event_id": string,"profile_id": string,"status": Database["public"]['Enums']["attendance_status"],"updated_at": string
                  }
                  Insert: {
                    "event_id": string,"profile_id"?: string,"status": Database["public"]['Enums']["attendance_status"],"updated_at"?: string
                  }
                  Update: {
                    "event_id"?: string,"profile_id"?: string,"status"?: Database["public"]['Enums']["attendance_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_attendance_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_attendance_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_comments": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"event_id": string,"id": string
                  }
                  Insert: {
                    "author_id"?: string,"body": string,"created_at"?: string,"event_id": string,"id"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"event_id"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_comments_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"event_photos": {
                  Row: {
                    "created_at": string,"event_id": string,"id": string,"storage_path": string,"uploaded_by": string | null
                  }
                  Insert: {
                    "created_at"?: string,"event_id": string,"id"?: string,"storage_path": string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"event_id"?: string,"id"?: string,"storage_path"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_photos_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_photos_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_ratings": {
                  Row: {
                    "event_id": string,"profile_id": string,"stars": number,"updated_at": string
                  }
                  Insert: {
                    "event_id": string,"profile_id"?: string,"stars": number,"updated_at"?: string
                  }
                  Update: {
                    "event_id"?: string,"profile_id"?: string,"stars"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_ratings_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_ratings_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_videos": {
                  Row: {
                    "created_at": string,"event_id": string,"id": string,"title": string | null,"youtube_id": string
                  }
                  Insert: {
                    "created_at"?: string,"event_id": string,"id"?: string,"title"?: string | null,"youtube_id": string
                  }
                  Update: {
                    "created_at"?: string,"event_id"?: string,"id"?: string,"title"?: string | null,"youtube_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_videos_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "chronicle": string | null,"cover_photo_path": string | null,"created_at": string,"created_by": string | null,"description": string,"id": string,"location": string,"starts_at": string,"title": string
                  }
                  Insert: {
                    "chronicle"?: string | null,"cover_photo_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"location"?: string,"starts_at": string,"title": string
                  }
                  Update: {
                    "chronicle"?: string | null,"cover_photo_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"location"?: string,"starts_at"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"featured_riders": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"month": string,"photo_path": string | null,"profile_id": string,"reason": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"month": string,"photo_path"?: string | null,"profile_id": string,"reason": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"month"?: string,"photo_path"?: string | null,"profile_id"?: string,"reason"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "featured_riders_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "featured_riders_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"partners": {
                  Row: {
                    "active": boolean,"address": string,"benefit": string,"category": string,"created_at": string,"created_by": string | null,"description": string,"id": string,"logo_path": string | null,"name": string,"phone": string,"valid_until": string | null,"website": string | null
                  }
                  Insert: {
                    "active"?: boolean,"address"?: string,"benefit": string,"category"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"logo_path"?: string | null,"name": string,"phone"?: string,"valid_until"?: string | null,"website"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"address"?: string,"benefit"?: string,"category"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"logo_path"?: string | null,"name"?: string,"phone"?: string,"valid_until"?: string | null,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "partners_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"created_at": string,"full_name": string,"id": string,"nickname": string | null,"role": Database["public"]['Enums']["member_role"],"status": Database["public"]['Enums']["member_status"]
                  }
                  Insert: {
                    "avatar_path"?: string | null,"created_at"?: string,"full_name": string,"id": string,"nickname"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"status"?: Database["public"]['Enums']["member_status"]
                  }
                  Update: {
                    "avatar_path"?: string | null,"created_at"?: string,"full_name"?: string,"id"?: string,"nickname"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"status"?: Database["public"]['Enums']["member_status"]
                  }
                  Relationships: [
                    
                  ]
                },"suggestions": {
                  Row: {
                    "created_at": string,"description": string,"event_id": string | null,"id": string,"leader_note": string | null,"proposed_by": string,"status": Database["public"]['Enums']["suggestion_status"],"tentative_date": string | null,"title": string
                  }
                  Insert: {
                    "created_at"?: string,"description"?: string,"event_id"?: string | null,"id"?: string,"leader_note"?: string | null,"proposed_by"?: string,"status"?: Database["public"]['Enums']["suggestion_status"],"tentative_date"?: string | null,"title": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"event_id"?: string | null,"id"?: string,"leader_note"?: string | null,"proposed_by"?: string,"status"?: Database["public"]['Enums']["suggestion_status"],"tentative_date"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "suggestions_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "suggestions_proposed_by_fkey"
      columns: ["proposed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_event_from_suggestion":
{ Args: { "p_description": string,"p_location": string,"p_starts_at": string,"p_suggestion": string,"p_title": string }; Returns: string
                           },
"event_has_started":
{ Args: { "p_event": string }; Returns: boolean
                           },
"is_approved":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_leader":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"public_current_featured":
{ Args: Record<PropertyKey, never>; Returns: {
              "display_name": string,"month": string,"photo_path": string,"reason": string
            }[]
                           },
"public_upcoming_events":
{ Args: Record<PropertyKey, never>; Returns: {
              "location": string,"starts_at": string,"title": string
            }[]
                           }
          }
          Enums: {
            "attendance_status": "going"|"not_going","member_role": "member"|"leader","member_status": "pending"|"approved"|"rejected","suggestion_status": "pending"|"approved"|"rejected"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "attendance_status": ["going", "not_going"],"member_role": ["member", "leader"],"member_status": ["pending", "approved", "rejected"],"suggestion_status": ["pending", "approved", "rejected"]
          }
        }
} as const
