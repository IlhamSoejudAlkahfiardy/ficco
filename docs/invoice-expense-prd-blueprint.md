# Invoice & Expense Management --- PRD & Implementation Blueprint

> **Document status:** MVP Blueprint\
> **Architecture:** Local-first / offline-first web application\
> **Primary stack:** Next.js + React + TypeScript\
> **Persistence:** IndexedDB via Dexie\
> **Client state:** Zustand\
> **License backend:** Next.js Route Handlers + Supabase\
> **Deployment:** Customer app on Vercel\
> **Admin:** Same Next.js application, protected admin area\
> **MVP backup:** Full JSON export downloaded to the user's device\
> **Future backup:** WhatsApp delivery service

------------------------------------------------------------------------

## 1. Product Overview

### 1.1 Product concept

This product is a **local-first Invoice & Expense Management web
application** designed to run primarily on the user's own device.

The application is distributed through a web URL and can be used from
desktop and smartphone browsers. Business data is stored locally in the
user's browser using IndexedDB rather than in a central application
database.

The application should behave like a private business application:

-   Invoice data stays on the user's device.
-   Expense data stays on the user's device.
-   Customer and product data stays on the user's device.
-   Reports are calculated from local data.
-   The application should continue working when the internet is
    unavailable after the initial application/license activation.
-   The user can export the complete application dataset into a portable
    `.json` backup.
-   The user can later import that JSON into another browser/device.
-   The server is **not** the source of truth for business data.

The server-side portion exists primarily for:

1.  License management and activation.
2.  Admin operations.
3.  Future integrations such as WhatsApp backup.

### 1.2 Product positioning

The product should be positioned as:

> **Privacy-first, local-first Invoice & Expense Management Software.**

Avoid treating the product as a conventional cloud SaaS in the technical
architecture.

A conventional SaaS model is:

``` text
Browser → API → Cloud Database
```

This product is:

``` text
Browser
  ↓
React / Next.js
  ↓
Zustand
  ↓
Dexie
  ↓
IndexedDB
```

The server is intentionally minimized.

------------------------------------------------------------------------

# 2. Product Goals

## 2.1 Primary goals

The MVP must:

-   Provide professional invoice management.
-   Provide expense management.
-   Provide customer management.
-   Provide product/service management.
-   Provide business dashboard and reports.
-   Store business data locally.
-   Work offline after initial application access.
-   Support responsive desktop and mobile UI.
-   Support full JSON export.
-   Support full JSON import.
-   Provide basic license activation.
-   Provide an admin dashboard for managing licenses.
-   Follow DRY principles.
-   Follow high cohesion and low coupling.
-   Use established libraries instead of unnecessarily reinventing
    infrastructure.
-   Be maintainable by an AI coding agent.

## 2.2 Non-goals for MVP

The MVP will NOT implement:

-   WhatsApp backup.
-   Cloud synchronization of business data.
-   Multi-user collaboration.
-   Server-side invoice database.
-   Server-side expense database.
-   Online accounting synchronization.
-   Complex subscription billing.
-   Advanced license/device management.
-   Real-time collaboration.
-   Full accounting compliance engine.
-   Native Android/iOS application.

These can be added later.

------------------------------------------------------------------------

# 3. Core Architecture

## 3.1 High-level architecture

``` text
                         CUSTOMER
                            │
                            ▼
                    Next.js Web App
                            │
              ┌─────────────┴─────────────┐
              │                           │
        Client Components            Server Side
              │                           │
       ┌──────┼──────┐             ┌──────┴──────┐
       │      │      │             │             │
   Zustand  Dexie   UI          License API   Admin
                  Library           │
       │             │              ▼
       │             │          Supabase
       ▼             ▼
   IndexedDB      Browser
   Business       Storage
      Data
```

## 3.2 Data ownership

### Client-owned data

All of the following belong to the user's local database:

-   Company/business profile.
-   Customers.
-   Products/services.
-   Invoices.
-   Invoice items.
-   Payments.
-   Expenses.
-   Expense categories.
-   Tax settings.
-   Invoice settings.
-   Numbering settings.
-   User preferences.
-   Report-related source data.
-   Local application metadata required for the business application.

### Server-owned data

The server/database should contain only what is necessary for:

-   License records.
-   License status.
-   Admin authentication/session data.
-   Optional future commercial metadata.

The server must NOT become the source of truth for customer invoices or
expenses in the MVP.

------------------------------------------------------------------------

# 4. Technology Stack

## 4.1 Core

### Next.js

Use Next.js as the single application framework.

Reasons:

-   React-based.
-   Supports client and server components.
-   Supports Route Handlers.
-   Supports admin routes.
-   Supports API endpoints.
-   Avoids maintaining separate frontend/backend projects.
-   Can deploy the customer application as a web application on Vercel.

### TypeScript

TypeScript is mandatory.

Rules:

-   Avoid `any` unless technically unavoidable.
-   Prefer explicit domain types.
-   Reuse shared types.
-   Avoid duplicated interfaces across features.

------------------------------------------------------------------------

## 4.2 UI

Choose one primary component system and use it consistently.

Recommended:

-   Ant Design OR
-   shadcn/ui

Do not mix multiple UI component libraries without a strong reason.

The UI library should provide:

-   Buttons.
-   Inputs.
-   Selects.
-   Date pickers.
-   Tables.
-   Modal/dialog.
-   Drawer.
-   Dropdown.
-   Tabs.
-   Pagination.
-   Form controls.
-   Notifications.
-   Empty states.
-   Loading states.

The application should not recreate mature UI primitives manually.

------------------------------------------------------------------------

## 4.3 State management

### Zustand

