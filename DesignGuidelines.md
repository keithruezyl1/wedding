# Design Guidelines — Huey & Cherry Wedding Payments App

> **Status:** Source of truth for *how it looks and moves*. Pair with `PRD.md`
> (the *what*). Animation terms below reference the shared vocabulary in
> `animation-vocab.md` — use those names when reasoning about motion.
>
> **North star:** It should feel like a wedding invitation that happens to collect
> money — warm, golden-hour, unhurried, intentional. Never SaaS-y. Never busy.
>
> **Last updated:** 2026-06-09

---

## 1. Art Direction

Inspired by the couple's golden-hour beach photos in Ormoc: warm sunset light,
ivory/white attire, soft sand, calm sea. The interface is mostly warm ivory and
cream with sunset amber/coral accents and deep charcoal text. The single exception
is the onboarding "turn," where red-on-black appears for tonal whiplash (the joke).

**Feelings to evoke:** elegance, warmth, anticipation, intimacy. One moment of
playful menace.

---

## 2. Color

| Token | Hex | Use |
|---|---|---|
| `ivory` | `#FBF6EE` | Primary surface / page background top |
| `cream` | `#F3E9DA` | Secondary surface / background bottom |
| `sand` | `#E7D3B8` | Hairline borders, rings, progress track |
| `amber` | `#E8A14B` | Primary action, progress fill start |
| `coral` | `#E07A5F` | Hover / accent, progress fill end |
| `dusk` | `#7A5C73` | Optional muted accent |
| `charcoal` | `#2B2A28` | Primary text |
| `ruin` | `#C2362F` | **Onboarding step-3 red only** |
| black | `#000000` | **Onboarding step-3 background only** |

Rules:
- Backgrounds use the `ivory → cream` vertical gradient.
- Primary buttons: `amber` fill, `charcoal` text, hover → `coral`.
- Progress fill: left-to-right gradient `amber → coral`.
- `ruin` red and pure black appear **only** in onboarding step 3. Never elsewhere.

---

## 3. Typography

- **Headings / display:** Cormorant Garamond (serif) — elegant, editorial. Weights 400–700.
- **Body / UI:** Inter (sans) — clean, legible.
- Loaded via `next/font/google`, exposed as `--font-serif` / `--font-sans`.

Scale (Tailwind):
- Hero title: `text-5xl`–`text-6xl` serif.
- Section title (pool name): `text-3xl` serif.
- Body: base sans, `text-charcoal/60`–`/80` for secondary text.
- Eyebrow ("Ormoc · 2026"): small, `uppercase`, `tracking-[0.3em]`, muted.
- Numbers in progress labels should read cleanly; prefer **tabular numbers** for any
  digit that updates in place.

---

## 4. Layout & Spacing

- Generous whitespace; let elements breathe. Content max-width ~`5xl` on dashboard.
- Cards/columns: `rounded-3xl`, `bg-ivory/80`, `ring-1 ring-sand/60`, soft shadow, `p-7`.
- Modals: `rounded-2xl`, `bg-ivory`, `p-7`, `max-w-md`, strong but soft shadow.
- Buttons: pill-shaped (`rounded-full`), comfortable padding (`px-8 py-3`).
- Dashboard columns sit side-by-side on `md+`, stack on mobile.
- Inputs: pill or soft-rounded, `ring-1 ring-sand`, focus `ring-2 ring-amber`.

---

## 5. Iconography & Imagery

- Real wedding photos only (no generated art). `last.jpg` (sunset beach) is the gate background.
- Proof images render with `object-contain` so nothing is cropped awkwardly.
- Minimal icons; a single tasteful emoji accent (🌅) is acceptable in the success modal.

---

## 6. Motion System

