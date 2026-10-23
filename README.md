# gamoraAI | OmniAI — All AI in One Place

A high-performance, minimalist AI aggregator platform inspired by **Linear**, **Notion**, and **Perplexity**. OmniAI unifies frontier AI models into a single interface with model routing, side-by-side comparison arena, and real-time telemetry.

---

## ⚡ Supported AI Providers & Models

| Provider | Model | Badge | Best For | Context |
| :--- | :--- | :--- | :--- | :--- |
| **Anthropic** | Claude 3.5 Sonnet | *Top for Coding & Writing* | Clean code architecture, nuanced prose | 200,000 |
| **OpenAI** | GPT-4o (Omni) | *Best All-Rounder* | Multimodal, general reasoning, tools | 128,000 |
| **Google** | Gemini 1.5 Pro | *2M Context Monster* | Massive document ingests, codebase analysis | 2,000,000 |
| **DeepSeek** | DeepSeek R1 | *Deep Reasoning* | Chain-of-thought mathematical & logic proofs | 64,000 |
| **Groq** | Llama 3.3 70B | *Ultra Fast (300 t/s)* | Sub-second rapid drafting & summaries | 128,000 |
| **Google** | Gemini 2.0 Flash | *Ultra-Value 1M* | High-speed multimodal research | 1,000,000 |
| **OpenAI** | GPT-4o mini | *Economical* | Cost-sensitive high-frequency lookups | 128,000 |
| **Anthropic** | Claude 3.5 Haiku | *Fast & Clever* | Rapid coding & formatting tasks | 200,000 |

---

## 🚀 Key Features

1. **Unified AI Chat**:
   - Switch models mid-conversation or re-run any prompt with alternative models with a single click.
   - Full Markdown rendering with syntax-highlighted code blocks, language badges, copy buttons, and snippet downloads.
   - Collapsible **Chain-of-Thought / Reasoning** trace for reasoning models (DeepSeek R1 / o1).
   - Document & image file attachments.

2. **Smart Model Router**:
   - Analyzes prompt intent, token length, code syntax, mathematical rigor, and speed requirements.
   - Returns transparent recommendations with **Confidence Score**, **Detailed Rationale**, and **Alternative Models**.

3. **Compare AI Arena (Multi-Model Battle)**:
   - Broadcast the same benchmark prompt simultaneously to 2, 3, or 4 models side-by-side.
   - Real-time comparison metrics: Time-to-First-Token, Latency (ms), Generated Tokens, and Cost in USD.
   - Interactive **"Vote Winner"** celebration with confetti!

4. **Specialized AI Studios**:
   - 💻 **Code Architect**: Big-O complexity optimization, security reviews, clean refactoring, test suite generation.
   - ✍️ **Content Crafter**: Long-form engineering blogs, executive briefs, product launch announcements.
   - 🔬 **Deep Researcher**: Multi-angle technical synthesis leveraging Gemini's 2M context window.
   - 📑 **Document Summarizer**: Executive TL;DRs, key technical takeaways, action item extraction.

5. **Prompt Library**:
   - 30+ engineered prompts across Engineering, Product, and Strategy.
   - Create and manage custom prompt templates with variable tags (`{{variables}}`).

6. **Usage & Cost Analytics Dashboard**:
   - Total requests, input/output token audit, average latency, and estimated spend ($USD).
   - Provider distribution meters (Anthropic, OpenAI, Google, Groq, DeepSeek).
   - Filterable telemetry log with one-click **CSV Export**.

7. **Bring Your Own Keys (BYOK) & Security**:
   - Configure API keys at runtime via **Settings > API Keys** or environment variables.
   - Integrated **"Test Connection"** button with live HTTP validation.
   - **Sandbox Mode**: When an API key is not configured, models operate in simulated sandbox mode with model-accurate personas so the UI can be tested without errors.

8. **Database & Persistence**:
   - Full PostgreSQL support (`server/src/db/schema.sql`).
   - Seamless fallback to local persistent store (`server/data/store.json`) when `DATABASE_URL` is omitted.

---

## 🛠️ Quickstart

### 1. Start the Backend Server (Port 3001)
```bash
cd server
npm install
npm run dev
```

### 2. Start the Frontend Client (Port 5173)
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Environment Variables (Optional)

Create a `.env` file in the project root or in `server/.env`:

```env
PORT=3001

# PostgreSQL (Optional - falls back to resilient local JSON store if omitted)
# DATABASE_URL=postgresql://postgres:password@localhost:5432/omniai

# Provider API Keys (Can also be added directly in the UI Settings modal)
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_API_KEY=AIzaSy...
# GROQ_API_KEY=gsk_...
# DEEPSEEK_API_KEY=sk-...
```

---

## 📁 Architecture Overview

```
ai aggregator/
├── client/                     # Vite + React 19 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx     # Collapsible navigation, search & history
│   │   │   ├── Navbar.tsx      # Top bar with model picker & router status
│   │   │   ├── ModelSelector.tsx# Model dropdown with specs & live status
│   │   │   ├── ChatView.tsx    # Unified chat with markdown & code renderer
│   │   │   ├── CompareView.tsx # Side-by-side arena for 2-4 models
│   │   │   ├── SmartRouterView.tsx # Intent analysis & model matchmaker
│   │   │   ├── WorkspacesView.tsx  # 4 specialized studios
│   │   │   ├── PromptLibraryModal.tsx # Prompt library & custom templates
│   │   │   ├── UsageDashboard.tsx  # Token & spend telemetry dashboard
│   │   │   ├── SettingsModal.tsx   # BYOK API key management & test buttons
│   │   │   └── CodeBlock.tsx   # Syntax highlighted snippets with copy/download
│   │   ├── services/api.ts     # SSE streaming & REST API client
│   │   └── types.ts            # Frontend domain models
│   └── tailwind.config.js      # Linear-inspired color palette & dark mode
│
├── server/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql      # PostgreSQL DDL migrations
│   │   │   └── index.ts        # Database manager with local fallback store
│   │   ├── services/
│   │   │   ├── aiProviders.ts  # Unified provider adapter (OpenAI, Anthropic, Gemini, Groq, DeepSeek)
│   │   │   ├── aiRouter.ts     # Smart intent routing engine
│   │   │   └── costCalculator.ts# Official token pricing & estimation
│   │   ├── routes/             # Express endpoints (/chat, /compare, /analytics, etc.)
│   │   └── index.ts            # Server entry point
│   └── data/store.json         # Local persistent database
```
