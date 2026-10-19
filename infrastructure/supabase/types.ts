/**
 * Supabase Database Schema Types for Ficco Licensing
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Step 21 & Section 16)
 */

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
      licenses: {
        Row: {
          id: string;
          license_key: string;
          used: boolean;
          created_at: string;
          customer_name: string | null;
          customer_email: string | null;
          activated_at: string | null;
          device_fingerprint: string | null;
        };
        Insert: {
          id?: string;
          license_key: string;
          used?: boolean;
          created_at?: string;
          customer_name?: string | null;
          customer_email?: string | null;
          activated_at?: string | null;
          device_fingerprint?: string | null;
        };
        Update: {
          id?: string;
          license_key?: string;
          used?: boolean;
          created_at?: string;
          customer_name?: string | null;
          customer_email?: string | null;
          activated_at?: string | null;
          device_fingerprint?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type LicenseRow = Database['public']['Tables']['licenses']['Row'];
export type LicenseInsert = Database['public']['Tables']['licenses']['Insert'];
export type LicenseUpdate = Database['public']['Tables']['licenses']['Update'];