**Philosophy (from `animation-vocab.md`):** every animation is **purposeful** — it
orients, gives feedback, or shows a relationship. Motion is **calm and unhurried**;
this is a wedding, not a game. We animate only **`transform` and `opacity`** for
**hardware acceleration**; never animate `width/height/top/left` in ways that cause
**layout thrashing** (the progress bar is the one width animation, and it's isolated).
All motion honors **reduced motion**.

### 6.1 Global tokens
- **Library:** `motion/react` (Framer Motion) for choreography; CSS keyframes only for trivial one-shots.
- **Signature easing:** `cubic-bezier(0.22, 1, 0.36, 1)` — an **asymmetric ease-out**.
  Use for nearly everything entering or settling.
- **Durations:** entrances `0.6–0.9s`; modal `0.3–0.45s`; background color shifts `~1.0s`;
  progress fill `~1.2s`. **Frequency of use** rule: the more often something is seen
  (e.g. button taps), the shorter and subtler — `press feedback` ~`0.12s`.
- **Springs:** where a spring is used (modal pop, button press), keep **bounce low** and
  **damping high** — refined, not playful. No big overshoot except confetti.

### 6.2 Per-surface choreography

| Surface | Pattern (vocab) | Spec |
|---|---|---|
| **Gate — entrance** | `Fade in` + slight rise | Title and field **fade in**, translate-y from +12px, ease-out, ~0.7s. |
| **Gate — wrong password** | `Shake / Wiggle` | Quick horizontal jitter (~0.38s) on the form; signals rejected input. CSS keyframe is fine. |
| **Gate → Name** | `Crossfade` | Gate **fades out** as name view **fades in**. |
| **Name entry** | `Fade in` | Calm fade + rise on mount. |
| **Onboarding step 1** | `Crossfade` between lines | "Hello, {name}" holds ~2.6s, then **crossfades** to the invite line. Use `AnimatePresence mode="wait"`: exiting line fades + rises -14px, entering fades + rises from +14px. **Orchestration** via timed `setTimeout`. |
| **Onboarding step 1→2** | `Crossfade` + `Reveal` | Greeting exits; reveal line enters. |
| **Onboarding step 2** | `Reveal` + celebratory burst | Title **fades up** (`Fade in` + translate). **Confetti** burst (canvas-confetti) ×2 — the one place **bounce/overshoot** is welcome. |
| **Onboarding step 2→3** | `Continuity transition` (background) | Background **color-tweens** `cream → black` over ~1.0s so the mood shift feels connected, not a hard cut. |
| **Onboarding step 3** | `Fade in` (delayed) | Red line **fades in** after the background darkens (`delay ~0.3s`). Ghost-laugh audio plays. Continue button visible. |
| **Onboarding → Dashboard** | `Crossfade` | Sequence unmounts, dashboard **fades in**. |
| **Dashboard mount** | `Fade in` + optional `Stagger` | Header then columns **fade in**; columns may **stagger** by ~80ms for a gentle cascade. |
| **Progress bar** | `Tween` width fill | On mount/update, fill **interpolates** from 0 → target width, ~1.2s, signature ease. Isolated `transform`-friendly width animation on its own layer. |
| **Pay / primary buttons** | `Hover effect` + `Press/Tap feedback` | Hover: color `amber → coral` (~0.3s). Press: subtle **scale-down** (~0.97), ~0.12s. |
| **Payer list item** | `Hover effect` | Background tint to `cream` on hover, ~0.2s. |
| **Modal open** | `Scale in` + `Fade in` | Overlay **fades in** (~0.3s); panel **scales in** from 0.98 + rises 16px, signature ease (~0.45s). Reduced-motion → fade only. |
| **Modal close** | `Exit` | Reverse of open via `AnimatePresence` exit. |
| **Image preview (payment)** | `Fade in` | Selected image **fades in** into the dropzone. |
| **Success modal** | `Scale in` + confetti `Pulse`-free burst | Panel scales in; soft gold **confetti** once. Keep it gentle. |
| **Proof modal image** | `Fade in` | Image **fades in** once loaded. |

### 6.3 Optional polish (use if cheap, skip if it adds risk)
- **Number ticker** with **tabular numbers** for the peso amount in a progress label
  when it changes after a payment (count up to the new value). Nice-to-have, not required.
- **Skeleton / shimmer** on the dashboard while payer lists load, if there's a visible
  delay. Otherwise a simple fade-in on data arrival is enough.

### 6.4 Reduced motion (required)
- Use motion's `useReducedMotion()`. When true:
  - Replace translate/scale entrances with **opacity-only** `fade in`.
  - Progress bar jumps to its value (duration 0).
  - No background color tween drama — switch instantly.
  - Confetti may still fire (it's a discrete celebration, not continuous motion) — acceptable.

---

## 7. Component Standards

- **Buttons:** pill, `amber`/`coral`, disabled state `opacity-50` + `cursor-not-allowed`.
  Disabled "Paid ✓" state on a paid pool's CTA.
- **Inputs:** soft ring, amber focus ring, centered text on the gate/name screens.
- **Modals:** shared `Modal` shell — overlay click + Esc to close, body scroll locked,
  `role="dialog"` + `aria-modal` + `aria-labelledby`.
- **Cards/Columns:** consistent radius, ring, padding, and soft shadow per §4.
- **Empty states:** quiet and human ("No one yet — be the first.").

---

## 8. Accessibility

- Respect `prefers-reduced-motion` everywhere (§6.4).
- All interactive elements are real `<button>`/`<input>` elements, keyboard-operable.
- Modals trap focus context via Esc-to-close and labelled dialogs.
- Maintain legible contrast: `charcoal` on `ivory`/`cream` passes; red-on-black in
  step 3 is large display text only.
- Provide meaningful `alt` text on proof images.

---

## 9. Do / Don't

**Do**
- Keep it calm, warm, and spacious. Let the photos and serif type do the work.
- Animate `transform`/`opacity`; keep motion purposeful and smooth.
- Reserve red/black strictly for the onboarding joke.

**Don't**
- Don't add SaaS-dashboard chrome, charts, or dense data.
- Don't animate layout-affecting properties in loops.
- Don't bounce or overshoot outside of confetti.
- Don't introduce new colors or fonts without updating this doc first.
