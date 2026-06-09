# Huey & Cherry Wedding — Payments Tracker Web App

**Date:** 2026-06-09
**Status:** Approved design, ready for implementation plan

## Purpose

A fun, elegant web app for ~12 friends to track shared wedding expenses for Huey
& Cherry's wedding in Ormoc City, 2026. Gated behind a single shared password, it
greets each person with a short cinematic onboarding (with a playful dark-comedy
turn), then drops them on a dashboard where they pay their share of two expense
pools and upload photographic proof. Everyone can see who has paid and view their
proof.

The tone is elegant and warm (golden-hour beach wedding) with one intentional
tonal whiplash for the "collect your payments" joke.

## Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Backend/data:** Supabase (Postgres + Storage)
- **Hosting:** Vercel, deployed from `github.com/keithruezyl1/wedding`
- **Assets:** wedding photos in `assets/img/`, ghost-laugh sound in
  `assets/Ghost Laughing - Sound Effect.mp3`

## Auth model

Deliberately lightweight — there are no per-person passwords.

- One shared gate password: `HueyAndCherryWeddingWHAAAT`. Validated server-side
  (Next.js route handler) so the password is never shipped in the client bundle.
- After the gate, the person enters a display name. The name (trimmed,
  lowercased) **is** the account key:
  - New name → create an `accounts` row.
  - Existing name → load that account ("log back in").
- Session is remembered in `localStorage` so returning visitors skip the gate and
  onboarding and land on the dashboard.
- **Name collision decision:** if two people pick the same name, the second
  "becomes" the first account. Acceptable for 12 friends who know each other; no
  collision handling is built.

## Data model (Supabase Postgres)

### `accounts`
| column | type | notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| name | text | unique, lowercased account key |
| display_name | text | as the user typed it |
| created_at | timestamptz | default now() |

### `payments`
| column | type | notes |
|---|---|---|
| id | uuid | pk |
| account_id | uuid | fk → accounts.id |
| kind | text | `'fare'` or `'fee'` |
| proof_url | text | Supabase Storage path/public URL |
| created_at | timestamptz | default now() |

- Unique constraint on `(account_id, kind)` — one payment per person per item.
  Re-uploading overwrites the existing proof.

### Storage
- Public-read bucket `proofs`. Files keyed `proofs/{account_id}/{kind}.{ext}`.

## The math

- 12 people, fixed denominator.
- **Fare** total ₱18,000 → ₱1,500 per person.
- **Fee** total ₱10,560 → ₱880 per person.
- Each progress bar fills by `(# paid for that item / 12)`.
- Label format: e.g. `₱7,500 / ₱18,000 · 5 of 12 paid`.

## Screens & flow

1. **Gate** — full-bleed sunset photo, dark overlay, serif title "Huey & Cherry",
   single password field. Wrong password → gentle shake + "That's not quite it."
   Correct → fade to name entry.
2. **Name entry** — "What shall we call you?", one input + continue. Creates/loads
   the account.
3. **Onboarding (first visit only)** — three full-screen steps, calm cross-fades:
   - Step 1: "Hello, {name}" → fades to "You have been cordially invited to…"
   - Step 2: confetti; stylized text fades up "The Huey & Cherry Wedding · Ormoc
     City, 2026"
   - Step 3: fade to black; red text fades in "…now it's time to collect your
     payments." → ghost-laugh MP3 plays (unlocked by the user's tap into the
     step). Continue button → dashboard.
   - A discreet "replay intro" link on the dashboard re-runs the sequence.
4. **Dashboard** — two columns:
   - "The Boat to Neverland Fare" — ₱18,000, progress bar, "Pay the Fare" CTA,
     list of payers below. Click a name → modal with name + proof image.
   - "This House is a Home Fee" — ₱10,560, same structure, "Pay the Fee" CTA.
5. **Payment modal** — shows the person's share (₱1,500 / ₱880), file picker with
   image preview, required checkbox "I confirm I've paid and uploaded the correct
   proof" (Upload disabled until checked), then Upload.
6. **Success modal** — on-theme: soft gold confetti, "Thank you, {name}" / "Your
   contribution is recorded." The payer's name appears in that column's list.

## Theme & motion

- **Palette:** golden-hour sunset (amber/coral) accents, warm ivory/cream
  surfaces, deep charcoal text. Red + black appear only in the step-3 reveal.
- **Type:** elegant serif for headings (Cormorant/Playfair), clean sans for body.
- **Motion:** calm, slow (400–700ms eases), gentle fades/rises, no bounce except
  celebratory confetti. Respects `prefers-reduced-motion`.

## Error handling & edge cases

- Failed uploads → inline retry.
- Supabase/network errors → soft toast.
- Gate password and uploads validated server-side.
- Re-upload overwrites prior proof for that (account, kind).

## Out of scope (YAGNI)

- No admin panel.
- No editing/deleting others' payments.
- No per-person login passwords.
- No email/notifications.
- No hard cap enforcement on number of accounts (denominator is fixed at 12
  regardless).
