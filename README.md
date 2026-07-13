# Disclaimer
I vibecoded it in its entirety. Use at your own risk.
# Collection Checklist (Offline)

Simple frontend-only web app that builds a visual checklist from:
- a list of item names
- local image files

No backend, no network calls, and no account required. Supports English and Ukrainian languages.

## Why This Shape

This project is intentionally lightweight:
- TypeScript + esbuild
- static files in `dist/`
- default progress stored in browser localStorage
- optional IndexedDB mode stores full checklist snapshot (names, checked state, image blobs)
- built-in multi-language support with i18n structure

## What You Were Missing

For this kind of offline app, these are key product decisions:
- Persistence scope: localStorage is browser-specific. Progress does not auto-sync across browsers/devices.
- Image persistence: in IndexedDB mode, image blobs are persisted and restored automatically.
- Dataset identity: progress must be keyed by a stable dataset signature so different collections do not overwrite each other.
- Portability: export/import progress JSON is useful when users move to another machine/browser.
- Matching rules: name-to-image matching needs a deterministic fallback when filenames do not line up exactly.

## Implemented Features

- Names input from textarea or TXT/CSV file
- Image input from multi-file picker
- Auto mapping:
	- filename stem <-> item name (normalized match)
	- fallback assignment by order for remaining unmatched images
- Responsive grid with image + checkbox per item
- Search filter and "missing only" toggle
- Progress summary (owned/total/missing)
- Progress persistence in localStorage
- IndexedDB mode for full-state persistence including images
- Progress export/import JSON
- Reset progress + clear view controls
- Multi-language support (English, Ukrainian) with language selector
- Optional manual cloud sync via Supabase (sign in, push, pull)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Build:

```bash
npm run build
```

3. Open `dist/index.html` in a browser.

## How To Use

1. Paste your item names (one per line) or load a TXT/CSV file.
2. Select item images (optional), then click `Build checklist`.
3. For each card:
	- toggle `Owned`
	- set `Count`
	- add a `Comment` (optional)
4. Use search and `Show missing only` to focus the list.
5. Keep `IndexedDB mode` enabled to restore full checklist state (including images) on next open.
6. Use `Export progress` / `Import progress` when moving progress between browsers or devices.

## Distribution With GitHub Pages

This repository is set up to auto-deploy to GitHub Pages using GitHub Actions.

### One-time setup

1. Push this repo to GitHub with default branch named main.
2. In GitHub, open Settings -> Pages.
3. Under Build and deployment, set Source to GitHub Actions.
4. Push to main (or run the workflow manually from Actions).

After deploy, your app URL will be:

- https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/

### What gets deployed

- Workflow file: `.github/workflows/pages.yml`
- Built output folder: `dist/`

The workflow runs npm ci, npm run build, and publishes dist as the Pages artifact.

### Update flow

1. Commit changes.
2. Push to main.
3. GitHub Pages updates automatically.

### Notes

- The app remains frontend-only and offline-capable after first load.
- IndexedDB and localStorage stay browser-local; they do not sync between devices automatically.

## Optional Manual Supabase Sync

Manual sync is available and disabled by default. Nothing syncs automatically.

### What gets synced

- Item names list
- Checked state by normalized item name

Images are not synced to Supabase in this mode.

### Supabase setup

1. Create a Supabase project.
2. In SQL editor, create auth-scoped sync table and policies:

```sql
create table if not exists public.checklist_sync (
	owner_id uuid not null references auth.users(id) on delete cascade,
	sync_key text not null,
  payload jsonb not null,
	updated_at timestamptz not null default now(),
	primary key (owner_id, sync_key)
);

alter table public.checklist_sync enable row level security;

drop policy if exists checklist_sync_select on public.checklist_sync;
drop policy if exists checklist_sync_insert on public.checklist_sync;
drop policy if exists checklist_sync_update on public.checklist_sync;
drop policy if exists checklist_sync_delete on public.checklist_sync;

create policy checklist_sync_select on public.checklist_sync
for select using (auth.uid() = owner_id);

create policy checklist_sync_insert on public.checklist_sync
for insert with check (auth.uid() = owner_id);

create policy checklist_sync_update on public.checklist_sync
for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy checklist_sync_delete on public.checklist_sync
for delete using (auth.uid() = owner_id);
```

3. In Authentication -> Providers, enable Email provider.
4. Open Project Settings -> API and copy:
	- Project URL
	- anon public key
5. Decide a long unique sync key for each collection group.

### App usage

1. Paste values into:
	- `Supabase project URL`
	- `Supabase anon key`
	- `Sync key`
2. Enter `Supabase email` and `Supabase password`.
3. Click `Sign up` once (if account does not exist), then `Sign in`.
4. Click `Connect Supabase`.
5. Click `Push to Supabase` to upload current state.
6. Click `Pull from Supabase` to fetch and apply saved state.
7. Click `Sign out` or `Disconnect Supabase` when done.

### Sync behavior

- Sync rows are scoped by authenticated `owner_id` plus `sync_key`.
- Sync is manual-only: no background or automatic push/pull.
- If pulled list differs from current checklist, the app asks before replacing local checklist.

## Project Structure

```
src/
  index.html          - UI shell with language selector
  styles.css          - responsive styling
  main.ts             - app logic, state handling, translation functions
  i18n/
    README.md         - localization guide and language extension docs
    en.ts             - English translations
    uk.ts             - Ukrainian translations
build.mjs             - esbuild script (bundles TypeScript, copies assets)
dist/                 - built output (HTML, CSS, JS)
```

## Language Support

The app ships with English and Ukrainian translations. Language preference is saved to localStorage and persists across sessions.

See [src/i18n/README.md](src/i18n/README.md) for detailed instructions on adding new languages.

## Notes

- This app is designed for offline local usage and works entirely in the browser.
- Language preference is stored in localStorage (`collection-checklist:language`).
- Checklist progress is keyed by a hash of normalized item names, so different collections do not overwrite each other.
- For large image sets, keep file sizes reasonable for smooth rendering and to avoid browser storage quotas.
- IndexedDB mode persists the full checklist state (names, progress, images) and enables restore on next visit.
- Manual Supabase sync is available but disabled by default—no data is uploaded automatically.