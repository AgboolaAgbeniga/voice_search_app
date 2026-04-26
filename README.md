# 🎙 AI Voice Search

A sleek, AI-powered voice search assistant built with **Next.js 14** and the **NVIDIA NIM API**. Ask any question by voice and receive instant, concise AI-generated answers — spoken back to you.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![NVIDIA](https://img.shields.io/badge/NVIDIA_NIM-API-76B900?logo=nvidia)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎤 **Voice Input** | Tap the mic and speak your question — speech-to-text via the Web Speech API |
| 🤖 **AI Answers** | Get direct, concise summary answers powered by NVIDIA NIM (LLaMA, DeepSeek, etc.) |
| 🔊 **Text-to-Speech** | Answers are read aloud automatically (toggleable) |
| 🎙 **Auto-Mic Mode** | Continuous listening — after an answer, the mic restarts automatically for hands-free Q&A |
| 📜 **Conversation History** | All Q&A pairs are displayed in a scrollable timeline with timestamps |
| 🌙 **Dark UI** | Premium dark theme with glassmorphism, waveform animations, and micro-interactions |
| 📱 **Mobile-First** | Fully responsive — designed for phones, tablets, and desktops |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- **NVIDIA API Key** — get one free at [build.nvidia.com](https://build.nvidia.com)
- **Chrome / Edge** browser (for Web Speech API support)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/voice_search_app.git
cd voice_search_app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and add your NVIDIA API key:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
# Required — your NVIDIA NIM API key
NVIDIA_API_KEY=nvapi-YOUR_KEY_HERE

# Model to use (see https://build.nvidia.com/models for options)
NVIDIA_MODEL=meta/llama-3.1-8b-instruct
```

**Available models** (query the API or browse [build.nvidia.com](https://build.nvidia.com)):

| Model ID | Description |
|---|---|
| `meta/llama-3.1-8b-instruct` | Fast, general-purpose (recommended) |
| `meta/llama-3.3-70b-instruct` | Higher quality, slower |
| `deepseek-ai/deepseek-v4-flash` | Fast reasoning model |
| `google/gemma-3-27b-it` | Google's Gemma 3 |
| `mistralai/mistral-large-2-instruct` | Mistral Large |

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge.

---

## 🎯 How to Use

1. **Tap the microphone** button in the center
2. **Speak your question** (e.g., *"What is the speed of light?"*)
3. **Wait ~1.5 seconds** — the app auto-detects when you stop speaking
4. The AI processes your question and returns a **concise summary answer**
5. The answer is **spoken aloud** (if voice is enabled) and displayed on screen

### Controls

| Control | What it does |
|---|---|
| 🔊 **Voice toggle** | Turn AI voice reading on/off |
| 🎙 **Auto toggle** | Enable hands-free mode — mic restarts after each answer |
| **CLEAR** button | Wipe the conversation history |
| **Mic button** | Tap to start/stop listening manually |

---

## 🏗 Project Structure

```
voice_search_app/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts        # NVIDIA NIM API endpoint
│   ├── globals.css              # Design system & animations
│   ├── layout.tsx               # Root layout with fonts
│   └── page.tsx                 # Main app UI
├── components/
│   ├── Spinner.tsx              # Loading spinner
│   └── Waveform.tsx             # Audio waveform visualizer
├── lib/
│   └── nvidia-client.ts         # NVIDIA OpenAI-compatible client
├── types/
│   └── index.ts                 # TypeScript interfaces
├── .env.example                 # Environment template
├── .env.local                   # Your local env (gitignored)
├── next.config.js               # Next.js config
├── package.json
└── tsconfig.json
```

---

## 🔧 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript 5
- **AI Backend:** [NVIDIA NIM API](https://build.nvidia.com/) via OpenAI-compatible SDK
- **Speech-to-Text:** Web Speech API (browser-native)
- **Text-to-Speech:** Web Speech Synthesis API (browser-native)
- **Styling:** Vanilla CSS with CSS variables, glassmorphism, and keyframe animations

---

## 📝 API Reference

### `POST /api/search`

Sends a question to the NVIDIA NIM API and returns a concise answer.

**Request:**
```json
{
  "query": "What is quantum computing?"
}
```

**Response:**
```json
{
  "answer": "Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, enabling certain calculations to be performed exponentially faster than classical computers.",
  "model": "meta/llama-3.1-8b-instruct"
}
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add `NVIDIA_API_KEY` and `NVIDIA_MODEL` to Environment Variables
4. Deploy

### Docker

```bash
docker build -t voice-search .
docker run -p 3000:3000 --env-file .env.local voice-search
```

---

## ⚠️ Browser Compatibility

| Browser | Speech-to-Text | Text-to-Speech |
|---|---|---|
| Chrome | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Safari | ⚠️ Partial | ✅ |
| Firefox | ❌ | ✅ |

> **Note:** The Web Speech Recognition API requires Chrome or Edge for full functionality.

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
