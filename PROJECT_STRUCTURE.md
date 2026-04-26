# VoiceSearch AI - Project Structure

## 📁 Directory Structure

```
voice_search_app/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── search/
│   │       └── route.ts         # API endpoint for search
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                  # Reusable components
│   ├── Waveform.tsx            # Waveform animation component
│   └── Spinner.tsx             # Loading spinner component
├── lib/                        # Utility functions
│   ├── search-providers.ts     # Web search integrations (Brave, Serper, Tavily)
│   └── nvidia-client.ts        # NVIDIA API client initialization
├── types/                      # TypeScript type definitions
│   └── index.ts               # Shared types (SearchResponse, AppState, etc.)
├── public/                     # Static assets (favicons, etc.)
├── .env.local                 # Environment variables
├── next.config.js             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies
└── README.md                  # Project documentation
```

## 🏗️ Project Architecture

### App Router (`/app`)
- **layout.tsx**: Root layout with metadata and font imports
- **page.tsx**: Main client component with voice search UI
- **globals.css**: Mobile-first CSS with responsive design
- **api/search/route.ts**: POST endpoint for search queries

### Components (`/components`)
- **Waveform.tsx**: Animated waveform visualization
- **Spinner.tsx**: Loading spinner UI

### Utilities (`/lib`)
- **search-providers.ts**: Web search integrations
  - `searchBrave()`: Brave Search API
  - `searchSerper()`: Serper.dev API
  - `searchTavily()`: Tavily API
  - `getWebResults()`: Determines available provider
- **nvidia-client.ts**: NVIDIA API client setup
  - `getNvidiaClient()`: OpenAI client configured for NVIDIA
  - `getModel()`: Returns configured model name

### Types (`/types`)
- **index.ts**: All shared TypeScript interfaces
  - `SearchResponse`: API response type
  - `AppState`: State machine type
  - `SpeechRecognitionInstance`: Web Speech API types

## 🚀 Key Features

- **Mobile-first design** with responsive CSS
- **Voice-to-search** using Web Speech API
- **Web search integration** (Brave, Serper, or Tavily)
- **AI-powered answers** via NVIDIA free models
- **TypeScript** for type safety
- **Component isolation** for maintainability

## 📝 Environment Variables

```env
NVIDIA_API_KEY=your-nvidia-key
NVIDIA_MODEL=deepseek-ai/deepseek-r1  # Optional, defaults to deepseek-r1

# Web Search (pick one):
BRAVE_SEARCH_API_KEY=your-key
# OR
SERPER_API_KEY=your-key
# OR
TAVILY_API_KEY=your-key
```

## 🔄 Path Aliases

TypeScript paths are configured in `tsconfig.json`:
```json
"paths": { "@/*": ["./*"] }
```

Usage examples:
- `import { Waveform } from "@/components/Waveform"`
- `import type { SearchResponse } from "@/types"`
- `import { getWebResults } from "@/lib/search-providers"`

## 📦 Build & Run

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

---

This structure follows Next.js 14+ best practices for scalability and maintainability.
