# ThinkNRoute

ThinkNRoute is an intelligent LLM routing layer with a Next.js chat interface and a FastAPI backend. It lets you connect multiple model providers, chat in manual mode with a selected provider/model, or switch to auto mode where the system classifies each prompt and routes it to the best available provider.

The goal is to balance quality, speed, cost, local execution, and reliability without forcing the user to choose a model for every request.

## What It Does

- Connects to multiple AI providers from one interface.
- Supports manual provider and model selection.
- Provides auto routing based on prompt intent, task complexity, reasoning needs, code needs, and long-context requirements.
- Uses a fast rule classifier first, then falls back to a local Ollama intent model only when the prompt is ambiguous.
- Selects a suitable model from the connected provider's available and validated models.
- Falls back across providers when the preferred route is unavailable or fails.
- Stores providers, selected models, validation results, and chat history in SQLite.
- Encrypts stored API keys before saving them.
- Builds compact, relevant conversation context through a provider-independent memory engine.
- Shows routing metadata in the UI, including intent, complexity, confidence, provider, model, classifier path, timing, and route reason.

## Tech Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand for client state
- Framer Motion for interface transitions
- Lucide React icons

### Backend

- FastAPI
- Pydantic v2
- SQLite
- httpx
- cryptography / Fernet
- LiteLLM and provider SDK support
- Ollama for local intent classification and local chat models

## Supported Providers

ThinkNRoute currently supports:

- Google Gemini
- Groq
- Cloudflare Workers AI
- Ollama

Ollama can be used without an API key. Cloudflare requires both an API key and `CLOUDFLARE_ACCOUNT_ID`.

## How The System Works

### Manual Mode

In manual mode, the user connects a provider, selects one of its available models, and sends messages directly through that provider/model pair.

Flow:

```text
User message
  -> selected provider/model
  -> context-aware memory packet
  -> provider adapter
  -> response
  -> SQLite chat history
```

The backend validates that the selected model belongs to the selected provider before sending the request.

### Auto Mode

In auto mode, the user only sends a message. ThinkNRoute decides where it should go.

Flow:

```text
User message
  -> rule classifier
  -> optional Ollama intent classifier
  -> routing engine
  -> model selector
  -> context-aware memory packet
  -> provider adapter
  -> failover if needed
  -> response with routing metadata
```

The classifier never answers the prompt. It only returns routing metadata. The final answer always comes from the selected provider/model.

## Routing Logic

The auto router considers:

- Intent: coding, debugging, reasoning, education, mathematics, summarization, translation, creative writing, document analysis, research, conversation, or general chat.
- Complexity: low, medium, or high.
- Whether the prompt needs code generation.
- Whether it needs deeper reasoning.
- Whether it needs a large context window.
- Whether it can reasonably run locally.

Examples of routing behavior:

- Simple greetings and casual chat route to Ollama for local speed.
- Trivial coding tasks can stay local.
- Medium coding tasks prefer Groq.
- High-context or research-heavy tasks prefer Gemini.
- Reasoning, math, education, document analysis, and long summarization tasks generally prefer Gemini.
- If the preferred provider is unavailable, the router tries the failover chain.

Default failover order:

```text
Groq -> Gemini -> Cloudflare -> Ollama
```

The selected provider is tried first, then the remaining providers are tried in failover order.

## Context-Aware Memory

Both manual and auto mode use the same memory engine. Instead of sending the full conversation history every time, the backend builds a compact context packet containing only relevant previous turns.

The memory system tracks:

- Conversation ID
- Thread ID
- Topic keywords
- Relevant prior messages
- Whether the new message appears to start a new topic
- Context selection timing

This keeps provider calls smaller while still preserving useful context.

## Project Structure

```text
ThinkNRoute/
  app/                         Next.js app entry points
  components/                  UI components for chat, providers, routing, layout, and primitives
  hooks/                       Frontend utility hooks
  lib/                         Frontend helpers
  services/                    Frontend API client and inference helpers
  stores/                      Zustand stores for chat, providers, models, settings, and toasts
  types/                       TypeScript domain types
  backend/
    app/
      api/                     FastAPI route modules
      database/                SQLite setup and migrations
      models/                  Pydantic request/response schemas
      providers/               Provider adapter implementations
      services/                Routing, classification, provider, model, storage, chat, and memory services
      config.py                Backend environment configuration
      main.py                  FastAPI app bootstrap
    requirements.txt           Python dependencies
```

