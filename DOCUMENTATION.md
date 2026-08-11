# 📚 Vaani Technical Documentation & Architecture Guide

Welcome to the comprehensive technical documentation for **Vaani** — an AI-powered, voice-first communication assistant built for hands-free email management, cross-platform messaging, and biometric authentication.

---

## 📑 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Voice State Machine](#-voice-state-machine)
3. [Installation & Local Setup](#-installation--local-setup)
4. [Environment Configuration](#-environment-configuration)
5. [Intent Engine & Command Mapping](#-intent-engine--command-mapping)
6. [Biometric Security & 2FA](#-biometric-security--2fa)
7. [Privacy & Sanitization Engine](#-privacy--sanitization-engine)
8. [Platform Integrations](#-platform-integrations)
   - [Gmail Integration](#gmail-integration)
   - [Telegram Integration](#telegram-integration)
   - [WhatsApp & Outlook Integration](#whatsapp--outlook-integration)
9. [API Endpoints & Serverless Functions](#-api-endpoints--serverless-functions)
10. [Troubleshooting & Gotchas](#-troubleshooting--gotchas)

---

## 🏗️ System Architecture

Vaani operates using a multi-stage event processing pipeline:

```text
┌────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│ Browser Mic    │ ──► │ Web Speech API (STT)  │ ──► │ NLU & Intent Parser   │
└────────────────┘     └───────────────────────┘     └───────────┬───────────┘
                                                                 │
┌────────────────┐     ┌───────────────────────┐                 ▼
│ Text-to-Speech │ ◄── │ Platform Orchestration│ ◄── ┌───────────────────────┐
│ System (TTS)   │     │ (Gmail/Telegram/Auth) │     │ PII Privacy Sanitizer │
└────────────────┘     └───────────────────────┘     └───────────────────────┘
```

1. **Audio Input**: Continuous audio stream captured via Web Speech API (`SpeechRecognition`).
2. **Intent Parsing**: Natural language intent classifier extracts actions (e.g. `READ_EMAILS`, `SEND_TELEGRAM`) and entity parameters (e.g. recipients, messages).
3. **Privacy Sanitizer**: Intercepts outgoing text to strip PII (passwords, OTPs, SSNs, credit cards) before calling cloud AI models.
4. **Platform Execution**: Calls platform adapters (Gmail OAuth/IMAP, Telegram Webhooks, Biometric Auth).
5. **Speech Synthesis**: Converts text responses into spoken voice output via Web Speech Synthesis (`SpeechSynthesisUtterance`).

---

## 🎙️ Voice State Machine

The voice runtime controller (`voiceStateController.ts` & `stateMachine.ts`) manages discrete operational states:

| State | Description | Mic Status |
| :--- | :--- | :--- |
| `DORMANT` | Standby mode listening only for wake word ("Hey Vaani") | Active (Low Sensitivity) |
| `LISTENING` | Active turn accepting user commands | Active (High Sensitivity) |
| `RESPONDING` | Vaani is speaking via Text-to-Speech (TTS) | Paused (`TTS` Reason) |
| `PROCESSING` | Backend API / AI summarization in progress | Paused (`PROCESSING` Reason) |
| `AUTH_REGISTER` | Voice-guided 5-step registration flow | Active (Step Context) |
| `AUTH_LOGIN` | Face recognition & voice PIN verification | Active (Step Context) |
| `ERROR` | Hardware mic exception or permission denial | Paused (Click to Retry) |

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Browser**: Google Chrome or Brave (for Web Speech API support)

### Step 1: Clone Repository
```bash
git clone https://github.com/adit-syntax/Vaani.git
cd Vaani
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Step 4: Launch Local Development Server
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in Chrome.

---

## 🔐 Environment Configuration

Create a `.env` file in the root directory with the following configuration keys:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Gemini AI Key
VITE_GEMINI_API_KEY=your_gemini_api_key

# Telegram Bot Integration
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.vercel.app/api/telegram
```

---

## 🧠 Intent Engine & Command Mapping

Vaani's intent mapper (`intentMap.ts`) uses fuzzy pattern matching and phrase parsing:

### Common Voice Commands

| Voice Trigger Phrase | Action Intent | Target Platform |
| :--- | :--- | :--- |
| *"Hey Vaani"* | `WAKE_UP` | System |
| *"I want to login"* | `LOGIN` | System / Auth |
| *"I want to register"* | `REGISTER` | System / Auth |
| *"Check unread emails"* | `READ_EMAILS` | Gmail |
| *"Summarize inbox"* | `SUMMARIZE_INBOX` | Gmail |
| *"Compose email to Sarah"* | `COMPOSE_MAIL` | Gmail |
| *"Read Telegram message from Alex"* | `READ_CHAT` | Telegram |
| *"Reply saying I will be there in 10 minutes"* | `REPLY_CHAT` | Telegram / WhatsApp |
| *"Log me out"* | `LOGOUT` | System |

---

## 🔒 Biometric Security & 2FA

Vaani implements zero-knowledge hands-free security combining facial liveness with voice PIN:

1. **Facial Landmark Mesh**: Uses `@tensorflow-models/face-landmarks-detection` and MediaPipe to detect facial landmarks and eye blink liveness locally inside browser WebGL context.
2. **Voice PIN (Bcrypt Hashed)**: Parses spoken 4-digit PINs (e.g. *"1 2 3 4"* → `"1234"`). PIN hashes are computed using `bcryptjs` with 10 salt rounds.
3. **Step Validation**: Password input during registration enforces a minimum 6-character length rule immediately at the `PASSWORD` step.

---

## 🛡️ Privacy & Sanitization Engine

Before sending draft content to cloud LLMs (Gemini), the Privacy Sanitizer (`privacy/sanitizer.ts`) runs local regex masking:

- **Email Addresses**: Replaced with `[EMAIL_REDACTED]`
- **Phone Numbers**: Replaced with `[PHONE_REDACTED]`
- **Passcodes / OTPs**: Replaced with `[AUTH_CODE_REDACTED]`
- **Credit Cards**: Replaced with `[CARD_REDACTED]`

---

## ✉️ Platform Integrations

### Gmail Integration
- **OAuth2 Flow**: Intercepts Google OAuth tokens for secure scope delegated email access.
- **IMAP / SMTP Sync**: Uses `imapflow` for background sync and `nodemailer` for outgoing messages.

### Telegram Integration
- **Bot Setup**: Register bot via [@BotFather](https://t.me/botfather).
- **Set Webhook**:
  ```bash
  npm run set-webhook
  ```
  Sets the Telegram webhook URL to `/api/telegram`.

---

## 🌐 API Endpoints & Serverless Functions

The serverless API endpoints are located in the `/api` directory for Vercel functions:

- `GET /api/health`: Returns server status and adapter health checks.
- `POST /api/ai`: Proxy endpoint for Gemini AI queries.
- `POST /api/telegram`: Webhook target receiving incoming Telegram messages.
- `POST /api/gmail`: Gmail message retrieval & draft proxy.

---

## ❓ Troubleshooting & Gotchas

### 1. Microphone throws `audio-capture` error
- **Cause**: Chrome blocks Web Speech API if microphone permissions have not been explicitly requested via `getUserMedia`.
- **Solution**: Vaani handles this automatically by calling `requestAudioPermission()` during startup gesture.

### 2. Audio Chimes & Text-to-Speech silent
- **Cause**: Browsers suspend `AudioContext` until a user gesture occurs on the page.
- **Solution**: Vaani includes auto-resume listeners (`unlockAudio()`) on first click, keydown, or touch event.

### 3. Password Error at Registration
- **Rule**: Passwords must be at least 6 characters long. Vaani will prompt you immediately at the password step if fewer characters are spoken.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