Use Zustand for **client/application state**, not as the primary
persistent database.

Appropriate Zustand state:

-   Current company.
-   Current navigation state.
-   UI preferences.
-   Modal state.
-   Active filters.
-   Temporary form/application state.
-   License activation state.
-   Application session state.

Do NOT use Zustand as the source of truth for all business records.

Business records should live in IndexedDB.

------------------------------------------------------------------------

## 4.4 IndexedDB

### Dexie

Use Dexie as the IndexedDB abstraction.

Reason:

-   Cleaner API than raw IndexedDB.
-   Schema versioning.
-   Indexed queries.
-   Transactions.
-   Better maintainability.
-   Good fit for local-first applications.

Do not build a custom IndexedDB wrapper unless a real requirement
exists.

------------------------------------------------------------------------

## 4.5 Forms

### React Hook Form

Use React Hook Form for complex forms.

Use it for:

-   Invoice forms.
-   Customer forms.
-   Product forms.
-   Expense forms.
-   Business settings.
-   License forms where appropriate.

------------------------------------------------------------------------

## 4.6 Validation

### Zod

Use Zod for:

-   Form validation.
-   Imported JSON validation.
-   Backup schema validation.
-   API payload validation.
-   License API request validation.

Never blindly trust imported JSON.

------------------------------------------------------------------------

## 4.7 Dates

Use `date-fns`.

Do not create custom date manipulation utilities when `date-fns` already
provides the required operation.

------------------------------------------------------------------------

## 4.8 Charts

Use a mature chart library such as:

-   Recharts.

Do not implement chart rendering manually.

------------------------------------------------------------------------

## 4.9 PDF

Use a suitable client-side PDF library.

The exact library may be selected during implementation based on:

-   Browser compatibility.
-   PDF layout quality.
-   Bundle size.
-   Ability to render invoice layouts.
-   Mobile compatibility.

The invoice PDF generation must happen client-side for MVP.

------------------------------------------------------------------------

## 4.10 PWA / Offline

Use a mature Vite/Next-compatible PWA strategy rather than implementing
service-worker lifecycle manually unless required.

Required capabilities:

-   Web App Manifest.
-   Service worker.
-   Static asset caching.
-   Offline application shell.
-   Installable experience where supported.

Important:

PWA/offline caching is for application assets. Business persistence
remains IndexedDB.

------------------------------------------------------------------------

# 5. Architecture Principles

## 5.1 DRY

Avoid duplicated:

-   Business calculations.
-   Validation schemas.
-   Type definitions.
-   Formatting logic.
-   Database operations.
-   UI primitives.
-   Error handling.
-   Backup serialization.
-   Invoice numbering logic.

However, do not abstract code prematurely.

Use this rule:

> Duplicate locally first when the behavior is genuinely
> feature-specific. Extract only when reuse is real and stable.

------------------------------------------------------------------------

# 6. High Cohesion and Low Coupling

This is a mandatory architectural principle.

Every component, hook, utility, schema, type, and store must be placed
as close as possible to the feature that owns it.

### Bad

``` text
src/
├── components/
├── hooks/
├── utils/
├── stores/
├── types/
└── services/
```

This creates unrelated global folders that become dumping grounds.

### Preferred

``` text
src/
├── features/
│   ├── invoices/
│   │   ├── _components/
│   │   ├── _hooks/
│   │   ├── _schemas/
│   │   ├── _types/
│   │   ├── _utils/
│   │   ├── _services/
│   │   └── index.ts
│   │
│   ├── expenses/
│   │   ├── _components/
│   │   ├── _hooks/
│   │   ├── _services/
│   │   └── ...
│   ├── customers/
│   ├── products/
│   ├── reports/
│   ├── settings/
│   ├── backup/
│   └── license/
│
├── shared/
│   ├── _components/
│   ├── _hooks/
│   ├── _utils/
│   ├── _types/
│   └── _constants/
│
├── infrastructure/
│   ├── database/
│   ├── pdf/
│   ├── storage/
│   └── pwa/
│
└── app/
```

### Next.js Private Folder Convention (`_`)

Setiap folder internal pendukung pada modul/fitur (seperti components, hooks, utils, services, schemas, types) **wajib diawali dengan garis bawah (`_`)**, contohnya:
- `_components/`
- `_hooks/`
- `_utils/`
- `_services/`
- `_schemas/`
- `_types/`

**Tujuan:**
Next.js App Router secara default memperlakukan folder berawalan `_` sebagai **Private Folders**. Dengan aturan ini:
1. Folder dan file di dalamnya **tidak akan pernah dianggap atau di-route sebagai URL path** oleh Next.js, baik ketika diletakkan di dalam modul `src/features/` maupun jika di-collocate di dalam direktori `src/app/`.
2. Mencegah konflik atau tabrakan rute (routing collisions) yang tidak disengaja.
3. Mempertegas batas bahwa file-file tersebut merupakan implementasi internal modul.

### Placement rule

If something is only used by one feature:

``` text
features/invoices/_components/...
```

If it is genuinely reused by multiple unrelated features:

``` text
shared/_components/...
```

If it is infrastructure-related:

``` text
infrastructure/...
```

Do not move code into `shared` merely because it looks reusable.

------------------------------------------------------------------------

# 7. Proposed Project Structure

