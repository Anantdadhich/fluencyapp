# Contributing to FluentScribe 🤝

Thank you for your interest in contributing to FluentScribe! We welcome contributions from developers of all skill levels to help make language learning accessible, engaging, and collaborative.

---

## 🚀 How to Get Started

### 1. Fork and Clone
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/fluencyapp.git
   cd fluencyapp
   ```

### 2. Set Up Local Environment
Ensure you have **Node.js** (v18+) installed.
1. Install package dependencies:
   ```bash
   npm install
   ```
2. Start the unified Next.js + Socket.io signaling server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:3000`.

*Note: Since FluentScribe is a Bring-Your-Own-Key (BYOK) app, you do NOT need to set up any environment variables or `.env` files. Simply enter your Gemini API key inside the onboarding screen of the web interface.*

---

## 🛠️ Development Guidelines

### Coding Conventions
- **TypeScript**: The codebase is written entirely in TypeScript. Avoid using `any` type declarations; write proper interfaces and types.
- **Components**: Component styling follows a custom **neobrutalist notebook theme** (cream background `#faf8f2`, thick slate borders `border-2 border-slate-800`, thick solid shadows). Keep new features aligned with this style.
- **API Security**: Do not add server-side key fallbacks. Ensure API endpoints read keys dynamically from cookies.

### Branching and Pull Requests
1. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/amazing-new-drill
   ```
2. Make your changes and commit using clean messages:
   ```bash
   git commit -m "feat: add interactive pronunciation feedback to teleprompter"
   ```
3. Push your branch to your fork:
   ```bash
   git push origin feature/amazing-new-drill
   ```
4. Open a Pull Request (PR) against the `main` branch of the primary repository. Explain your changes and specify what view or components were modified.