## Key Backend Services

- `ChatService`: Handles manual chat, selected model validation, memory context, provider calls, and persistence.
- `AutoRouter`: Orchestrates classification, routing, model selection, failover, provider calls, metadata, and persistence.
- `RuleClassifier`: Fast deterministic classifier for obvious prompts.
- `IntentClassifier`: Ollama-backed classifier for ambiguous prompts.
- `HybridClassifier`: Uses the rule classifier first and calls the intent model only below the confidence threshold.
- `RoutingEngine`: Maps classification metadata to a provider and route reason.
- `ModelSelector`: Chooses the best available model for a provider using preferred model hints and validation state.
- `ProviderService`: Connects/disconnects providers, refreshes models, validates models, and retrieves credentials.
- `ProviderFactory`: Creates and caches provider adapters.
- `StorageService`: Persists encrypted API keys, providers, models, validation results, and chat history.
- `MemoryEngine`: Builds relevant context packets for both manual and auto chat.

## API Overview

Base backend URL:

```text
http://127.0.0.1:8000
```

Interactive API docs:

```text
http://127.0.0.1:8000/docs
```

Main endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend health check |
| `GET` | `/providers` | List provider connection status and available models |
| `POST` | `/providers/connect` | Connect a provider and load/validate models |
| `DELETE` | `/providers/{provider}` | Disconnect a provider |
| `POST` | `/providers/{provider}/refresh_models` | Refresh and revalidate provider models |
| `POST` | `/models/select` | Select the current manual model |
| `GET` | `/models/current` | Get the current manual model |
| `POST` | `/chat` | Send a manual-mode chat message |
| `POST` | `/chat/auto` | Send an auto-routed chat message |
| `GET` | `/chat/history/{conversation_id}` | Load conversation history |

## Environment Variables

### Frontend

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Backend

Create `backend/.env`:

```env
APP_NAME=ThinkRoute AI API
APP_ENV=development
DATABASE_PATH=./data/thinkroute.db
SECRET_KEY=replace-this-in-production
ENCRYPTION_KEY=
PROVIDER_TIMEOUT_SECONDS=30
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001
OLLAMA_BASE_URL=http://127.0.0.1:11434
CLOUDFLARE_ACCOUNT_ID=
```

For production, set `ENCRYPTION_KEY` to a Fernet key. If it is omitted in development, the backend derives an encryption key from `SECRET_KEY`.

## Setup

### 1. Install Frontend Dependencies

```powershell
npm install
```

### 2. Install Backend Dependencies

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### 3. Configure Environment Files

Create `.env.local` in the project root and `backend/.env` using the examples above.

### 4. Start Ollama For Local Classification

Auto mode can use Ollama's `qwen3:4b` model when the rule classifier is uncertain.

```powershell
ollama pull qwen3:4b
ollama serve
```

You can also connect Ollama as a chat provider if you have local chat models installed.

### 5. Run The Backend

From the `backend` directory:

```powershell
uvicorn app.main:app --reload
```

The API will run at:

```text
http://127.0.0.1:8000
```

### 6. Run The Frontend

From the project root:

```powershell
npm run dev
```

The app will run at:

```text
http://localhost:3000
```

## Common Commands

```powershell
npm run dev          # Start the Next.js dev server
npm run build        # Build the frontend
npm run start        # Start the built frontend
npm run lint         # Run Next.js linting
npm run typecheck    # Run TypeScript type checking
```

Backend:

```powershell
cd backend
uvicorn app.main:app --reload
python -m pip install -r requirements.txt
```

## Data And Security Notes

- Provider credentials are encrypted before being stored in SQLite.
- API keys are never returned by the API.
- SQLite data is stored at `backend/data/thinkroute.db` by default.
- Chat messages are persisted with provider/model metadata.
- Model validation results are cached so known-bad models can be avoided.
- `.env`, `.env.local`, build outputs, and dependency folders are ignored by Git.

## Current Status

ThinkNRoute is a working local-first LLM routing prototype with:

- Provider management
- Manual chat
- Auto-routed chat
- Hybrid prompt classification
- Provider failover
- Model validation and model selection
- Context-aware conversation memory
- A full Next.js interface for providers, chat, and inference metadata