``` text
project-root/
│
├── app/
│   ├── (customer)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── _components/         <-- Private folder (tidak terbaca sbg route)
│   │   │   ├── _hooks/              <-- Private folder
│   │   │   └── _utils/              <-- Private folder
│   │   ├── expenses/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── (admin)/
│   │   └── sk-11312301239/
│   │       ├── login/
│   │       │   └── page.tsx
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── licenses/
│   │       │   ├── page.tsx
│   │       │   └── _components/
│   │       └── layout.tsx
│   │
│   └── api/
│       └── license/
│           ├── activate/
│           │   └── route.ts
│           └── validate/
│               └── route.ts
│
├── features/                        (modul domain terisolasi)
│   ├── dashboard/
│   ├── invoices/
│   │   ├── _components/
│   │   ├── _hooks/
│   │   ├── _schemas/
│   │   ├── _types/
│   │   ├── _utils/
│   │   ├── _services/
│   │   └── index.ts
│   ├── expenses/
│   │   ├── _components/
│   │   ├── _hooks/
│   │   ├── _services/
│   │   └── ...
│   ├── customers/
│   ├── products/
│   ├── reports/
│   ├── settings/
│   ├── backup/
│   └── license/
│
├── shared/
│   ├── _components/
│   ├── _hooks/
│   ├── _utils/
│   ├── _types/
│   └── _constants/
│
├── infrastructure/
│   ├── database/
│   │   ├── db.ts
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── pdf/
│   ├── pwa/
│   └── storage/
│
├── public/
│
├── tests/
│
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tsconfig.json
└── README.md
```

The exact structure may evolve, but the architectural rules must remain: **semua folder pembantu internal (components, hooks, utils, services) wajib diawali dengan tanda `_` agar aman dari routing Next.js App Router.**

------------------------------------------------------------------------

# 8. Domain Model

## 8.1 Company

``` text
Company
- id
- name
- legalName
- address
- phone
- email
- taxNumber
- logo
- currency
- createdAt
- updatedAt
```

MVP assumes one primary business context per installation, but the
schema should not unnecessarily prevent future multi-company support.

------------------------------------------------------------------------

## 8.2 Customer

``` text
Customer
- id
- name
- companyName
- email
- phone
- address
- taxNumber
- notes
- createdAt
- updatedAt
```

------------------------------------------------------------------------

## 8.3 Product / Service

``` text
Product
- id
- name
- description
- sku
- unit
- price
- taxRate
- active
- createdAt
- updatedAt
```

------------------------------------------------------------------------

## 8.4 Invoice

``` text
Invoice
- id
- invoiceNumber
- customerId
- issueDate
- dueDate
- status
- notes
- subtotal
- discount
- tax
- total
- createdAt
- updatedAt
```

Invoice items:

``` text
InvoiceItem
- id
- invoiceId
- productId
- description
- quantity
- unitPrice
- discount
- taxRate
- subtotal
- total
```

------------------------------------------------------------------------

## 8.5 Expense

``` text
Expense
- id
- categoryId
- description
- amount
- date
- paymentMethod
- notes
- createdAt
- updatedAt
```

------------------------------------------------------------------------

## 8.6 Expense Category

``` text
ExpenseCategory
- id
- name
- description
- active
```

------------------------------------------------------------------------

## 8.7 Payment

For MVP, keep payment handling simple.

``` text
Payment
- id
- invoiceId
- amount
- paymentDate
- paymentMethod
- notes
```

------------------------------------------------------------------------

# 9. Invoice Business Rules

The invoice module must centralize calculations.

Example:

``` text
itemSubtotal =
quantity × unitPrice

subtotal =
sum(itemSubtotal)

discount =
invoice-level discount

tax =
calculated based on configured tax rules

grandTotal =
subtotal - discount + tax
```

These calculations must not be duplicated across:

-   invoice form,
-   invoice preview,
-   invoice detail,
-   dashboard,
-   PDF,
-   reports.

Create a single domain calculation layer.

------------------------------------------------------------------------

# 10. Invoice Status

MVP statuses:

``` text
DRAFT
SENT
PAID
PARTIALLY_PAID
OVERDUE
CANCELLED
```

The status rules must be centralized.

Example:

``` text
PAID:
total paid >= invoice total

PARTIALLY_PAID:
0 < total paid < invoice total

OVERDUE:
current date > due date
AND
invoice is not fully paid
```

------------------------------------------------------------------------

# 11. Dashboard

The dashboard should provide an overview of local business data.

Minimum metrics:

-   Total revenue.
-   Total expenses.
-   Net income.
-   Outstanding invoices.
-   Paid invoices.
-   Overdue invoices.
-   Recent invoices.
-   Recent expenses.

Time filters:

-   This month.
-   Last month.
-   This year.
-   Custom date range.

Dashboard calculations must derive from IndexedDB data.

No server request should be required for dashboard business data.

------------------------------------------------------------------------

# 12. Reports

MVP reports:

### Revenue Report

-   Revenue by date.
-   Revenue by month.
-   Paid invoice total.

### Expense Report

-   Expenses by category.
-   Expenses by date.
-   Expenses by month.

### Profit Summary

``` text
Revenue
- Expenses
= Net Profit
```

Reports should support:

-   Date filtering.
-   Basic chart.
-   Table view.
-   Export where practical.

------------------------------------------------------------------------

# 13. Backup / Restore Architecture

## 13.1 MVP requirement

The application must support complete data export as a single JSON file.

Example:

``` text
invoice-app-backup-2026-09-24.json
```

The export must include all business data required to reconstruct the
user's application state.

------------------------------------------------------------------------

## 13.2 Backup schema

Example:

``` json
{
  "format": "invoice-app-backup",
  "schemaVersion": 1,
  "appVersion": "1.0.0",
  "exportedAt": "2026-09-24T00:00:00.000Z",
  "data": {
    "companies": [],
    "customers": [],
    "products": [],
    "invoices": [],
    "invoiceItems": [],
    "expenses": [],
    "expenseCategories": [],
    "payments": [],
    "settings": []
  }
}
```

