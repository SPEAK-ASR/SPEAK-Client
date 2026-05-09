# SPEAK-Client

Single-page React client for the SPEAK platform. The app now hosts every operator-facing workflow: ingest YouTube videos, review transcription/validation queues from the standalone FastAPI Transcription-Service, monitor leaderboards, and control admin settings – all while keeping the Sinhala phonetic IME experience identical to the legacy SSR interface.

## Features

- 🎬 **YouTube Audio Pipeline**: Kick off video ingestion, VAD-based audio splitting, transcription, and cloud persistence against the Audio-Scraping-Service backend.
- 📝 **Transcription Workspace**: Fetch random clips, fill rich metadata, toggle Sinhala IME, mark unsuitable audio, and submit with a single hotkey-friendly UI.
- ✅ **Validation Console**: Inspect queued submissions, compare against audio, update metadata, and track completion stats in real time.
- 🏅 **Admin Leaderboard & Shortcuts**: Switch admins with `Ctrl + \\`` (backtick) anywhere in the app, view floating leaderboards, and keep contributions transparent.
- 🇱🇰 **Sinhala Phonetic IME**: The original `sin-phonetic-ime.js` script loads from `public/` and is attached automatically via `useSinhalaIme` so every textarea matches the legacy typing experience.
- 📊 **Statistics Dashboard**: Continue to view analytics from the Audio-Scraping-Service, including daily trends, domain mixes, and admin breakdowns.

## Tech Stack

- **React 19 + TypeScript** powered by **Vite**
- **Tailwind CSS v4** + **Radix UI** primitives (shadcn-style components in [`src/components/ui/`](src/components/ui))
- **framer-motion** for route + element transitions, **Sonner** for toasts
- **Recharts** for the statistics dashboard
- **lucide-react** icon set, **class-variance-authority** + **clsx/tailwind-merge** for variants
- **React Router** for page-level routing
- **Axios** API clients for both backend services
- Sinhala IME served as a plain script and wired through a custom hook

The full design specification — tokens, component inventory, every page breakdown, motion + a11y rules — lives in [UI-redesign-plan.md](UI-redesign-plan.md). A snapshot of the previous Material UI implementation is preserved under [`reference/`](reference/) for review and is excluded from `tsconfig`, Vite, and ESLint.

## Prerequisites

- **Node.js** v18+ and **npm** v9+
- **Audio-Scraping-Service** running (YouTube ingestion + statistics)
- **Transcription-Service** running (FastAPI backend that now exposes transcription, validation, leaderboard APIs)

## Installation

### Quick Start

```bash
chmod +x install.sh
./install.sh
```

### Manual Installation

```bash
npm install
cp .env.example .env
# Edit .env to point at both backend services
```

## Configuration

Define all backend endpoints in `.env` (see `.env.example`):

```env
# Audio-Scraping-Service (YouTube ingestion, statistics)
VITE_AUDIO_SCRAPING_API_URL=http://localhost:8000/api/v1
VITE_AUDIO_SCRAPING_BASE_URL=http://localhost:8000

# Transcription-Service (FastAPI)
VITE_TRANSCRIPTION_API_URL=http://localhost:5000/api/v1
```

| Variable                       | Description                              | Default                        |
| ------------------------------ | ---------------------------------------- | ------------------------------ |
| `VITE_AUDIO_SCRAPING_API_URL`  | REST base URL for Audio-Scraping-Service | `http://localhost:8000/api/v1` |
| `VITE_AUDIO_SCRAPING_BASE_URL` | Direct host serving generated audio      | `http://localhost:8000`        |
| `VITE_TRANSCRIPTION_API_URL`   | FastAPI Transcription-Service base URL   | `http://localhost:5000/api/v1` |

> Both services enforce CORS; ensure your Vite dev server (`http://localhost:5173`) and production domain are whitelisted.

## Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build / Preview / Lint
npm run build
npm run preview
npm run lint
```

Scripts `start.sh` and `install.sh` wrap the same commands for convenience.

## Usage

### 1. Ingest & Split YouTube Videos

1. Open **Audio processor** (`/audio-processor`), paste a YouTube URL, and choose a domain.
2. Optionally tweak VAD aggressiveness and padding.
3. Start the pipeline to push work into the Audio-Scraping-Service; monitor progress across the standard stages (split → transcribe → save → complete).

### 2. Transcription Workspace

- Navigate to `/transcription` for the new SPA replacement of the legacy SSR form.
- `Get Audio` fetches `/audio/random` from the Transcription-Service and streams using `VITE_AUDIO_SCRAPING_BASE_URL`.
- Sinhala IME attaches automatically once the script loads; status is shown inline.
- Capture metadata (gender, noise, code mixing, overlaps) and optionally mark clips as unsuitable with a supporting note.
- Submit to `/transcription`; admins persist with the global context, so you always receive credit.

### 3. Validation Console

- Navigate to `/validation` to pull `/validation/next` tasks.
- Review stats from `/validation/stats`, edit metadata, and push updates via `PUT /validation/{transcription_id}`.
- Toggle admin reference copy for quick template text when needed.

### 4. Leaderboard & Admin Tools

- The floating action button opens the leaderboard fed by `/admin/leaderboard?range=week|month|all`.
- Press `Ctrl + \\`` (backtick) anywhere to open the admin selector dialog and switch identities; the choice is persisted in local storage.
- The same dialog outlines shortcuts, Sinhala IME info, and troubleshooting tips.

