# PRD — Huey & Cherry Wedding Payments App

> **Status:** Source of truth for *what* we build. Pair with `DesignGuidelines.md`
> (the *how it looks & moves*). When code and these docs disagree, these docs win —
> update them first, then the code.
>
> **Last updated:** 2026-06-09

---

## 1. Overview

A private, password-gated web app for ~12 friends to track and settle their shares
of two shared wedding expenses for **Huey & Cherry's wedding in Ormoc City, 2026**.
Each person enters through a single shared password, is greeted by a short cinematic
onboarding (with a deliberate dark-comedy turn), then lands on a dashboard where they
pay their share of each expense pool and upload photographic proof. Everyone can see
who has paid and view each other's proof.

The product is equal parts utility and gift: it must *feel* elegant and intentional,
like a wedding invitation that happens to collect money.

---

## 2. Goals & Non-Goals

### Goals
- Let 12 friends each pay a fixed share of two pools and prove it with a photo.
- Make collective progress visible and motivating (progress bars + payer lists).
- Deliver a memorable, elegant, emotionally-warm experience with one funny beat.
- Be trivially easy to get into (one shared password, then just a name).

### Non-Goals (YAGNI)
- No per-person passwords, email, or real authentication.
- No admin panel; no editing or deleting other people's payments.
- No payment processing — money moves outside the app; we only track proof.
- No notifications, comments, or chat.
- No enforced cap on the number of accounts (denominator is always 12).

---

## 3. Users

