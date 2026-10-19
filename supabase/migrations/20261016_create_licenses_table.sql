-- ==============================================================================
-- Migration: Create licenses Table for Ficco License Database
-- Source of Truth: docs/invoice-expense-prd-blueprint.md (Step 21 & Section 16-19)
-- Purpose: Software license tracking and client device entitlement verification.
-- IMPORTANT: Business financial data (invoices, expenses, customers, reports)
-- lives 100% EXCLUSIVELY on client devices in IndexedDB (Zero-Knowledge Architecture).
-- ==============================================================================

-- 1. Create licenses table
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    customer_name TEXT,
    customer_email TEXT,
    activated_at TIMESTAMPTZ,
    device_fingerprint TEXT,

    -- Constraints
    CONSTRAINT licenses_license_key_unique UNIQUE (license_key),
    CONSTRAINT licenses_license_key_not_empty CHECK (length(trim(license_key)) > 0)
);

-- 2. Indexes for fast lookup during activation and admin listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_license_key_unique 
    ON public.licenses (license_key);

CREATE INDEX IF NOT EXISTS idx_licenses_used 
    ON public.licenses (used);

CREATE INDEX IF NOT EXISTS idx_licenses_created_at_desc 
    ON public.licenses (created_at DESC);

-- 3. Row Level Security (RLS) Strategy
-- RLS MUST be enabled. Direct access from anon/public clients is strictly forbidden.
-- The client must never query this table directly; all operations are routed through
-- Next.js Server Route Handlers (app/api/) using the SUPABASE_SERVICE_ROLE_KEY.
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Deny public anon access by default (Zero-Trust boundary)
DROP POLICY IF EXISTS "Deny public anon access" ON public.licenses;
CREATE POLICY "Deny public anon access" 
    ON public.licenses 
    FOR ALL 
    TO anon 
    USING (false);

-- Allow server-side service_role full administrative access
DROP POLICY IF EXISTS "Service role full access" ON public.licenses;
CREATE POLICY "Service role full access" 
    ON public.licenses 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Allow authenticated admin users (if Supabase Auth is enabled)
DROP POLICY IF EXISTS "Authenticated admin access" ON public.licenses;
CREATE POLICY "Authenticated admin access" 
    ON public.licenses 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- 4. Table and Column Documentation
COMMENT ON TABLE public.licenses IS 
    'Ficco license entitlements table. Only stores license keys and activation state. Never contains tenant business data.';

COMMENT ON COLUMN public.licenses.license_key IS 
    'Cryptographically generated unique license string issued to customer (e.g. FCC-XXXX-XXXX-XXXX-XXXX).';

COMMENT ON COLUMN public.licenses.used IS 
    'Boolean indicating whether the license has already been activated on a client device.';

COMMENT ON COLUMN public.licenses.activated_at IS 
    'Timestamp of when the customer successfully activated the license.';

COMMENT ON COLUMN public.licenses.device_fingerprint IS 
    'Optional device or browser installation identifier recorded at activation time.';