### 5. Statistics

All previous `/statistics/*` visualizations remain available under `/statistics`, still backed by the Audio-Scraping-Service.

## API Integration

### Audio-Scraping-Service (existing)

- `POST /api/v1/split-audio` – Split YouTube videos.
- `POST /api/v1/transcribe-clips`
- `POST /api/v1/save-clips`
- `DELETE /api/v1/delete-audio/{video_id}`
- `POST /api/v1/clean-transcriptions/{video_id}`
- `GET /api/v1/statistics/*` – Summary, categories, transcription status, daily trends, admin contributions, audio distribution.

### Transcription-Service (new SPA-driven UI)

- `GET /audio/random` – Fetch queued audio (signed URL + metadata).
- `POST /transcription` – Submit new transcription payloads with metadata + admin info.
- `GET /validation/next` – Retrieve next transcription awaiting validation.
- `PUT /validation/{transcription_id}` – Update/approve validation.
- `GET /validation/stats` – Counters for pending/completed totals.
- `GET /admin/leaderboard?range=all|week|month` – Aggregated admin contributions for floating leaderboard + standalone page.

## Project Structure Highlights

```
SPEAK-Client/
├── public/
│   └── sin-phonetic-ime.js          # Legacy Sinhala IME served verbatim
├── reference/                       # Snapshot of the previous MUI build
├── UI-redesign-plan.md              # Design system + per-page spec
├── src/
│   ├── assets/profiles/*            # Admin profile pictures
│   ├── components/
│   │   ├── ui/                      # shadcn-style primitives (Button, Card, Dialog, …)
│   │   ├── layout/                  # AppLayout, Sidebar, TopBar, MobileNav, AdminGate, PageHeader
│   │   ├── audio/                   # AudioPlayer, MiniAudioPlayer
│   │   ├── transcription/           # GuidelinesCard, AudioCard, ReferenceCard, Editor, Dialogs, ActionBar
│   │   ├── stats/ChartCard.tsx      # Chart wrapper + palette
│   │   └── admin/AdminSelectorDialog.tsx
│   ├── context/AdminContext.tsx     # Global admin state + Ctrl+` shortcut
│   ├── hooks/
│   │   ├── useSinhalaIme.ts         # Attaches global IME controller
│   │   ├── useServiceStatus.ts      # Polls backend health endpoints
│   │   └── useChannelCards.ts
│   ├── lib/
│   │   ├── api.ts                   # Audio-Scraping-Service client
│   │   ├── transcriptionServiceApi.ts
│   │   ├── statisticsApi.ts
│   │   ├── motion.ts                # framer-motion presets
│   │   ├── keyboard.ts              # useHotkey
│   │   └── utils.ts                 # cn(), formatters
│   ├── pages/
│   │   ├── AudioProcessorPage.tsx
│   │   ├── QueueProcessorPage.tsx
│   │   ├── TranscriptionPage.tsx
│   │   ├── ValidationPage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   ├── StatisticsPage.tsx
│   │   ├── ChannelBrowserPage.tsx
│   │   └── CsvNormalizationPage.tsx
│   ├── App.tsx / main.tsx           # Router + AdminProvider
│   ├── index.css                    # Tailwind v4 @theme tokens
│   └── types/                       # Shared TS types (queue, channel, transcription, IME)
└── ... standard Vite config files
```

## Deployment

1. Build: `npm run build` → emits `dist/` assets.
2. Host via Vercel/Netlify/static server or the sample multi-stage Dockerfile below.

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
```

Remember to configure all three environment variables wherever the site is hosted.

## Troubleshooting

- **Sinhala IME not available** → Ensure `sin-phonetic-ime.js` is served (check DevTools network) and the script is not blocked by a CSP.
- **Auth/CORS errors** → Confirm both backend services whitelist the client origin and that URLs in `.env` have matching schemes/ports.
- **Missing audio playback** → `VITE_AUDIO_SCRAPING_BASE_URL` must match the host serving `/output` audio; if proxied, expose signed URLs accordingly.
- **Leaderboard empty** → The Transcription-Service must be on the latest API build exposing `/admin/leaderboard` and seeded with admin data.

## Contributing

1. Fork the repo and create a feature branch.
2. Run `npm run lint` + `npm run build` before opening a PR.
3. Include screenshots or clips when adding UI changes to keep the workflow easy to verify.

## Related Projects

- [Audio-Scraping-Service](https://github.com/SPEAK-ASR/Audio-Scraping-Service)
- [Transcription-Service](https://github.com/SPEAK-ASR/Transcription-Service)

## Support

Please open an issue in this repository if you encounter bugs or have feature requests.