Never export arbitrary internal Zustand state.

The export format is a deliberate public data contract.

------------------------------------------------------------------------

## 13.3 Import flow

``` text
Select JSON
    ↓
Parse JSON
    ↓
Validate structure with Zod
    ↓
Validate schemaVersion
    ↓
Show import summary
    ↓
Ask for confirmation
    ↓
Write transactionally to IndexedDB
    ↓
Refresh application state
```

If validation fails:

-   Do not modify existing data.
-   Show a clear error.
-   Preserve current database state.

------------------------------------------------------------------------

## 13.4 Schema versioning

The backup format must include:

``` text
schemaVersion
```

Future versions may require migration:

``` text
Backup v1
   ↓
Migration
   ↓
Current schema
```

Do not silently import incompatible data.

------------------------------------------------------------------------

# 14. Automatic Backup

MVP automatic backup should be interpreted carefully.

Browsers cannot guarantee execution at an exact time when the
application is completely closed.

Therefore:

### MVP

Provide:

-   Manual backup.
-   Optional automatic backup while the application is active.
-   Last backup timestamp.
-   Backup reminder.

Do not promise guaranteed scheduled background downloads while the
browser is closed.

Future versions may explore platform-specific mechanisms.

------------------------------------------------------------------------

# 15. License System

## 15.1 MVP requirement

License records only need a simple state:

``` text
used: boolean
```

MVP does not require:

-   subscription billing.
-   device limits.
-   expiration.
-   complex activation history.
-   advanced anti-piracy.
-   automated payment verification.

------------------------------------------------------------------------

# 16. License Database

Supabase table:

``` text
licenses
```

Suggested MVP columns:

``` text
id
license_key
used
created_at
```

Optional administrative metadata:

``` text
customer_name
customer_email
transaction_reference
```

Do not add complexity unless needed.

------------------------------------------------------------------------

# 17. License generation

Admin flow:

``` text
Customer sends proof of payment
        ↓
Admin opens admin dashboard
        ↓
Create License
        ↓
System generates unique license string
        ↓
Save to Supabase
        ↓
used = false
        ↓
Admin copies license
        ↓
Admin sends license to customer manually
```

License generation must use cryptographically strong random generation
rather than predictable counters.

------------------------------------------------------------------------

# 18. License activation

Customer:

``` text
Open application
      ↓
License screen
      ↓
Enter license string
      ↓
POST /api/license/activate
      ↓
Server checks Supabase
      ↓
If exists AND used=false
      ↓
Set used=true
      ↓
Return success
```

If:

``` text
license does not exist
```

or:

``` text
used=true
```

return an appropriate failure response.

The client must not directly query the Supabase `licenses` table.

------------------------------------------------------------------------

# 19. License security boundary

The license system is intended to prevent normal unauthorized usage.

It is not a perfect DRM system.

Because the application runs in the customer's browser, a technically
advanced user can inspect client-side code.

Do not store:

-   Supabase service keys.
-   WhatsApp secrets.
-   Private API credentials.
-   Admin credentials.

inside client-side JavaScript.

All secrets remain server-side.

------------------------------------------------------------------------

# 20. Admin System

Admin is a private internal area.

Example route:

``` text
/sk-11312301239/admin
```

The obscure route is only an additional layer of obscurity.

Authentication remains mandatory.

------------------------------------------------------------------------

## 20.1 Admin authentication

MVP:

-   One admin account.
-   Login page.
-   Secure session.
-   Protected admin routes.
-   Logout.

Do not expose admin credentials in source code.

Use environment variables or a proper server-side authentication
mechanism.

------------------------------------------------------------------------

# 21. Admin Dashboard

Minimum dashboard:

``` text
Total Licenses
Unused Licenses
Used Licenses
```

Example:

``` text
Licenses
-------------------------
Total       125
Available    37
Used         88
```

------------------------------------------------------------------------

# 22. Admin License Management

Required operations:

### Add License

-   Generate license.
-   Save to Supabase.
-   Display generated key.
-   Allow copy.

### List Licenses

Columns:

``` text
License
Status
Created At
Customer
Actions
```

### Delete License

Admin confirmation required.

### Mark Used / Unused

MVP requires the ability to manually change:

``` text
used = true
used = false
```

This is useful for support and recovery.

------------------------------------------------------------------------

# 23. Customer Application License State

After successful activation, the application should remember activation
locally.

However, do not rely only on:

``` text
localStorage.setItem("isLicensed", "true")
```

Use a dedicated license store and clear separation between:

-   license input,
-   activation response,
-   local application state.

The application should not need to contact the server for every business
operation.

------------------------------------------------------------------------

# 24. Offline Behavior

After successful activation and application installation/caching:

### Must work offline

-   Dashboard.
-   Invoice creation.
-   Invoice editing.
-   Invoice viewing.
-   Expense creation.
-   Expense editing.
-   Customer management.
-   Product management.
-   Reports.
-   PDF generation.
-   JSON export.
-   JSON import.
-   Local settings.

### Requires internet

MVP:

-   Initial application download.
-   License activation.
-   Future license operations if required.

Future:

-   WhatsApp backup.
-   Application update checks.

------------------------------------------------------------------------

# 25. PWA Requirements

The application should be installable where supported.

Requirements:

-   Manifest.
-   Application icon.
-   App name.
-   Theme color.
-   Standalone display.
-   Service worker.
-   Cache application shell/static assets.

The PWA layer must never become the primary business data store.

------------------------------------------------------------------------

# 26. Responsive Design

The application must support:

-   Desktop.
-   Tablet.
-   Mobile.

Do not simply shrink desktop tables onto mobile.

Mobile-specific adaptations may include:

