# SPEAK Client — UI Redesign Master Spec

This is the single source of truth for the SPEAK Client UI rebuild. It captures every screen, control, state, API, shortcut, and design token needed to recreate the app from scratch with feature parity.

The legacy implementation lives in [reference/src/](reference/src/) and must be consulted whenever a behavioural detail is ambiguous. The new app is built fresh inside [src/](src/).

---

## 0. Goals & non-goals

### Goals

- Minimalistic dark theme with refined neutrals and a single subtle accent.
- Smooth, purposeful animations on route changes, dialog/sheet entry, list inserts, and player/state transitions.
- Fully responsive: 360 px (phone), 768 px (tablet), 1024 px (laptop), 1440 px (desktop).
- Feature parity with the legacy app — no backend changes, no behavioural regressions.
- Consistent component library based on Radix primitives + Tailwind v4 (shadcn-style).
- Strong keyboard support and accessible focus styles everywhere.

### Non-goals

- No new business features in this redesign (admin context, IME behaviour, scoring, validation rules stay identical).
- No backend / API changes.
- No light theme (locked to dark; system preference ignored).
- No SSR / no migration to a different framework.

---

## 1. Tech stack

| Concern        | Choice                                                                               |
| -------------- | ------------------------------------------------------------------------------------ |
| Framework      | React 19 + TypeScript                                                                |
| Bundler        | Vite 7                                                                               |
| Styling        | Tailwind v4 (CSS-first config in [src/index.css](src/index.css))                     |
| Primitives     | `@radix-ui/react-*` (shadcn-style wrappers in [src/components/ui/](src/components/ui/)) |
| Icons          | `lucide-react`                                                                       |
| Routing        | `react-router-dom` v7                                                                |
| HTTP           | `axios` (existing clients reused from `reference/src/lib/`)                          |
| Forms          | `react-hook-form` + `zod`                                                            |
| Toasts         | `sonner`                                                                             |
| Charts         | `recharts` (already installed)                                                       |
| Motion         | `framer-motion`                                                                      |
| Class helpers  | `clsx`, `tailwind-merge`, `class-variance-authority`                                 |

**Removed in Phase 11:** `@mui/material`, `@mui/icons-material`, `@mui/lab`, `@mui/x-charts`, `@emotion/react`, `@emotion/styled`, `@tailwindcss/postcss` (kept only if needed by Vite plugin).

---

## 2. Design tokens

All tokens are declared in [src/index.css](src/index.css) using Tailwind v4's `@theme` directive so they are exposed as Tailwind utilities (`bg-background`, `text-muted-foreground`, etc.).

### 2.1 Colour palette (dark only)

