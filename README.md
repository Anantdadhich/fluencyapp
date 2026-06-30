# FluentScribe 🗣️✨

FluentScribe is an open-source, premium, gamified language learning and communication practice application built with **Next.js**, **WebSockets**, and **Gemini AI**. Featuring a tactile, warm-cream neobrutalist notebook aesthetic, FluentScribe helps users master pronunciation, vocabulary register, negotiation flow, and conversational pacing.

---

## 🌟 Key Features

### 1. Duolingo-Style Gamified Practice Paths
- **5-Heart Lives Pool**: Interactive simulations deduct hearts for dialogues scoring `< 6/10` in fluency.
- **Mascot Speech Coach**: Get real-time correction advice, vocabulary upgrades, and register suggestions directly from an owl mascot panel.
- **XP Stars Scorecard**: Collect XP points and earn up to a 3-star rating on completed speech exercises.

### 2. Fluency Match (Live 1:1 Peer Portal)
- Connect with other English learners in real-time.
- **Immersive PIP Display**: Your face floats in a small picture-in-picture card in the corner of the full-screen remote caller feed.
- **Live Peer Chat**: Chat using an inline text feed while speaking.
- Built on direct, peer-to-peer **WebRTC** tunnels with WebSocket signaling.

### 3. Speech & Grammar Hubs
- **Speech Diagnostic**: Detailed assessment of speech tone, speed, and structural errors.
- **Grammar Hub**: Core verb tenses and sentence flow drills.
- **Vocab Class**: Master executive register networking phrasing.
- **Elevator Pitch Teleprompter**: Interactive speech pacing exercise with teleprompter timing.
- **Confidence Studio**: Practice speaking mirrors and breath control drills.

### 4. Enterprise-Grade BYOK Security
- Enforces a strict **Bring-Your-Own-Key (BYOK)** security design.
- The hosting server does not require any environment variables or credentials. Users securely provide their own Gemini API keys stored directly inside local client-side cookie scopes.

### 5. Ultra-Low Latency Conversational AI
- Prioritizes the lightweight `gemini-2.5-flash-lite` model for interactive dialogue turns, reducing response time by up to 40%.
- Smart JSON sanitization filters code blocks and backticks to prevent server-side parsing errors.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js App Router (React, TypeScript), Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend & Signaling**: Custom Node.js HTTP server wrapper with Socket.io.
- **AI Integration**: Google Gen AI SDK.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (v18+) installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally
We use a unified custom server ([server.js](server.js)) to host the Next.js page compiler and the WebSocket matching signaling server on the same port:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser and insert your Gemini API Key in the onboarding screen to start practicing!

*Note: Since FluentScribe is a client-side BYOK application, no `.env` file or server key configuration is required.*

---

## 🤝 Contributing

We love contributions! Whether you are fixing a bug, adding new speech personas, or improving the mobile responsive layout, feel free to submit a pull request.

Please review our [CONTRIBUTING.md](CONTRIBUTING.md) for local setup steps, coding standards, and PR guidelines.

---

## 📦 Deployment

### Platform Hosting (Render, Railway, Fly.io, VPS)
Because **Fluency Match** relies on a persistent WebSocket signaling backend, the project must be deployed to a platform that supports running a continuous Node.js server wrapper:
1. Trigger a production build:
   ```bash
   npm run build
   ```
2. Start the unified web application:
   ```bash
   npm run start
   ```

### Vercel Deployment (Serverless)
If you deploy directly on Vercel:
1. The static pages, API routes, and Gemini exercises will deploy and function perfectly.
2. The WebSocket matchmaking server will **not** run natively on Vercel's serverless nodes. You can host the signaling backend separately (e.g. on Render) and point the socket client to it inside [`talk.tsx`](src/components/talk.tsx).