-   Card layouts.
-   Horizontal scrolling for unavoidable tables.
-   Bottom navigation for major actions.
-   Drawer navigation.
-   Mobile-friendly forms.
-   Sticky action buttons where useful.

Invoice creation must remain usable on a smartphone.

------------------------------------------------------------------------

# 27. Error Handling

Every major operation needs predictable error handling.

Examples:

-   Database read failure.
-   Database write failure.
-   Import validation failure.
-   Export failure.
-   License activation failure.
-   Network failure.
-   Unexpected application error.

Use a consistent error model.

Do not scatter arbitrary:

``` ts
alert("error")
```

throughout the application.

Use the UI library's notification/message system.

------------------------------------------------------------------------

# 28. Loading and Empty States

Every asynchronous or database-driven screen should consider:

### Loading

``` text
Loading invoices...
```

### Empty

``` text
No invoices yet.

[Create Invoice]
```

### Error

``` text
Unable to load invoices.

[Retry]
```

These states are part of the UX requirements, not optional polish.

------------------------------------------------------------------------

# 29. Database Rules

Database access should not be performed directly from arbitrary
components.

Avoid:

``` tsx
function InvoicePage() {
  const invoices = await db.invoices.toArray()
}
```

Prefer feature-specific data access:

``` text
features/invoices/
├── services/
│   └── invoiceRepository.ts
```

Then UI/hooks consume the repository.

This makes the database implementation replaceable and keeps components
focused on presentation.

------------------------------------------------------------------------

# 30. Repository Pattern

Recommended:

``` text
Invoice UI
   ↓
Invoice Hook
   ↓
Invoice Repository
   ↓
Dexie
   ↓
IndexedDB
```

For example:

``` text
useInvoices()
    ↓
invoiceRepository.list()
    ↓
db.invoices...
```

The UI should not know how IndexedDB works.

------------------------------------------------------------------------

# 31. Feature Boundary Rules

### Invoices feature may know about:

-   Invoice.
-   InvoiceItem.
-   Customer reference.
-   Product reference.
-   Invoice calculation.

### Expenses feature may know about:

-   Expense.
-   ExpenseCategory.

### Reports may read domain repositories but should not duplicate business calculations.

### Backup may access repositories/database export functions, but should not implement invoice business logic.

------------------------------------------------------------------------

# 32. Testing Strategy

MVP should include tests for high-risk business logic.

Priority:

1.  Invoice total calculation.
2.  Tax calculation.
3.  Discount calculation.
4.  Payment status.
5.  Backup serialization.
6.  Backup validation.
7.  Import behavior.
8.  License activation API.
9.  License used/unused behavior.

UI tests should be added where they provide meaningful value.

Do not chase arbitrary test coverage percentages.

------------------------------------------------------------------------

# 33. Implementation Steps

The implementation must follow small, verifiable milestones.

Do not implement the entire product in one pass.

------------------------------------------------------------------------

## Step 1 --- Initialize repository

Tasks:

-   Create Next.js project.
-   Enable TypeScript.
-   Configure package manager.
-   Configure linting.
-   Configure formatting.
-   Configure import aliases.
-   Initialize Git.
-   Create baseline README.
-   Verify development server.

Acceptance criteria:

-   Project runs locally.
-   TypeScript works.
-   Lint passes.
-   Build passes.

------------------------------------------------------------------------

## Step 2 --- Install core dependencies

Install only required dependencies.

Initial candidates:

``` text
zustand
dexie
react-hook-form
zod
date-fns
recharts
```

Plus chosen UI library and appropriate PWA/PDF dependencies.

Acceptance criteria:

-   Dependencies installed.
-   No unnecessary duplicate libraries.
-   Application still builds.

------------------------------------------------------------------------

## Step 3 --- Establish architecture

Create:

``` text
features/
shared/
infrastructure/
app/
```

Create initial feature folders:

``` text
dashboard
invoices
expenses
customers
products
reports
settings
backup
license
```

Acceptance criteria:

-   No global dumping-ground folders such as `src/hooks` for
    feature-specific hooks.
-   Architecture documented.
-   Import boundaries understood.

------------------------------------------------------------------------

## Step 4 --- Build application shell

Implement:

-   Main layout.
-   Sidebar desktop.
-   Mobile navigation.
-   Header.
-   Content area.
-   Theme.
-   Responsive layout.
-   Basic route structure.

Acceptance criteria:

-   All major pages can be navigated.
-   Mobile layout works.
-   No business logic yet.

------------------------------------------------------------------------

## Step 5 --- Implement IndexedDB/Dexie foundation

Tasks:

-   Create Dexie database.
-   Define initial schema.
-   Create migrations/versioning strategy.
-   Create repositories.
-   Create database error handling.

Acceptance criteria:

-   Database initializes.
-   CRUD can be tested.
-   Database versioning exists.

------------------------------------------------------------------------

## Step 6 --- Implement company/business settings

Tasks:

-   Business profile.
-   Logo.
-   Address.
-   Contact information.
-   Tax number.
-   Currency.
-   Invoice defaults.

Acceptance criteria:

-   Settings persist after refresh.
-   Settings persist after closing/reopening browser.
-   Settings remain available offline.

------------------------------------------------------------------------

## Step 7 --- Implement customer management

Tasks:

-   Customer list.
-   Search.
-   Create customer.
-   Edit customer.
-   Delete customer.
-   Customer detail.
-   Form validation.

Acceptance criteria:

-   Full CRUD works.
-   Data persists in IndexedDB.
-   Mobile UI works.

------------------------------------------------------------------------

## Step 8 --- Implement product/service management

Tasks:

