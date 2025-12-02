# SPEAK-Client

Web-based client application for the SPEAK Audio Scraping Service. This React application provides an intuitive interface for processing YouTube videos into audio clips with transcriptions and viewing comprehensive statistics.

## Features

- 🎬 **YouTube Video Processing**: Extract audio from YouTube videos and split into clips
- 🎙️ **Automated Transcription**: Generate transcriptions for audio clips using Google Cloud Speech-to-Text
- 📊 **Statistics Dashboard**: Comprehensive analytics and visualizations of processed data
- 🌙 **Dark Theme UI**: Modern Material-UI interface with dark theme
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile devices

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Axios** for API communication
- **Recharts & MUI X-Charts** for data visualization
- **Tailwind CSS** for custom styling

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Audio-Scraping-Service** backend running (see [backend repository](https://github.com/SPEAK-ASR/Audio-Scraping-Service))

## Installation

### Quick Start

```bash
# Make installation script executable
chmod +x install.sh

# Run installation
./install.sh
```

### Manual Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Update .env with your backend API URL
nano .env
```

## Configuration

Create a `.env` file in the project root (or copy from `.env.example`):

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_AUDIO_BASE_URL=http://localhost:8000
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `VITE_AUDIO_BASE_URL` | Backend audio serving URL | `http://localhost:8000` |

## Development

### Start Development Server

```bash
# Using the start script
chmod +x start.sh
./start.sh

# Or manually
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Usage

### 1. Process YouTube Videos

1. Navigate to the home page
2. Enter a YouTube URL
3. Select a domain category (e.g., Education, Entertainment)
4. Configure optional settings:
   - VAD Aggressiveness (Voice Activity Detection)
   - Padding durations
5. Click "Split Audio" to begin processing

### 2. Workflow Steps

The application guides you through a multi-step workflow:

1. **Split Audio**: Extract and split audio from YouTube video
2. **Transcribe Clips**: Generate transcriptions for audio clips
3. **Save to Cloud**: Upload clips to cloud storage and database
4. **Complete**: View results and cleanup

### 3. View Statistics

Navigate to the Statistics page (`/statistics`) to view:

- Total videos and audio clips processed
- Transcription status and rates
- Category-wise duration breakdown
- Daily transcription trends
- Admin contributions
- Audio duration distribution
- Transcription metadata (gender, noise, code-mixing, etc.)

## API Integration

The client communicates with the Audio-Scraping-Service backend through the following endpoints:

### YouTube Processing

- `POST /api/v1/split-audio` - Split YouTube video into clips
- `POST /api/v1/transcribe-clips` - Transcribe audio clips
- `POST /api/v1/save-clips` - Save clips to cloud storage and database
- `DELETE /api/v1/delete-audio/{video_id}` - Delete audio files
- `POST /api/v1/clean-transcriptions/{video_id}` - Clean null transcriptions

### Statistics

- `GET /api/v1/statistics` - Get all statistics
- `GET /api/v1/statistics/summary` - Get summary data
- `GET /api/v1/statistics/categories` - Get category durations
- `GET /api/v1/statistics/transcription-status` - Get transcription status
- `GET /api/v1/statistics/daily` - Get daily transcriptions
- `GET /api/v1/statistics/admin-contributions` - Get admin contributions
- `GET /api/v1/statistics/audio-distribution` - Get audio distribution

## Project Structure

```
SPEAK-Client/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, icons, etc.
│   ├── components/      # React components
│   │   ├── AudioClipsDisplay.tsx
│   │   ├── CompletionView.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Footer.tsx
│   │   ├── LoadingState.tsx
│   │   ├── Navigation.tsx
│   │   ├── ProgressIndicator.tsx
│   │   ├── StatisticsFloatingButton.tsx
│   │   ├── TranscriptionView.tsx
│   │   ├── YoutubeUrlInput.tsx
│   │   └── statistics/  # Statistics components
│   ├── lib/             # Utilities and API
│   │   ├── api.ts       # Main API client
│   │   ├── statisticsApi.ts  # Statistics API
│   │   └── utils.ts     # Helper functions
│   ├── pages/           # Page components
│   │   ├── index.ts
│   │   └── StatisticsPage.tsx
│   ├── theme/           # MUI theme configuration
│   │   └── theme.ts
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── .env.example         # Environment variables example
├── .gitignore          # Git ignore rules
├── eslint.config.js    # ESLint configuration
├── index.html          # HTML entry point
├── install.sh          # Installation script
├── package.json        # NPM dependencies
├── postcss.config.js   # PostCSS configuration
├── README.md           # This file
├── start.sh            # Development server script
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## Deployment

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Deployment Options

#### Option 1: Static Hosting (Vercel, Netlify, etc.)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in your hosting platform:
- `VITE_API_BASE_URL`: Your production backend API URL
- `VITE_AUDIO_BASE_URL`: Your production backend URL

#### Option 2: Docker

```dockerfile
# Example Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Option 3: Traditional Web Server

Serve the `dist/` directory with any web server (Apache, Nginx, etc.)

### Environment Configuration

For production deployments, ensure:

1. Backend API is accessible from the client
2. CORS is properly configured on the backend
3. Environment variables are set correctly
4. HTTPS is enabled (recommended)

## Troubleshooting

### Common Issues

**Issue**: Cannot connect to backend API
- **Solution**: Verify `VITE_API_BASE_URL` in `.env` is correct and backend is running

**Issue**: CORS errors
- **Solution**: Ensure backend CORS configuration includes your client URL

**Issue**: Build fails
- **Solution**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Issue**: Port 5173 already in use
- **Solution**: Either stop the process using that port or modify Vite config to use a different port

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is part of the SPEAK ASR system.

## Related Projects

- [Audio-Scraping-Service](https://github.com/SPEAK-ASR/Audio-Scraping-Service) - Backend API service
- [Transcription-Service](https://github.com/SPEAK-ASR/Transcription-Service) - Transcription management service

## Support

For issues and questions, please open an issue on the GitHub repository
