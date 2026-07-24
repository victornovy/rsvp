// This file mirrors the output of:
//   supabase gen types typescript --local --schema public
// Regenerate it after changing /supabase/migrations (see README) —
// it is checked in so the app builds without a live Supabase project.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          event_date: string;
          location: string | null;
          image_url: string | null;
          max_people: number;
          anti_penetra: boolean;
          public_token: string;
          status: "active" | "cancelled" | "archived";
          is_paid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          location?: string | null;
          image_url?: string | null;
          max_people?: number;
          anti_penetra?: boolean;
          public_token: string;
          status?: "active" | "cancelled" | "archived";
          is_paid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          location?: string | null;
          image_url?: string | null;
          max_people?: number;
          anti_penetra?: boolean;
          public_token?: string;
          status?: "active" | "cancelled" | "archived";
          is_paid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          id: string;
          event_id: string;
          main_guest_id: string | null;
          name: string;
          contact: string | null;
          response: "pending" | "yes" | "no";
          guest_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          main_guest_id?: string | null;
          name: string;
          contact?: string | null;
          response?: "pending" | "yes" | "no";
          guest_token: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          main_guest_id?: string | null;
          name?: string;
          contact?: string | null;
          response?: "pending" | "yes" | "no";
          guest_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credentials: {
        Row: {
          id: string;
          event_id: string;
          guest_id: string;
          qr_token: string;
          status: "active" | "used" | "revoked";
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          guest_id: string;
          qr_token: string;
          status?: "active" | "used" | "revoked";
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          guest_id?: string;
          qr_token?: string;
          status?: "active" | "used" | "revoked";
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      access_links: {
        Row: {
          id: string;
          event_id: string;
          kind: string;
          token: string;
          expires_at: string | null;
          revoked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          kind?: string;
          token: string;
          expires_at?: string | null;
          revoked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          kind?: string;
          token?: string;
          expires_at?: string | null;
          revoked?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