- **The 12 contributors** (including the app's creator). They know each other.
  They use the app on their own phones/laptops, typically once or a few times.
- There is no "admin" role. Everyone has identical capabilities.

---

## 4. Core Concepts & Rules

| Concept | Rule |
|---|---|
| **Gate** | One shared password: `HueyAndCherryWeddingWHAAAT`. Validated server-side. |
| **Account** | Identified by display name. Normalized name (trim, lowercase, single-spaced) is the unique key. One name = one account. |
| **Returning user** | Session remembered on-device (localStorage). They skip the gate + onboarding and land on the dashboard. |
| **Name collision** | If two people pick the same name, the second loads the first's account. Accepted tradeoff for 12 friends. |
| **Pools** | Two fixed expense pools (below). |
| **Share** | Each person owes a fixed share per pool. |
| **Payment** | One payment per (person, pool). Re-uploading overwrites the prior proof. |
| **Proof** | A required photo image, stored in Supabase Storage, visible to all. |

### The two pools

| Pool | Internal `kind` | Title | Total | Share (÷12) | CTA |
|---|---|---|---|---|---|
| Fare | `fare` | **The Boat to Neverland Fare** | ₱18,000 | **₱1,500** | Pay the Fare |
| Fee | `fee` | **This House is a Home Fee** | ₱10,560 | **₱880** | Pay the Fee |

### Progress math
- Denominator is fixed at **12 people**.
- A pool's filled amount = `(# of people who paid) × share`.
- Progress fraction = `(# paid) / 12`.
- Label format: `₱7,500 / ₱18,000 · 5 of 12 paid`.
- Pesos render with the `₱` glyph and `en-PH` grouping.

---

## 5. Experience Flow (states)

The app is a single-page state machine: **gate → name → onboarding → dashboard**.

### 5.1 Gate
- Full-bleed wedding photo background, soft dark overlay, serif title "Huey & Cherry".
- One password field + Enter button.
- **Wrong password:** gentle shake + message "That's not quite it." Field clears.
- **Correct password:** advance to name entry.
- Validated by a server route (`/api/gate`) so the password never ships in the client bundle.

### 5.2 Name entry
- Prompt: "What shall we call you?" One input + Continue.
- On submit: create the account if the name is new, else load it.
- Then: if this device has never seen onboarding → onboarding; else → dashboard.

### 5.3 Onboarding (first visit per device only)
Three full-screen steps with calm, choreographed transitions:

1. **Step 1 — Greeting.** "Hello, {name}" holds, then crossfades to
   "You have been cordially invited to…"
2. **Step 2 — The reveal.** Confetti; stylized text rises into view:
   "The Huey & Cherry Wedding · Ormoc City · 2026".
3. **Step 3 — The turn.** Background fades to black; in red:
   "…now it's time to collect your payments." The ghost-laugh MP3 plays. A
   **Continue** button takes them to the dashboard.

- A discreet **"replay intro"** link on the dashboard re-runs this sequence.

### 5.4 Dashboard
- Header: "Huey & Cherry · Ormoc 2026", "Welcome, {name}."
- Two columns side by side (stacked on mobile), one per pool. Each column shows:
  - Pool title.
  - Progress label + animated progress bar.
  - A CTA button ("Pay the Fare" / "Pay the Fee"). Disabled and labeled "Paid ✓"
    once this person has paid that pool.
  - A list of payer names below. Empty state: "No one yet — be the first."
- "replay intro" link near the bottom.

### 5.5 Payment modal
- Opened by a pool's CTA.
- States the person's share (e.g. "Your share is ₱1,500").
- Image file picker with a live preview.
- A **required checkbox**: "I confirm I have paid and uploaded the correct proof."
  The **Upload button stays disabled** until both a file is chosen *and* the box is checked.
- On Upload: image goes to Supabase Storage, the payment row is upserted, modal closes.

### 5.6 Success modal
- On-theme celebration: soft gold confetti, "Thank you, {name}", "Your contribution
  is recorded." The payer's name now appears in that pool's list and the bar advances.

### 5.7 Proof modal
- Clicking any payer's name opens a modal showing their name + their uploaded proof image.

---

## 6. Functional Requirements

- **FR1** The gate accepts only the exact password, checked server-side; failures never reveal the password.
- **FR2** Submitting a name creates a new `accounts` row for a new normalized name, or returns the existing one.
- **FR3** The session (account) persists on-device; returning users bypass gate + onboarding.
- **FR4** Onboarding plays in full on first visit per device and is replayable on demand.
- **FR5** Each pool shows live progress derived from the count of payers (×share, /12).
- **FR6** A user can submit a payment for each pool exactly once; re-submitting overwrites their proof.
- **FR7** Upload is blocked until a file is selected AND the confirmation checkbox is ticked.
- **FR8** Proof images are stored in Supabase Storage and are viewable by all users.
- **FR9** Payer lists update immediately after a successful upload (the submitter's name appears).
- **FR10** Clicking a payer shows their name and proof image.
- **FR11** All motion respects `prefers-reduced-motion`.

---

## 7. Data Model (Supabase)

### `accounts`
| column | type | notes |
|---|---|---|
| id | uuid (pk) | `gen_random_uuid()` |
| name | text | unique, normalized (lowercased) key |
| display_name | text | as typed |
| created_at | timestamptz | `now()` |

### `payments`
| column | type | notes |
|---|---|---|
| id | uuid (pk) | |
| account_id | uuid (fk → accounts) | `on delete cascade` |
| kind | text | `'fare'` or `'fee'` (checked) |
| proof_url | text | Storage public URL |
| created_at | timestamptz | `now()` |
| — | unique | `(account_id, kind)` |

### Storage
- Public-read bucket `proofs`. Object key: `proofs/{account_id}/{kind}.{ext}`.

### Security posture
- No per-user auth. RLS enabled with permissive policies; the **gate password is the
  real access barrier**. This is intentional for a low-stakes private app. No sensitive
  data is stored. Documented in `README.md`.

---

## 8. Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **motion** (Framer Motion, `motion/react`) for choreographed animation
- **canvas-confetti** for celebratory bursts
- **Supabase** (Postgres + Storage) — project `wedding` (ref `tipaqkyxdbvxzpzpkrry`)
- **Vitest** for pure-logic unit tests
- **Vercel** hosting, deployed from `github.com/keithruezyl1/wedding`

---

## 9. Success Criteria

- A friend can go from URL → paid-and-proven in under a minute on their phone.
- Both pools accurately reflect who has paid, in real time after upload.
- The onboarding lands emotionally: the elegant build-up and the comedic turn both work.
- Nothing feels janky; animations are smooth (60fps) and purposeful, never decorative noise.
- The app looks like it belongs to a wedding, not a SaaS dashboard.

---

## 10. Open/Accepted Decisions

- **Onboarding "first time" = per device**, tracked via a localStorage flag (not DB state).
- **Audio autoplay** relies on the user's prior click gestures (gate/name/Continue);
  the step-3 Continue button calls `play()` as a guaranteed fallback.
- **No generated imagery** — the 6 real wedding photos carry the visuals.
