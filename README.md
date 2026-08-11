<div align="center">

# 🎙️ Vaani: AI Voice-First Communication Assistant

**The most secure, private, and accessible voice assistant for Email & Messaging.**

[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.0_Flash-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)

[Explore Docs](./DOCUMENTATION.md) · [Report Bug](https://github.com/vaani/vaani/issues) · [Request Feature](https://github.com/vaani/vaani/issues)

</div>

---

## 🌊 Overview

**Vaani** (Voice-Based Email & Messaging Assistant) is a cutting-edge, voice-first platform designed to make digital communication seamless, secure, and accessible. Whether managing email threads via Gmail or staying connected on Telegram, Vaani acts as your intelligent intermediary, processing voice commands with on-device biometrics, high-fidelity speech recognition, and privacy-preserving AI summarization.

Built with a **Privacy-First** ethos, Vaani ensures sensitive data is sanitized before reaching cloud models while offering full voice-guided navigation for accessible daily communication.

---

## ✨ Key Features

### 🎙️ Voice-First Interaction
- **Speech-to-Text (STT)**: Continuous Web Speech API recognition with intent classification.
- **Natural Text-to-Speech (TTS)**: Voice responses for email summaries, incoming chat messages, and status updates.
- **Natural Language Understanding**: Smart command mapping (e.g., *"Read Telegram messages from Sarah and reply saying I'll arrive in 10 minutes"*).

### 🔐 Multi-Factor Security & Privacy
- **On-Device Biometrics**: Face mesh and facial landmark detection powered by TensorFlow.js and MediaPipe.
- **Voice PIN Verification**: Two-factor authentication (2FA) for high-sensitivity operations.
- **Gemini Hard Boundary Middleware**: Hardened PII detection and sanitization that strips passwords, OTPs, and personal identity tokens before cloud AI transmission.

### ✉️ Multi-Platform Integration
- **Gmail Adapter**: Complete email lifecycle management (Inbox reading, SMTP sending via Nodemailer, IMAP sync via ImapFlow, and Gemini thread summarization).
- **Telegram Bot API**: Real-time channel and chat messaging through custom serverless webhooks.
- **Unified Communication Dashboard**: Control accounts and settings through a single responsive voice interface.

---

## 🛠️ Complete Tech Stack

| Domain | Core Technologies & Libraries | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **[React 18](https://react.dev/)**, **[Vite 5](https://vitejs.dev/)**, **[TypeScript 5](https://www.typescriptlang.org/)** | Single Page Application (SPA) with strict typing and fast HMR |
| **Client-Side Routing** | **[React Router DOM v6](https://reactrouter.com/)** | Client-side page navigation (`/`, `/login`, `/register`, `/gmail`, `/telegram`, `/settings`) |
| **Styling & Design System** | **[Tailwind CSS v3](https://tailwindcss.com/)**, **[PostCSS](https://postcss.org/)**, **[Radix UI](https://www.radix-ui.com/)** | Accessible headless primitives, custom theme tokens, dark mode, glassmorphism |
| **UI Components & Icons** | **[Shadcn UI](https://ui.shadcn.com/)**, **[Lucide React](https://lucide.dev/)**, **[Recharts](https://recharts.org/)**, **[Sonner](https://sonner.emilkowal.ski/)** | Data visualization, toast notifications, carousels, accessible dialogs |
| **State & Async Management** | **[TanStack React Query v5](https://tanstack.com/query)**, **[React Hook Form](https://react-hook-form.com/)**, **[Zod](https://zod.dev/)** | Asynchronous data fetching, cached states, and runtime schema validation |
| **AI & NLP** | **[Google Generative AI (@google/generative-ai)](https://www.npmjs.com/package/@google/generative-ai)** | Google Gemini 2.0 Flash integration for intent resolution and message summarization |
| **On-Device Biometrics** | **[TensorFlow.js (@tensorflow/tfjs)](https://www.tensorflow.org/js)**, **[MediaPipe (@mediapipe/face_mesh)](https://mediapipe.dev/)** | Face Mesh landmark extraction for passwordless biometric login |
| **Backend & Serverless API** | **[Vercel Serverless Functions](https://vercel.com/docs/functions)** | Node.js TypeScript serverless endpoints in [`/api`](./api/) (`ai.ts`, `gmail.ts`, `telegram.ts`, `health.ts`) |
| **Database & Auth Services** | **[Firebase Auth](https://firebase.google.com/docs/auth)**, **[Cloud Firestore](https://firebase.google.com/docs/firestore)**, **[Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)** | Persistent user authentication and encrypted profile storage |
| **Protocols & Ingestion** | **[ImapFlow](https://imapflow.com/)**, **[Nodemailer](https://nodemailer.com/)**, **[Telegram Webhook API](https://core.telegram.org/bots/api)** | Direct IMAP email parsing, SMTP sending, and Telegram Webhook integration |
| **Testing & Tooling** | **[Vitest 3](https://vitest.dev/)**, **[Testing Library](https://testing-library.com/)**, **[ESLint 9](https://eslint.org/)** | Unit/integration test runner and modern flat configuration linting |

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[User Voice Input] --> B[Web Speech STT Engine]
    B --> C[Intent Detection Controller]
    C --> D{Platform Router}
    
    D --> E[Gmail Adapter / ImapFlow]
    D --> F[Telegram Bot Adapter]
    
    E & F --> H[AI Privacy Layer / Sanitizer]
    H --> I[Google Gemini API]
    I --> J[Action Results & Summaries]
    
    J --> K[Web Speech TTS Engine]
    K --> L[User Audio Feedback]
    
    subgraph "On-Device Security Boundary"
        M[Face Mesh / TensorFlow.js]
        N[Voice PIN 2FA Engine]
        M & N --> D
    end

    subgraph "Vercel Serverless Layer (/api)"
        O[api/ai.ts]
        P[api/gmail.ts]
        Q[api/telegram.ts]
        R[api/health.ts]
    end
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm` (v9+) or `yarn` / `pnpm`
- **Firebase Project**: Enabled Auth & Cloud Firestore instance
- **API Credentials**: Google Gemini API key, Telegram Bot Token

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vaani/vaani.git
   cd vaani
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the project root:
   ```env
   # Firebase Configuration (Client)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
   VITE_FIREBASE_APP_ID=your_app_id

   # AI & Platform Credentials
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token

   # Serverless & Admin (Production / Vercel)
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ```

4. **Launch Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:8080` in your browser.

---

## 🧪 Testing & Code Quality

Vaani includes unit tests, boundary isolation tests, and linting rules:

```bash
# Run complete Vitest suite (36+ tests)
npm run test

# Type check codebase
npx tsc --noEmit

# Lint code with ESLint 9
npm run lint

# Build production bundle (with Rollup manual chunking)
npm run build
```

---

## 📦 Production Deployment

### Vercel Deployment
The application includes a optimized [`vercel.json`](./vercel.json) configured for static SPA routing and serverless function hosting in `/api`.

1. **Push code** to your GitHub/GitLab repository.
2. **Import project** in Vercel.
3. Add environment variables under **Project Settings -> Environment Variables**.
4. Deploy! Vercel automatically runs `npm run build` and binds serverless function handlers in `/api`.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">

Made with ❤️ by Aditya Singh

[Back to top](#-vaani-ai-voice-first-communication-assistant)

</div>

