# Infrastructure Layer

This directory contains low-level technical infrastructure, storage, and device services.

## Subdirectories:
- `database/`: Dexie database instance, tables, schema definitions, and migrations
- `pdf/`: Client-side invoice and receipt PDF generation utilities
- `storage/`: Browser persistence adapters, localStorage, OPFS, or file download utilities
- `pwa/`: Service worker registration, offline caching, and PWA install prompts

## Rules:
1. Business logic must not reside in infrastructure.
2. UI components must access infrastructure only through feature services/repositories, not via direct infrastructure calls.
3. Server secrets must never be placed in client-accessible infrastructure files.
