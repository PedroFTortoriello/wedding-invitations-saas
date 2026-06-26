// Hand-written to match supabase/migrations/0001_init.sql.
// Once the project is live, regenerate with:
//   supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "client" | "admin";
export type WeddingStatus = "draft" | "published" | "suspended" | "expired";
export type CashGiftStatus = "pending" | "paid" | "refunded";
export type GuestStatus = "pending" | "confirmed" | "declined";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; name: string | null; role: UserRole; created_at: string };
        Insert: { id: string; email?: string | null; name?: string | null; role?: UserRole; created_at?: string };
        Update: { id?: string; email?: string | null; name?: string | null; role?: UserRole; created_at?: string };
        Relationships: [];
      };
      weddings: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          status: WeddingStatus;
          couple_names: string;
          pix_key: string | null;
          pix_key_type: string | null;
          pix_holder_name: string | null;
          pix_holder_document: string | null;
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          slug: string;
          status?: WeddingStatus;
          couple_names: string;
          pix_key?: string | null;
          pix_key_type?: string | null;
          pix_holder_name?: string | null;
          pix_holder_document?: string | null;
          content: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          slug?: string;
          status?: WeddingStatus;
          couple_names?: string;
          pix_key?: string | null;
          pix_key_type?: string | null;
          pix_holder_name?: string | null;
          pix_holder_document?: string | null;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          id: string;
          wedding_id: string;
          name: string;
          contact: string | null;
          status: GuestStatus;
          companions_allowed: number;
          companions_confirmed: number;
          dietary_restriction: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          name: string;
          contact?: string | null;
          status?: GuestStatus;
          companions_allowed?: number;
          companions_confirmed?: number;
          dietary_restriction?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          name?: string;
          contact?: string | null;
          status?: GuestStatus;
          companions_allowed?: number;
          companions_confirmed?: number;
          dietary_restriction?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: { id: string; wedding_id: string; guest_name: string; message: string; created_at: string };
        Insert: { id?: string; wedding_id: string; guest_name: string; message: string; created_at?: string };
        Update: { id?: string; wedding_id?: string; guest_name?: string; message?: string; created_at?: string };
        Relationships: [];
      };
      cash_gifts: {
        Row: {
          id: string;
          wedding_id: string;
          guest_name: string;
          message: string | null;
          gross_amount: number;
          currency: string;
          status: CashGiftStatus;
          payment_method: string;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          guest_name: string;
          message?: string | null;
          gross_amount: number;
          currency?: string;
          status?: CashGiftStatus;
          payment_method?: string;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          guest_name?: string;
          message?: string | null;
          gross_amount?: number;
          currency?: string;
          status?: CashGiftStatus;
          payment_method?: string;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
