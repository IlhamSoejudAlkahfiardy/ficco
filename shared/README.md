# Shared Architecture & Boundaries

This directory contains reusable code shared across multiple independent features.

## Rules:
1. **Rule of Three / Proven Reuse**:
   Do not put code here simply because it "might" be reusable. Keep code inside `features/<feature>/` first. Only extract to `shared/` when genuinely shared across multiple features.
2. **Private Folder Convention (`_`)**:
   All internal folders are prefixed with `_`:
   - `_components/`: Reusable UI components (buttons, inputs, dialogs, tables)
   - `_hooks/`: Generic hooks (e.g. `useDebounce`, `useMediaQuery`)
   - `_utils/`: Formatters, calculation helpers, date helpers
   - `_types/`: Global/shared domain primitives and utility types
   - `_constants/`: Shared constants, route paths, configuration keys
3. **No Business Logic In Shared**:
   Shared components and utilities must be pure and agnostic to specific feature business rules.