-   Product/service list.
-   Create.
-   Edit.
-   Delete.
-   Price.
-   SKU.
-   Unit.
-   Tax rate.
-   Active/inactive state.

Acceptance criteria:

-   Full CRUD.
-   Invoice can reference products.

------------------------------------------------------------------------

## Step 9 --- Implement invoice domain

Tasks:

-   Invoice schema.
-   Invoice item schema.
-   Number generation.
-   Calculation functions.
-   Discount calculation.
-   Tax calculation.
-   Total calculation.
-   Status calculation.

Acceptance criteria:

-   Unit tests cover calculation logic.
-   No calculation logic duplicated in UI.

------------------------------------------------------------------------

## Step 10 --- Implement invoice creation

Tasks:

-   Select customer.
-   Add items.
-   Quantity.
-   Unit price.
-   Discount.
-   Tax.
-   Notes.
-   Dates.
-   Save draft.
-   Validate form.

Acceptance criteria:

-   User can create an invoice.
-   Invoice persists.
-   Totals are correct.

------------------------------------------------------------------------

## Step 11 --- Implement invoice list/detail

Tasks:

-   List.
-   Search.
-   Filter.
-   Pagination if required.
-   Detail page.
-   Status badge.
-   Edit.
-   Delete/cancel.

Acceptance criteria:

-   Invoice lifecycle is usable.

------------------------------------------------------------------------

## Step 12 --- Implement payments

Tasks:

-   Record payment.
-   Partial payment.
-   Full payment.
-   Payment history.
-   Automatic status update.

Acceptance criteria:

``` text
0 payment → unpaid/open
partial → partially paid
full → paid
past due + unpaid → overdue
```

------------------------------------------------------------------------

## Step 13 --- Implement invoice PDF

Tasks:

-   Invoice preview.
-   PDF generation.
-   Company information.
-   Customer information.
-   Invoice items.
-   Totals.
-   Notes.
-   Payment information.

Acceptance criteria:

-   PDF can be generated offline.
-   PDF is readable on desktop and mobile.

------------------------------------------------------------------------

## Step 14 --- Implement expense management

Tasks:

-   Expense categories.
-   Expense CRUD.
-   Date.
-   Amount.
-   Payment method.
-   Notes.
-   Search/filter.

Acceptance criteria:

-   Expense data persists locally.
-   Expense calculations are correct.

------------------------------------------------------------------------

## Step 15 --- Implement dashboard

Tasks:

-   Revenue.
-   Expenses.
-   Profit.
-   Outstanding invoices.
-   Overdue invoices.
-   Recent invoices.
-   Recent expenses.
-   Date filters.

Acceptance criteria:

-   Dashboard is derived from local database.
-   No server request is required.

------------------------------------------------------------------------

## Step 16 --- Implement reports

Tasks:

-   Revenue report.
-   Expense report.
-   Profit summary.
-   Date filtering.
-   Charts.
-   Tables.

Acceptance criteria:

-   Reports correctly reflect IndexedDB data.
-   Changing filters updates results.

------------------------------------------------------------------------

## Step 17 --- Implement JSON export

Tasks:

-   Read all relevant IndexedDB tables.
-   Construct versioned backup schema.
-   Serialize JSON.
-   Generate filename.
-   Trigger browser download.

Acceptance criteria:

-   One JSON file contains all required business data.
-   Export works offline.
-   Exported JSON is valid.

------------------------------------------------------------------------

## Step 18 --- Implement JSON import

Tasks:

-   File picker.
-   JSON parsing.
-   Zod validation.
-   Schema version validation.
-   Import preview.
-   Confirmation.
-   Transactional database replacement/merge strategy.

MVP recommendation:

> Import should replace the current dataset only after explicit
> confirmation.

Acceptance criteria:

-   Invalid file never corrupts current data.
-   Valid backup restores data correctly.

------------------------------------------------------------------------

## Step 19 --- Implement backup UX

Create:

``` text
Settings
  → Data Management
```

Actions:

``` text
Export All Data
Import Data
```

Display:

``` text
Last Backup
Backup File Format
Data Size
```

Acceptance criteria:

-   Backup workflow is understandable without documentation.

------------------------------------------------------------------------

## Step 20 --- Implement PWA/offline support

Tasks:

-   Manifest.
-   Icons.
-   Service worker.
-   Static asset caching.
-   Offline fallback.
-   Install experience.

Acceptance criteria:

1.  Open application online.
2.  Load application.
3.  Disable internet.
4.  Refresh.
5.  Application still opens.
6.  Existing local data remains available.

------------------------------------------------------------------------

## Step 21 --- Implement license database

Create Supabase project/table.

MVP schema:

``` text
licenses
- id
- license_key
- used
- created_at
- customer_name
- customer_email
```

Acceptance criteria:

-   Table exists.
-   RLS/security strategy is defined.
-   Service credentials remain server-side.

------------------------------------------------------------------------

## Step 22 --- Implement admin authentication

Tasks:

-   Admin login.
-   Secure session.
-   Protected admin layout.
-   Logout.
-   Unauthorized redirect.

Acceptance criteria:

-   Unauthenticated user cannot access admin pages.
-   Admin can log in and log out.
-   Credentials are not hardcoded into client code.

------------------------------------------------------------------------

## Step 23 --- Implement admin dashboard

Display:

-   Total licenses.
-   Used licenses.
-   Unused licenses.

Acceptance criteria:

-   Statistics reflect Supabase data.

------------------------------------------------------------------------

## Step 24 --- Implement add license

Tasks:

-   Generate secure random license string.
-   Insert into Supabase.
-   Set `used=false`.
-   Show generated license.
-   Copy button.

Acceptance criteria:

-   Every generated license is unique.
-   New license starts unused.

