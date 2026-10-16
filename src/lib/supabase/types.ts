// Hand-written to match supabase/migrations/0001_init.sql.
// Once the project is live, regenerate with:
//   supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "client" | "admin";
export type WeddingStatus = "draft" | "published" | "suspended" | "expired";
export type CashGiftStatus = "pending" | "paid" | "refunded" | "failed";
export type GuestStatus = "pending" | "confirmed" | "declined";
export type MpConnectionStatus = "active" | "revoked" | "error";
/** Quem paga a taxa do cartão: o convidado (casal recebe 100%) ou o casal. */
export type CardFeePayer = "guest" | "couple";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          role: UserRole;
          created_at: string;
          /** E.164 só dígitos (0012). Opcional, contato do suporte; nunca no site público. */
          whatsapp: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          role?: UserRole;
          created_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          role?: UserRole;
          created_at?: string;
          whatsapp?: string | null;
        };
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
          content: Json;
          created_at: string;
          updated_at: string;
          publish_paid_at: string | null;
          coordinator_token: string | null;
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
          content: Json;
          created_at?: string;
          updated_at?: string;
          publish_paid_at?: string | null;
          coordinator_token?: string | null;
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
          content?: Json;
          created_at?: string;
          updated_at?: string;
          publish_paid_at?: string | null;
          coordinator_token?: string | null;
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
          provider: string | null;
          provider_payment_id: string | null;
          provider_status: string | null;
          charged_amount: number | null;
          net_amount: number | null;
          installments: number | null;
          gift_id: string | null;
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
          provider?: string | null;
          provider_payment_id?: string | null;
          provider_status?: string | null;
          charged_amount?: number | null;
          net_amount?: number | null;
          installments?: number | null;
          gift_id?: string | null;
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
          provider?: string | null;
          provider_payment_id?: string | null;
          provider_status?: string | null;
          charged_amount?: number | null;
          net_amount?: number | null;
          installments?: number | null;
          gift_id?: string | null;
        };
        Relationships: [];
      };
      mp_connections: {
        Row: {
          wedding_id: string;
          mp_user_id: string;
          access_token_enc: string;
          refresh_token_enc: string;
          public_key: string | null;
          scope: string | null;
          live_mode: boolean;
          expires_at: string;
          mp_nickname: string | null;
          mp_email: string | null;
          status: MpConnectionStatus;
          fee_payer: CardFeePayer;
          last_error: string | null;
          connected_at: string;
          updated_at: string;
        };
        Insert: {
          wedding_id: string;
          mp_user_id: string;
          access_token_enc: string;
          refresh_token_enc: string;
          public_key?: string | null;
          scope?: string | null;
          live_mode?: boolean;
          expires_at: string;
          mp_nickname?: string | null;
          mp_email?: string | null;
          status?: MpConnectionStatus;
          fee_payer?: CardFeePayer;
          last_error?: string | null;
          connected_at?: string;
          updated_at?: string;
        };
        Update: {
          wedding_id?: string;
          mp_user_id?: string;
          access_token_enc?: string;
          refresh_token_enc?: string;
          public_key?: string | null;
          scope?: string | null;
          live_mode?: boolean;
          expires_at?: string;
          mp_nickname?: string | null;
          mp_email?: string | null;
          status?: MpConnectionStatus;
          fee_payer?: CardFeePayer;
          last_error?: string | null;
          connected_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      publish_payments: {
        Row: {
          id: string;
          wedding_id: string;
          provider: string;
          provider_charge_id: string | null;
          amount_cents: number;
          status: string;
          checkout_url: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          provider?: string;
          provider_charge_id?: string | null;
          amount_cents: number;
          status?: string;
          checkout_url?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          provider?: string;
          provider_charge_id?: string | null;
          amount_cents?: number;
          status?: string;
          checkout_url?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_generations: {
        Row: {
          id: string;
          wedding_id: string;
          model: string;
          briefing: Json;
          input_tokens: number | null;
          output_tokens: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          model: string;
          briefing?: Json;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          model?: string;
          briefing?: Json;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      gift_catalog: {
        Row: {
          id: string;
          category: string;
          title: string;
          description: string;
          price: number | null;
          image: string;
          image_source: string;
          sort: number;
          active: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      ai_attempts: {
        Row: { id: number; ip_hash: string; created_at: string };
        Insert: { id?: number; ip_hash: string; created_at?: string };
        Update: { id?: number; ip_hash?: string; created_at?: string };
        Relationships: [];
      };
      funnel_events: {
        Row: {
          id: number;
          created_at: string;
          user_id: string | null;
          wedding_id: string | null;
          event: string;
          level: "info" | "error";
          path: string | null;
          detail: Json;
        };
        Insert: {
          id?: never;
          created_at?: string;
          user_id?: string | null;
          wedding_id?: string | null;
          event: string;
          level?: "info" | "error";
          path?: string | null;
          detail?: Json;
        };
        Update: {
          user_id?: string | null;
          wedding_id?: string | null;
          event?: string;
          level?: "info" | "error";
          path?: string | null;
          detail?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      purge_funnel_ad_ids: { Args: Record<string, never>; Returns: undefined };
      mark_publish_paid: {
        Args: { p_charge_id: string; p_wedding_id: string; p_amount_cents?: number | null };
        Returns: boolean;
      };
      ai_claim_attempt: {
        Args: { p_ip_hash: string; p_per_ip: number; p_per_day: number };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