| Token                  | Value (HSL)             | Notes                          |
| ---------------------- | ----------------------- | ------------------------------ |
| `--background`         | `0 0% 4%` (#0A0A0A)     | App background                 |
| `--foreground`         | `0 0% 98%` (#FAFAFA)    | Default text                   |
| `--card`               | `0 0% 7%` (#121212)     | Card / panel surface           |
| `--card-foreground`    | `0 0% 98%`              | Text on cards                  |
| `--popover`            | `0 0% 9%` (#171717)     | Popover, dropdown, dialog      |
| `--popover-foreground` | `0 0% 98%`              |                                |
| `--muted`              | `0 0% 12%` (#1F1F1F)    | Subtle surface, table stripes  |
| `--muted-foreground`   | `0 0% 64%` (#A3A3A3)    | Helper / caption text          |
| `--border`             | `0 0% 16%` (#292929)    | 1 px borders                   |
| `--input`              | `0 0% 12%`              | Field background               |
| `--ring`               | `220 70% 60%` (#4D7CFA) | Focus ring                     |
| `--primary`            | `220 70% 60%`           | Single accent used sparingly   |
| `--primary-foreground` | `0 0% 100%`             |                                |
| `--secondary`          | `0 0% 14%`              | Secondary buttons              |
| `--secondary-foreground` | `0 0% 98%`            |                                |
| `--accent`             | `0 0% 14%`              | Hover states (very subtle)     |
| `--accent-foreground`  | `0 0% 98%`              |                                |
| `--destructive`        | `0 70% 55%` (#DA4949)   | Errors / destructive actions   |
| `--destructive-foreground` | `0 0% 98%`          |                                |
| `--success`            | `142 60% 45%` (#2EB85C) | Success badges                 |
| `--warning`            | `38 92% 55%` (#F0A82E)  | Warning state                  |
| `--info`               | `200 80% 55%` (#2EAEE0) | Informational                  |

No gradients, no glassmorphism, no drop-shadows except a single low-opacity elevation for floating surfaces (`0 4px 12px rgba(0,0,0,0.4)`).

### 2.2 Typography

- Font family: `Inter`, fallback to system stack.
- Sizes: `text-xs` 12 px, `text-sm` 14 px (body default), `text-base` 16 px, `text-lg` 18 px, `text-xl` 20 px, `text-2xl` 24 px, `text-3xl` 30 px (page titles), `text-4xl` 36 px (rare hero only).
- Weights: 400 body, 500 controls, 600 headings, 700 hero numbers.
- Tracking: page titles `tracking-tight`, eyebrows / labels `uppercase tracking-[0.18em] text-xs`.
- Line height: 1.5 body, 1.25 headings.

### 2.3 Spacing & radius

- Spacing scale: Tailwind defaults (4 px base).
- Standard padding: cards `p-5` desktop / `p-4` mobile.
- Page gutter: `px-6 md:px-10` desktop, `px-4` mobile, max-width container `max-w-screen-2xl mx-auto`.
- Radius: `--radius: 0.625rem` (10 px). Cards `rounded-xl`, buttons / inputs `rounded-md`, full pills `rounded-full`.
- Borders: 1 px `border-border`. No 2 px borders.

### 2.4 Motion

Single source of presets in [src/lib/motion.ts](src/lib/motion.ts):

- `fadeUp` (8 px translate, 200 ms, `easeOut`) — page contents on mount, list inserts.
- `fadeIn` (150 ms) — toast, popover.
- `routeFade` (150 ms cross-fade between routes via `AnimatePresence mode="wait"`).
- `pop` (scale 0.95→1, 180 ms) — dialogs.
- `progressPulse` (subtle 1.5 s loop) — long-running progress bars.

Reduced-motion: respect `prefers-reduced-motion: reduce` by short-circuiting all `framer-motion` variants to the final state.

### 2.5 Breakpoints

| Name | Min width | Use                                          |
| ---- | --------- | -------------------------------------------- |
| `sm` | 640 px    | small phones / large phones landscape        |
| `md` | 768 px    | tablet — sidebar appears as icon rail        |
| `lg` | 1024 px   | laptop — sidebar can expand                  |
| `xl` | 1280 px   | desktop — full layouts                       |
| `2xl`| 1536 px   | wide desktop — max content width applies     |

### 2.6 Elevation & focus

- Cards: flat (`bg-card border border-border`). No shadow at rest.
- Floating surfaces (popover, dialog, sheet, dropdown): `shadow-lg shadow-black/40`, 1 px `border-border`.
- Focus visible: 2 px `outline-ring` offset 2, applied via `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`.

---

## 3. Component primitive library

All shadcn-style wrappers live in [src/components/ui/](src/components/ui/). Each one follows the standard `cva` + `forwardRef` pattern and accepts `className` for extension.

| File                            | Wraps                                       | Variants                                              |
| ------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `button.tsx`                    | `<button>` + Radix Slot                     | `default`, `secondary`, `ghost`, `outline`, `destructive`, `link`; sizes `sm`, `default`, `lg`, `icon` |
| `card.tsx`                      | `<div>`                                     | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `input.tsx`                     | `<input>`                                   | text, number, password, file                          |
| `textarea.tsx`                  | `<textarea>`                                | resize-y default                                      |
| `label.tsx`                     | `@radix-ui/react-label`                     | —                                                     |
| `select.tsx`                    | `@radix-ui/react-select`                    | —                                                     |
| `slider.tsx`                    | `@radix-ui/react-slider`                    | single thumb default                                  |
| `switch.tsx`                    | `@radix-ui/react-switch`                    | —                                                     |
| `checkbox.tsx`                  | `@radix-ui/react-checkbox`                  | —                                                     |
| `tabs.tsx`                      | `@radix-ui/react-tabs`                      | underline + segmented variants                        |
| `tooltip.tsx`                   | `@radix-ui/react-tooltip`                   | —                                                     |
| `dialog.tsx`                    | `@radix-ui/react-dialog`                    | `Dialog`, `DialogTrigger`, `DialogContent`, etc.      |
| `sheet.tsx`                     | `@radix-ui/react-dialog` (side variant)     | `left`, `right`, `top`, `bottom`                      |
| `dropdown-menu.tsx`             | `@radix-ui/react-dropdown-menu`             | —                                                     |
| `popover.tsx`                   | `@radix-ui/react-popover`                   | —                                                     |
| `toast.tsx` (re-exports Sonner) | `sonner`                                    | `success`, `error`, `info`, `warning`                 |
| `skeleton.tsx`                  | `<div>` w/ animate-pulse                    | —                                                     |
| `alert.tsx`                     | `<div>`                                     | `default`, `destructive`, `info`, `warning`, `success`|
| `badge.tsx`                     | `<span>`                                    | `default`, `secondary`, `outline`, `success`, `warning`, `destructive`, `info` |
| `progress.tsx`                  | `@radix-ui/react-progress`                  | linear; indeterminate variant                         |
| `accordion.tsx`                 | `@radix-ui/react-accordion`                 | single + multiple                                     |
| `scroll-area.tsx`               | `@radix-ui/react-scroll-area`               | with custom thumb                                     |
| `avatar.tsx`                    | `@radix-ui/react-avatar`                    | with initials fallback                                |
| `separator.tsx`                 | `@radix-ui/react-separator`                 | —                                                     |
| `table.tsx`                     | `<table>`                                   | `Table`, `TableHeader`, `TableRow`, `TableCell`, etc. |
| `command.tsx`                   | `cmdk`                                      | for future Ctrl+K palette                             |
| `kbd.tsx`                       | `<kbd>`                                     | shortcut hint                                         |

### Convenience helpers

- [src/lib/utils.ts](src/lib/utils.ts) — `cn()` (clsx + tailwind-merge), `formatDuration()`, `formatNumber()`, `formatDate()`.
- [src/lib/motion.ts](src/lib/motion.ts) — exported variants (see 2.4).
- [src/lib/keyboard.ts](src/lib/keyboard.ts) — `useHotkey(combo, handler, opts)` for global shortcuts.

---

## 4. App shell

Implemented in [src/components/layout/AppLayout.tsx](src/components/layout/AppLayout.tsx).

### 4.1 Layout structure

```
+-------------------------------------------------------+
| Sidebar  | Top bar                                    |
|          +--------------------------------------------+
| (rail or | Page content                               |
| expanded)|                                            |
|          |                                            |
+----------+--------------------------------------------+
```

### 4.2 Sidebar (`md+`)

- States: `rail` (default, 64 px wide, icons only) ↔ `expanded` (240 px, label + icon).
- Toggle: pin button at the top; also expands automatically on hover when not pinned.
- Persists `pinned` state in `localStorage` under key `speak-sidebar-pinned`.
- Brand block: small "S" mark + "SPEAK" wordmark when expanded.
- Nav items (NavItem):

| Icon            | Label             | Path                  | Admin-only |
| --------------- | ----------------- | --------------------- | ---------- |
| `Home`          | Processor         | `/`                   | No         |
| `ListOrdered`   | Queue Processor   | `/queue-processor`    | No         |
| `Mic`           | Transcription     | `/transcription`      | No         |
| `BadgeCheck`    | Validation        | `/validation`         | Yes        |
| `Trophy`        | Leaderboard       | `/leaderboard`        | Yes        |
| `BarChart3`     | Statistics        | `/statistics`         | Yes        |
| `Youtube`       | Channels          | `/channels`           | Yes        |
| `FileSpreadsheet` | CSV Normalizer  | `/csv-normalization`  | No         |

- Active state: 3 px left bar in `--primary` and slight `bg-accent`.
- Footer: service status row (compact) + admin profile button.

### 4.3 Mobile (`<md`)

- Sidebar collapses; replaced by:
  - Top bar with hamburger that opens a `Sheet` (`side="left"`) containing the same nav.
  - A compact bottom navigation bar pinned to the safe-area, showing the 4 most-used items: Processor, Transcription, Validation (admin), Statistics (admin). Non-admin users see Processor / Queue / Transcription / CSV.

### 4.4 Top bar

- Height 56 px, sticky, `bg-background/80 backdrop-blur border-b border-border`.
- Left: hamburger (mobile only), page title (responsive — hides on `<sm`).
- Right cluster (right-to-left):
  1. `ServiceStatusPill` — compact pill `<2 dots/labels>` with tooltip showing each service URL + status; click `Refresh` icon re-pings `/health`.
  2. `LeaderboardTrigger` — admin-only icon button that opens `LeaderboardPeekDialog`.
  3. `AdminAvatarMenu` — `DropdownMenu` triggered by avatar:
     - If admin selected: shows display name, "Switch admin", "Sign out" (= clearAdmin).
     - If guest: "Sign in as admin" → opens AdminSelectorDialog.
  4. (Reserved for Ctrl+K command palette in a future phase — placeholder only.)

### 4.5 Admin context

Re-implemented in [src/context/AdminContext.tsx](src/context/AdminContext.tsx) with the same API as the legacy version:

```ts
{
  admin: string | null;            // selected profile id
  profiles: AdminProfile[];        // hard-coded list (copied from reference)
  isAdmin: boolean;
  isSelectorOpen: boolean;
  selectAdmin(id: string): void;
  clearAdmin(): void;
  openSelector(): void;
  closeSelector(): void;
}
```

- Persistence: `localStorage` key `adminName` (same as legacy for compatibility).
- Global shortcut: **`Ctrl + \``** (Backquote) toggles `AdminSelectorDialog` from anywhere.

### 4.6 AdminSelectorDialog

- Title: "Who's transcribing?"
- Body: responsive grid of profile cards (avatar + display name). Default `placeholder.svg` when no image.
- Hover / focus = ring + slight scale.
- Footer: "Continue as guest" link clears selection.
- Uses `Dialog` from primitives, animates with `pop`.

### 4.7 Global keyboard shortcuts

| Shortcut          | Scope        | Action                                                     |
| ----------------- | ------------ | ---------------------------------------------------------- |
| `Ctrl + \``       | Global       | Open / toggle Admin selector                               |
| `Ctrl + Space`    | Transcription / CSV editor textareas | Toggle Sinhala IME for the focused textarea |
| `Ctrl + Shift + S`| CSV page     | Toggle global IME chip                                     |
| `Ctrl + Enter`    | CSV row edit | Save edited row                                            |
| `Esc`             | CSV row edit / dialogs | Cancel edit / close dialog                       |

### 4.8 Service health

- Uses [src/hooks/useServiceStatus.ts](src/hooks/useServiceStatus.ts) (copied from reference, behaviour preserved).
- Polls `GET {AUDIO_BASE}/health` and `GET {TRANSCRIPTION_BASE}/health` on mount + on user `Refresh` click.
- Renders pill state per service: green dot (healthy), amber (loading), red (down).

### 4.9 Routing

- Same routes as legacy ([src/App.tsx](src/App.tsx)):
  - `/` → AudioProcessorPage
  - `/queue-processor`
  - `/transcription`
  - `/validation` (admin-only — UI gate; backend still authoritative)
  - `/leaderboard` (admin-only)
  - `/statistics` (admin-only)
  - `/channels` (admin-only)
  - `/csv-normalization`
- Route transitions wrapped in `AnimatePresence mode="wait"` with `routeFade`.
- Admin-gated pages render an "Admin only" empty state if `!isAdmin` instead of redirecting (same UX as legacy nav-filter, but with a friendly empty state when accessed by direct URL).

---

## 5. Pages

For every page below, "Layout (desktop)" is `lg+`, "Layout (mobile)" is `<md`.

---

### 5.1 Audio Processor — `/` (index)

**Admin gate:** none. **Purpose:** Single-video pipeline (URL → split → transcribe → optional cloud save).

#### Sections

1. **Page header** — title "Audio Processor", subtitle "Ingest a YouTube video, split it into clips, transcribe and persist."
2. **Stepper** — 4 steps (Input → Splitting → Transcription → Save). Compact horizontal stepper on `md+`, vertical/numbered progress bar on mobile. Drives off the same state machine as legacy `ProgressIndicator.tsx` in [reference](reference/src/components/ProgressIndicator.tsx).
3. **Conditional main panel:**
   - **Idle / Input state:** `YoutubeUrlForm` card.
   - **Loading states:** `LoadingPanel` with title + description (e.g. "Splitting audio…", "Transcribing clips…", "Saving to cloud…").
   - **Clips ready / playing:** `ClipsPanel` with playlist + audio player.
   - **Transcribed:** `TranscriptionsPanel`.
   - **Done:** `CompletionPanel`.

#### `YoutubeUrlForm`

- Single column on mobile, two-column on `lg+` (form left, preview / tip right).
- Controls:
  - `Input` — YouTube URL (label "YouTube URL"). Validated with zod regex.
  - `Select` — Video category (label "Category *"). Categories from existing audio-service constants in `reference/src/types/common.ts`.
  - `Slider` — VAD aggressiveness (1–3, default 2) with inline numeric badge.
  - `Accordion` "Advanced options":
    - `Slider` — Start padding (ms) 0–500.
    - `Slider` — End padding (ms) 0–500.
  - `Button` (primary) — "Process video" with loading spinner state.
  - `Button` (ghost) — "Reset".
- Inline error `Alert` (destructive) under the form on API failure.
- Helper caption referencing recommended VAD settings.

#### `ClipsPanel`

- Header row: video title, channel, duration, total clips badge; right side action buttons.
- Two-column on `lg+`: left = clip list (scroll-area, virtualised if >50 entries), right = active player.
- Clip list item: index, timestamp range, "transcribed" badge if applicable, current play indicator, click to select.
- Player card:
  - Big play / pause icon button.
  - Linear `Progress` (audio scrubber) with current / total time.
  - Volume slider, ±15 s skip buttons, looping toggle.
  - Speed select (0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×).
- Action bar at the bottom of the panel:
  - `Get Transcriptions` (primary) — only when not yet transcribed.
  - `Save to Cloud & Database` (success) — only after transcription.
  - `Start Over` (ghost) — calls `DELETE /delete-audio/:videoId` then resets state (matches legacy).

#### `TranscriptionsPanel`

- Card list of transcribed clips (rich text), per-clip actions: copy, expand/collapse, mark unsuitable.
- Toolbar: "Delete failed (n)" (calls `POST /clean-transcriptions/:videoId`), "Copy all", "Start Over".
- Replace legacy browser `alert/confirm` with shadcn `Dialog` confirmations.

#### `CompletionPanel`

- Stats grid (clips saved, total duration, transcribed count, failures).
- "Process another video" primary button.

#### States

- `idle`, `splitting`, `clipsReady`, `transcribing`, `transcribed`, `saving`, `done`, `error`.
- Each state determines which panel is rendered with an `AnimatePresence` cross-fade.

#### APIs

| Method | Path                                                          | Trigger                      |
| ------ | ------------------------------------------------------------- | ---------------------------- |
| POST   | `/split-audio`                                                 | "Process video" submit       |
| POST   | `/transcribe-clips`                                            | "Get Transcriptions"         |
| POST   | `/save-clips`                                                  | "Save to Cloud & Database"   |
| DELETE | `/delete-audio/:videoId`                                       | "Start Over"                 |
| POST   | `/clean-transcriptions/:videoId`                               | "Delete failed"              |
| GET    | `{AUDIO_BASE}/output/:videoId/:clipName` (static streaming)    | Audio playback               |

#### Acceptance

- All legacy buttons present.
- Pipeline state machine identical to reference (read [reference/src/pages/AudioProcessorPage.tsx](reference/src/pages/AudioProcessorPage.tsx)).
- Mobile: form + player vertically stacked; clip list scroll-area limited to 50 vh.

---

### 5.2 Queue Processor — `/queue-processor`

**Admin gate:** none. **Purpose:** Build a queue of videos, set batch defaults, run concurrent processing.

#### Layout

- Desktop `lg+`: 2-column. Left column (40 %): `QueueInputCard` + `BatchSettingsCard`. Right column: `RunControlBar` (sticky top) + `QueueTable`.
- Mobile: stacked single column. Settings inside a `Sheet` triggered by a "Batch settings" button on the run bar.

#### `QueueInputCard`

`Tabs` with three panels:

1. **Add single video** — URL `Input` + `Add` button. Enter submits.
2. **Import from playlist** — Playlist URL + optional limit `Input` (number) + `Load` button.
3. **Import from JSON** — File `Input` + optional limit + `Load` button. Help text describing JSON shape `[ { "url": "..." }, ... ]`.

`Alert` shown for parse / network errors. Uses `POST /playlist-videos`.

#### `BatchSettingsCard`

- `Select` — default category (required).
- `Slider` — default VAD (1–3).
- `Accordion` "Additional defaults":
  - Start padding slider, End padding slider.
  - `Switch` — Auto-clean null transcriptions.

#### `RunControlBar`

- Primary `Button` — "Start processing" / "Stop". Disabled if queue empty or no category set.
- `Progress` — overall completion bar.
- Compact stat chips: slots in flight, pending, done, failed.

#### `QueueTable`

- Columns: # | Title | Category | VAD | Clips | Status | Actions.
- Status `Badge`: `pending`, `running`, `done`, `failed`.
- Row expansion (chevron icon) reveals per-row settings (overrides VAD / padding / auto-clean) + retry / delete actions.
- Empty state: dashed bordered panel "No videos yet — add some on the left.".
- Sticky header inside `ScrollArea`.

#### States

- `idle`, `running`, `paused (after Stop)`, `completed`.
- Per-row state machine same as legacy `VideoQueueTable.tsx`.

#### APIs

| Method | Path                                          | Trigger                       |
| ------ | --------------------------------------------- | ----------------------------- |
| POST   | `/playlist-videos`                            | Import from playlist          |
| POST   | `/split-audio`                                | Per row when running          |
| POST   | `/transcribe-clips`                           | Per row when running          |
| POST   | `/clean-transcriptions/:videoId` (optional)   | If auto-clean enabled         |
| POST   | `/save-clips`                                 | Final per-row step            |

#### Shortcuts

- `Enter` in single-URL field adds the video.
- `Enter` in playlist URL field triggers Load.

#### Acceptance

- Concurrency identical to reference (a fixed number of slots; legacy default = 2).
- "Stop" gracefully aborts in-flight requests where possible (AbortController) — improvement over legacy's hard reload.

---

### 5.3 Transcription — `/transcription`

**Admin gate:** none. **Purpose:** Crowd / admin transcription of random clips with Sinhala IME.

#### Layout

- Desktop `lg+`: 2-column.
  - Left column: optional `GuidelinesCard` (default open for non-admin), `AudioCard`, up to 2 `ReferenceCard`s stacked.
  - Right column: `TranscriptionEditorCard`.
- `ActionBar` spans full width at the bottom.
- Mobile: single column, ordering Audio → Editor → References → Actions. Guidelines accessible via "?" icon button at top.

#### `GuidelinesCard`

- Title, scrollable bullet list copied verbatim from legacy guidelines.
- Toggle button "Show / Hide" (collapsed state persisted in `sessionStorage`).
- Mention `Ctrl + Space` for IME.

#### `AudioCard`

- Eyebrow "Audio clip".
- Optional small title (clip id) + meta (e.g. category).
- `AudioPlayer` (full): play/pause, ±1 s skip, replay, loop toggle, speed select, scrub bar with current/total.
- Right-aligned `Skip audio` ghost button.

#### `ReferenceCard`

- Heading "Reference (anonymized)".
- Collapsible body (default expanded if length < 240 chars else collapsed).
- Actions: `Copy into editor` (primary, awards score per legacy `submission.message`), `Copy` (ghost, copies text only without scoring).

#### `TranscriptionEditorCard`

- Header row: label "Transcription", `Switch` "Sinhala IME" with subtle status text "ready / loading / unavailable".
- Large `Textarea` (min height 220 px), monospace optional toggle, character & word count below.
- Below textarea, three checkbox rows:
  - "Speaker gender": `Select` (male / female / mixed / unknown).
  - `Checkbox` "Background noise present".
  - `Checkbox` "Code-mixing (English / Tamil)".
  - `Checkbox` "Multiple speakers / overlapping speech".

#### `ActionBar`

- Left-aligned secondary `Button` "This audio is not suitable…" — opens `UnsuitableDialog`.
- Right-aligned primary `Button` "Submit transcription" + ghost `Button` "Skip audio".

#### Dialogs / toasts

- `UnsuitableDialog` — radio reasons + optional note + `Submit` (uses POST /transcription with unsuitable flag).
- `PointCelebrationDialog` — non-blocking modal shown when submission response indicates a point. Auto-dismiss after 1.5 s, then load next clip.
- `Sonner` toasts for success / error / info messages.

#### IME integration

- `useSinhalaIme(textareaRef, { defaultEnabled: true })` (copied from reference/src/hooks/useSinhalaIme.ts). Toggles via switch or `Ctrl + Space`.
- Hidden `.ime-chip` element kept exactly as legacy for compatibility with `public/sin-phonetic-ime.js`.

#### APIs

| Method | Path                  | Trigger                            |
| ------ | --------------------- | ---------------------------------- |
| GET    | `/audio/random`       | Initial load + after submit / skip |
| POST   | `/transcription`      | Submit / Mark unsuitable           |

#### Acceptance

- IME chip + script behaviour matches legacy 1:1.
- Submitting clears form and auto-loads next clip.
- All metadata fields + admin id sent with payload.

---

### 5.4 Validation — `/validation`

**Admin gate:** yes (UI). **Purpose:** Review a YouTube video's clips against Google reference text and decide validity.

#### Layout

- Desktop `lg+`: 2-column.
  - Left (35 %): `VideoCard` (sticky) — thumbnail, title, channel, total clips badge, `Open on YouTube`, action buttons.
  - Right (65 %): `ClipList` — scroll-area with one row per clip.
- Mobile: stacked. VideoCard collapsed at top with action buttons + clip list below.

#### `VideoCard`

- 16:9 thumbnail with play overlay (clicking opens YouTube in new tab).
- Title, channel, validation status badge, clip count.
- Actions: `Mark as Validated` (success), `Mark as Not Valid` (destructive), `Skip` (ghost), `Play All / Stop All` toggle.

#### `ClipList`

- Each row: index, `MiniAudioPlayer` (play/pause, replay, scrub), reference transcription (read-only), per-clip status badge.
- Auto-advance during Play All — uses `MiniAudioPlayer` imperative handle exactly like reference `MiniAudioPlayer.tsx`.

#### States

- `loading` (skeleton), `empty` (no pending videos — info message + "Check again" button), `error` (toast), `submitting` (buttons disabled).

#### APIs

| Method | Path                                                      | Trigger                          |
| ------ | --------------------------------------------------------- | -------------------------------- |
| GET    | `/validation/youtube-video/next`                          | Load next video                  |
| POST   | `/validation/youtube-video/:videoId/validation-status`    | Mark validated / not valid / skip|

#### Acceptance

- "Play all" plays clips sequentially with a 200 ms gap, stops on user pause or end.
- Empty queue: dashed card "No pending videos right now." + Refresh.

---

### 5.5 Leaderboard — `/leaderboard`

**Admin gate:** yes (UI). **Purpose:** Admin contribution rankings.

#### Layout

- Header: title + segmented `Tabs` for range (`All time`, `This week`, `This month`).
- Right of header on `lg+`: total contributions counter card.
- `Podium` — top-3 cards with avatars, name, count. Animated entrance with stagger.
- `LeaderTable` — remaining ranks (rank, avatar+name, contribution count).
- States: skeleton during load, error `Alert` with retry, empty `Alert` "No admin transcriptions yet.".

#### APIs

| Method | Path                                                              | Trigger      |
| ------ | ----------------------------------------------------------------- | ------------ |
| GET    | `{TRANSCRIPTION_API}/admin/leaderboard?range=all|week|month`      | Tab change   |

#### Acceptance

- Range tab change refetches and animates table changes.

---

### 5.6 Statistics — `/statistics`

**Admin gate:** yes (UI). **Purpose:** Database analytics dashboard. **Charts library:** `recharts` for everything (replacing `@mui/x-charts`).

#### Layout

- Header row: title, period `Select` (7 / 30 / 90 / 180 / 365 days), `Refresh` button.
- `KpiGrid` — 4 KPI cards (Total transcriptions, Total duration, Daily avg, Validated %). Skeleton on load.
- Full-width `TranscriptionMetadataChart` (stacked bar).
- Optional `AsrReferencePreferenceCard`.
- Two-column grid:
  - Left: `TranscriptionStatusChart` (pie/donut), `CategoryDurationChart` (horizontal bar), `AdminContributionChart` (bar).
  - Right: `AudioDistributionGraph` (line/area), `DailyTranscriptionGraph` (line + 7/30-day toggle).
- Mobile: every chart full width, ordered as listed.

#### APIs

| Method | Path                                | Trigger                  |
| ------ | ----------------------------------- | ------------------------ |
| GET    | `/statistics?days=:n`               | Period change / refresh  |
| GET    | `/statistics/daily?days=:n`         | DailyTranscription toggle|

(Other helpers in [reference/src/lib/statisticsApi.ts](reference/src/lib/statisticsApi.ts) remain available for future use.)

#### Acceptance

- Each chart matches the data shape of its legacy counterpart.
- Recharts tooltips themed to dark; legend at the bottom with subtle markers.
- Period change spinner overlay (does not blank the page).

---

### 5.7 Channel Browser — `/channels`

**Admin gate:** yes (UI). **Purpose:** Browse shortlisted YouTube channels per category for the scraper pipeline.

#### Layout

- Header (icon + title + subtitle).
- One section per category — title row + horizontal scrollable carousel of `ChannelCard`s.
- Empty state: "No channels found." (info `Alert`).

#### `ChannelCard`

- Square / 4:5 thumbnail, channel title, subscriber count.
- Hover (or focus on touch): overlay with `Open` (external) and `Delete` (destructive) icon buttons.
- Confirm delete via `Dialog` → `DELETE /channels/:channelId`.

#### Toasts

- `sonner.success` / `sonner.error` on delete.

#### APIs

| Method | Path                          | Trigger        |
| ------ | ----------------------------- | -------------- |
| GET    | `/channels`                   | Initial load   |
| DELETE | `/channels/:channelId`        | Delete confirm |

---

### 5.8 CSV Normalization — `/csv-normalization`

**Admin gate:** none. **Purpose:** Offline CSV QA — compare `text` vs `tn_text`, edit normalized column with optional Sinhala IME, export.

#### Layout

- Header row: title, action group (`Upload CSV`, `Download CSV`), stat chips (Total / Changed / Reviewed), `Switch` "Sinhala IME" with `Tooltip` `Ctrl+Shift+S`.
- Diff legend (insert / delete / equal swatches).
- Empty state: dashed bordered upload zone with drag & drop hint.
- Loaded state: sticky-header `Table` (max-height = remaining viewport, internal scroll).

#### Table

- Columns: `#`, `text`, `tn_text` (with inline word-diff using a small lightweight diff util in [src/lib/diff.ts](src/lib/diff.ts)), `Edit / Save`.
- Row actions: edit (pencil), reviewed badge.
- Edit mode replaces `tn_text` cell with a `Textarea` + `Save (Ctrl+↵)` + `Cancel (Esc)` buttons, and attaches IME via `useSinhalaIme`.
- Reviewed rows get a subtle `bg-muted` and a "✓ reviewed" badge.

#### Shortcuts

- `Esc` cancel edit.
- `Ctrl/Cmd + Enter` save row.
- `Ctrl + Shift + S` toggle global IME chip.

#### APIs

- None — pure client-side CSV parse & download (use `papaparse` if helpful, otherwise hand-written split as in legacy).

#### Acceptance

- File upload accepts `.csv` only.
- Word-level diff renders inline (added words green-tinted, removed words red-tinted with strikethrough).
- Download CSV preserves original column order plus a `reviewed` column.

---

## 6. Hooks & libs (re-introduced into new src)

| Path                                         | Source                                                       | Notes                                          |
| -------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| `src/lib/api.ts`                             | adapted from [reference/src/lib/api.ts](reference/src/lib/api.ts)                              | axios instance + audioApi                      |
| `src/lib/transcriptionServiceApi.ts`         | adapted from [reference/src/lib/transcriptionServiceApi.ts](reference/src/lib/transcriptionServiceApi.ts) | transcription / validation / leaderboard       |
| `src/lib/statisticsApi.ts`                   | adapted from [reference/src/lib/statisticsApi.ts](reference/src/lib/statisticsApi.ts)        | stats endpoints                                |
| `src/lib/utils.ts`                           | new + `cn` from [reference/src/lib/utils.ts](reference/src/lib/utils.ts) | + formatters                                   |
| `src/lib/motion.ts`                          | new                                                          | framer-motion variants                         |
| `src/lib/keyboard.ts`                        | new                                                          | `useHotkey`                                    |
| `src/lib/diff.ts`                            | new                                                          | minimal word-level diff for CSV page           |
| `src/hooks/useSinhalaIme.ts`                 | copied from [reference/src/hooks/useSinhalaIme.ts](reference/src/hooks/useSinhalaIme.ts)        | unchanged                                      |
| `src/hooks/useServiceStatus.ts`              | copied from [reference/src/hooks/useServiceStatus.ts](reference/src/hooks/useServiceStatus.ts)  | unchanged                                      |
| `src/hooks/useChannelCards.ts`               | copied from [reference/src/hooks/useChannelCards.ts](reference/src/hooks/useChannelCards.ts)    | unchanged                                      |
| `src/hooks/useAsyncData.ts`                  | copied                                                       | unchanged                                      |
| `src/hooks/useSnackbar.ts`                   | replaced by `sonner`                                         | drop                                           |
| `src/context/AdminContext.tsx`               | adapted                                                      | same API, no MUI imports                       |
| `src/types/*`                                | copied                                                       | shared TS types                                |

---

## 7. Accessibility checklist (applies to every page)

- All interactive elements reachable via keyboard.
- Visible focus ring on every focusable element (utility class `focus-visible:ring-2 …`).
- Form fields have associated `<Label>`.
- Buttons with icons only have `aria-label`.
- Dialogs have title + description (announced to AT).
- Dynamic regions (toasts, status pills) use `aria-live="polite"` (Sonner does this by default).
- Colour is never the sole carrier of meaning (icons + text always present on status badges).
- Sufficient contrast: body text ≥ 4.5:1 against background; secondary text ≥ 3:1.
- Tables have proper `<thead>` / `<tbody>` and scope-appropriate headers.
- Audio players expose play/pause as buttons with state in `aria-pressed`.

---

## 8. Phase deliverables & acceptance per phase

Each phase ends with: `npm run lint` clean, `npm run build` passes, manual smoke against the dev server, and the section in this doc updated with a "Done" checkbox.

- [x] **Phase 0** — `reference/` populated, `src/` scaffolded, `UI-redesign-plan.md` (this doc) authored, build green for placeholder.
- [ ] **Phase 1** — Design tokens + every primitive in `src/components/ui/` rendering correctly in a Storybook-style preview route (temporary `/__ui` route, removed in Phase 2).
- [ ] **Phase 2** — Sidebar (rail + expanded), top bar, mobile sheet + bottom nav, AdminContext, AdminSelectorDialog, service status pill, leaderboard peek dialog, route transitions, all global hotkeys.
- [ ] **Phase 3** — Audio Processor full pipeline; idle → done covers all branches; cancel + clean-up endpoints work; mobile layout verified at 360 px.
- [ ] **Phase 4** — Queue Processor; concurrency works; per-row settings persist; abort on Stop.
- [ ] **Phase 5** — Transcription with IME, all metadata fields, unsuitable + celebration dialogs.
- [ ] **Phase 6** — Validation flow including Play All sequencer.
- [ ] **Phase 7** — Leaderboard with podium animations.
- [ ] **Phase 8** — Statistics dashboard with all 6 recharts charts + KPI cards.
- [ ] **Phase 9** — Channel browser with delete confirmation.
- [ ] **Phase 10** — CSV diff + IME edit + download.
- [ ] **Phase 11** — MUI / Emotion / `@mui/x-charts` removed from `package.json`, `npm prune`, README updated, lint + build green, screenshots / responsive QA captured.

---

## 9. Changelog

| Date       | Phase | Change                                                                  |
| ---------- | ----- | ----------------------------------------------------------------------- |
| 2026-05-09 | 0     | Initial spec authored. Legacy moved to `reference/`. New `src/` scaffolded. |