------------------------------------------------------------------------

## Step 25 --- Implement license list

Tasks:

-   List.
-   Search.
-   Used/unused filter.
-   Copy license.
-   Delete license.
-   Toggle used state.

Acceptance criteria:

-   Admin can manage licenses completely.

------------------------------------------------------------------------

## Step 26 --- Implement customer license activation

Tasks:

-   Activation screen.
-   Input validation.
-   API request.
-   Server-side Supabase lookup.
-   Reject missing license.
-   Reject used license.
-   Mark valid license as used.
-   Return activation success.

Acceptance criteria:

``` text
unused valid license → activation succeeds
used license → activation fails
unknown license → activation fails
```

------------------------------------------------------------------------

## Step 27 --- Implement local license state

Tasks:

-   Create dedicated license Zustand store.
-   Persist activation state appropriately.
-   Separate license state from business data.
-   Handle activation success/failure.

Acceptance criteria:

-   User does not need to enter license on every page load.
-   Application can operate offline after successful activation.

------------------------------------------------------------------------

## Step 28 --- Protect application access

Determine the exact UX for:

``` text
Not activated
      ↓
License screen
```

versus:

``` text
Activated
      ↓
Application
```

Do not unnecessarily contact the license server during every local
operation.

------------------------------------------------------------------------

## Step 29 --- Add offline/online boundary handling

Create explicit distinction:

``` text
Local features:
always available

Server features:
require network
```

MVP server-dependent operations:

-   License activation.

Future:

-   WhatsApp backup.

Acceptance criteria:

-   Offline business operations do not accidentally fail because the
    license server is unavailable.

------------------------------------------------------------------------

## Step 30 --- Security review

Check:

-   No Supabase service key in client bundle.
-   No admin password in source.
-   No secret API credentials in client code.
-   Admin routes protected.
-   License endpoint validates input.
-   Imported JSON validated.
-   Database writes validated.
-   No unsafe HTML rendering.
-   No sensitive data unnecessarily logged.

------------------------------------------------------------------------

## Step 31 --- Data integrity review

Test:

-   Refresh during normal use.
-   Close/reopen browser.
-   Offline use.
-   Large dataset.
-   Export.
-   Import.
-   Import malformed JSON.
-   Import old schema.
-   Delete/recreate data.
-   Browser storage persistence.

------------------------------------------------------------------------

## Step 32 --- Responsive QA

Test:

-   Desktop Chrome.
-   Desktop Edge.
-   Android Chrome.
-   iOS Safari where available.

Focus on:

-   Invoice form.
-   Invoice table.
-   Expense form.
-   Dashboard.
-   Reports.
-   Settings.
-   Backup/import UI.

------------------------------------------------------------------------

## Step 33 --- Production deployment

Deploy the Next.js application to Vercel.

Configure:

-   Production domain.
-   Environment variables.
-   Supabase credentials.
-   Production database.
-   HTTPS.
-   PWA metadata.

The production application must not require a business-data API.

------------------------------------------------------------------------

## Step 34 --- Production license testing

Test the complete commercial flow:

``` text
Admin
 ↓
Create license
 ↓
Send license manually
 ↓
Customer opens app
 ↓
Enter license
 ↓
Activation
 ↓
Create invoice
 ↓
Go offline
 ↓
Continue using app
 ↓
Export JSON
 ↓
Import JSON into another browser
```

------------------------------------------------------------------------

## Step 35 --- MVP release checklist

Before release:

### Application

-   [ ] Responsive.
-   [ ] PWA works.
-   [ ] Offline application shell works.
-   [ ] IndexedDB persists data.
-   [ ] Invoice CRUD works.
-   [ ] Expense CRUD works.
-   [ ] Customer CRUD works.
-   [ ] Product CRUD works.
-   [ ] Dashboard works.
-   [ ] Reports work.
-   [ ] PDF works.
-   [ ] JSON export works.
-   [ ] JSON import works.

### License

-   [ ] Admin login works.
-   [ ] Admin dashboard works.
-   [ ] Add license works.
-   [ ] Delete license works.
-   [ ] Toggle used/unused works.
-   [ ] Customer activation works.
-   [ ] Invalid license rejected.
-   [ ] Used license rejected.

### Security

-   [ ] No server secret in browser.
-   [ ] Admin protected.
-   [ ] API payload validation.
-   [ ] Import validation.
-   [ ] No sensitive logging.

### Deployment

-   [ ] Production domain.
-   [ ] HTTPS.
-   [ ] Supabase production configuration.
-   [ ] Vercel environment variables.
-   [ ] Production build succeeds.

------------------------------------------------------------------------

# 36. Future Roadmap

Do not implement these before MVP unless there is a concrete reason.

## V1.1

-   Better backup UX.
-   Automatic backup reminders.
-   More report exports.
-   CSV export.
-   Improved invoice templates.
-   Multiple invoice templates.

## V1.2

-   WhatsApp backup.
-   Cloud drive backup.
-   Backup history.
-   Backup encryption.

## V1.3

-   Multiple businesses.
-   Multiple currencies.
-   Advanced tax configuration.
-   Recurring invoices.

## V2

-   Subscription licensing.
-   Device management.
-   Customer self-service license portal.
-   Automated payment verification.
-   Optional cloud synchronization.
-   Team collaboration.

------------------------------------------------------------------------

# 37. WhatsApp Backup --- Future Architecture

Not part of MVP.

Future flow:

``` text
User
  ↓
Export all local data
  ↓
Generate JSON in browser
  ↓
POST /api/backup/whatsapp
  ↓
Server validates license
  ↓
Server creates temporary file
  ↓
WhatsApp provider/API
  ↓
Customer WhatsApp
  ↓
Temporary file deleted
```

