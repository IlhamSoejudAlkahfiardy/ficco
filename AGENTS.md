<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ficco Invoice & Expense Management — Core Blueprint Directive

## Authoritative Specification & Source of Truth
- The primary PRD and Implementation Blueprint for this project is:
  **`docs/invoice-expense-prd-blueprint.md`**
- **MANDATORY FOR ALL TASKS**: Whenever designing, creating, refactoring, or reviewing code, architecture, database schemas, state management, or UI features:
  1. Always treat `docs/invoice-expense-prd-blueprint.md` as the authoritative source of truth.
  2. Consult the relevant sections of this document before writing or modifying code.
  3. Never contradict or deviate from the rules, schemas, and flows specified in the blueprint unless explicitly instructed by the user.

## Core Architecture & Guardrails
1. **Local-First Business Data (Zero-Knowledge Server)**:
   - Business data (Invoices, Expenses, Customers, Products, Payments, Reports) lives EXCLUSIVELY on the client device in **IndexedDB (via Dexie)**.
   - The server is NEVER the source of truth for business data. Never send or store tenant financial/business data in Supabase or server databases.
2. **Server Role**:
   - Next.js Route Handlers (`app/api/`) and Supabase are strictly limited to:
     - License validation & device activation
     - Admin management
     - Future delivery services (e.g. WhatsApp backup)
3. **State Management & Data Flow**:
   - UI Components → Feature Hooks → Feature Services / Repositories → Dexie / IndexedDB Infrastructure.
   - Global client UI state is managed via **Zustand**.
   - Forms use **React Hook Form** + **Zod** validation.
   - UI components MUST NOT execute raw Dexie queries directly; always encapsulate data access in repositories/hooks.
4. **Folder Structure Conventions**:
   - Feature-specific code: `features/<feature>/` (e.g., `invoices`, `expenses`, `customers`, `products`, `reports`, `settings`, `backup`, `license`).
   - Cross-feature / shared utilities: `shared/components/`, `shared/hooks/`, `shared/utils/`, `shared/types/`.
   - Core DB and storage infrastructure: `infrastructure/database/`, `infrastructure/storage/`, `infrastructure/pwa/`.
