# Features Architecture & Boundary Rules

This directory contains domain-driven feature modules. Each feature is an isolated, cohesive module.

## Feature Modules:
- `dashboard/` - Metrics, summaries, business overview widgets
- `invoices/` - Invoicing logic, items, totals, payment statuses
- `expenses/` - Expense records, categories, receipt attachments
- `customers/` - Customer profiles, contact details, balance
- `products/` - Products/services catalogue, pricing, default taxes
- `reports/` - Financial summaries, cashflow, P&L calculations
- `settings/` - Local company profile, currency, invoice prefix, theme
- `backup/` - JSON export / import logic, encryption, schema versioning
- `license/` - Device activation, license key validation with server

## Module Rules:
1. **Private Folder Convention (`_`)**:
   All internal supporting folders must be prefixed with `_` (e.g. `_components/`, `_hooks/`, `_services/`, `_schemas/`, `_types/`, `_utils/`).
   This prevents Next.js App Router from treating them as routable pages.
2. **Public API (`index.ts`)**:
   Only export symbols intended for cross-feature access through the feature's root `index.ts`.
3. **No Direct UI-to-Database**:
   UI components must never call Dexie/IndexedDB directly. Always route through feature hooks and services/repositories.
4. **No Feature Dumping Grounds**:
   Feature-specific code stays strictly inside the respective feature module.