Important:

The server should not become a permanent business-data repository.

If temporary processing is required:

``` text
Receive
  ↓
Process
  ↓
Send
  ↓
Delete
```

------------------------------------------------------------------------

# 38. Future Automatic Backup

Do not promise exact scheduled downloads while the browser is closed.

Possible future strategies:

-   Backup while application is active.
-   PWA/background capabilities where browser/platform support is
    sufficient.
-   Optional cloud backup.
-   Optional server-side backup initiated by explicit user action.

------------------------------------------------------------------------

# 39. AI Agent Development Rules

This document is also a guardrail for AI-assisted implementation.

The AI agent must follow these rules:

## Rule 1 --- Do not change architecture without approval

Do not introduce:

-   Express.
-   Laravel.
-   Separate backend.
-   Central business database.
-   Firebase.
-   Supabase business-data storage.

unless explicitly requested.

------------------------------------------------------------------------

## Rule 2 --- Local-first is mandatory

Business data must remain client-side.

Do not create API endpoints for:

``` text
/invoices
/expenses
/customers
/products
```

unless explicitly approved for a future cloud-sync feature.

------------------------------------------------------------------------

## Rule 3 --- Use libraries where appropriate

Prefer established libraries for:

-   State.
-   Forms.
-   Validation.
-   IndexedDB.
-   Dates.
-   Charts.
-   PDF.
-   PWA.

Do not reinvent mature infrastructure.

------------------------------------------------------------------------

## Rule 4 --- Keep feature ownership local

Before creating:

``` text
shared/hooks
shared/utils
shared/components
```

ask:

> Is this actually used by multiple independent features?

If not, keep it inside the owning feature.

------------------------------------------------------------------------

## Rule 5 --- Do not over-abstract

Avoid:

``` text
UniversalComponentFactory
GenericRepositoryFactoryFactory
AbstractServiceManager
```

unless there is a real repeated use case.

Prefer simple, readable abstractions.

------------------------------------------------------------------------

## Rule 6 --- Business logic must be centralized

Calculations such as:

-   Invoice total.
-   Tax.
-   Discount.
-   Payment status.
-   Report calculations.

must have one authoritative implementation.

------------------------------------------------------------------------

## Rule 7 --- Database access must be isolated

Components should not contain raw Dexie queries.

Prefer:

``` text
Component
  ↓
Hook
  ↓
Feature repository/service
  ↓
Dexie
  ↓
IndexedDB
```

------------------------------------------------------------------------

## Rule 8 --- Backup format is a public contract

Never casually change:

``` text
schemaVersion
```

or backup structure.

Any breaking change requires:

-   version increment.
-   migration strategy.
-   import compatibility decision.

------------------------------------------------------------------------

## Rule 9 --- Preserve offline functionality

Before adding a server dependency, ask:

> Does this feature genuinely require a server?

If not, implement it locally.

------------------------------------------------------------------------

## Rule 10 --- Never expose secrets

Client-side code must never contain:

-   Supabase service role key.
-   Admin secret.
-   WhatsApp API secret.
-   Private server credentials.

------------------------------------------------------------------------

# 40. Definition of Done

A feature is complete only when:

1.  It has a clear feature owner.
2.  Its UI is responsive.
3.  Its state management is appropriate.
4.  Its data persists correctly.
5.  Its validation exists.
6.  Loading state exists where applicable.
7.  Empty state exists where applicable.
8.  Error handling exists.
9.  It works offline if it is a local feature.
10. It does not duplicate business logic.
11. It does not introduce unnecessary coupling.
12. TypeScript has no avoidable errors.
13. Lint/build passes.
14. High-risk business logic has tests.
15. The implementation does not violate this blueprint.

------------------------------------------------------------------------

# 41. MVP Priority

If development time becomes limited, implement in this order:

``` text
P0 — Foundation
├── Next.js
├── TypeScript
├── UI library
├── Zustand
├── Dexie
├── architecture
└── PWA

P1 — Core business
├── Company settings
├── Customers
├── Products
├── Invoices
├── Invoice items
├── Payments
└── Expenses

P2 — Business intelligence
├── Dashboard
├── Reports
└── PDF

P3 — Data safety
├── JSON export
└── JSON import

P4 — Commercial system
├── Admin login
├── Admin dashboard
├── License CRUD
└── License activation

P5 — Production
├── Offline QA
├── Responsive QA
├── Security review
└── Vercel deployment

P6 — Future
└── WhatsApp backup
```

------------------------------------------------------------------------

# 42. Final Architectural Principle

The most important principle of this product is:

> **The browser is the application runtime and IndexedDB is the user's
> business database.**

The server exists only where the browser cannot or should not be
responsible for the task.

``` text
                 CUSTOMER DEVICE
        ┌───────────────────────────────┐
        │                               │
        │        Next.js / React        │
        │               │               │
        │           Zustand             │
        │               │               │
        │             Dexie             │
        │               │               │
        │          IndexedDB            │
        │               │               │
        │     ALL BUSINESS DATA         │
        │                               │
        └───────────────┬───────────────┘
                        │
                 Optional network
                        │
                        ▼
              ┌──────────────────┐
              │    Next.js API   │
              ├──────────────────┤
              │ License          │
              │ Future Backup    │
              └────────┬─────────┘
                       │
                 ┌─────┴─────┐
                 ▼           ▼
              Supabase    WhatsApp
              License     (future)
                DB
```

The product should remain useful even if the server is temporarily
unavailable after activation.

That is the defining characteristic of the architecture:

> **Local-first, offline-first, privacy-oriented, with a minimal server
> boundary.**
