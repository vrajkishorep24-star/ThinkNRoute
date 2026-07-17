# ThinkRoute AI backend

Phase 1 provides provider management, manual model selection, direct chat, and SQLite conversation history.

## Run

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive documentation is at `/docs`.

Set `ENCRYPTION_KEY` to a Fernet key in production. If omitted in development, the API derives one from `SECRET_KEY`. API keys are never returned by the API.

Supported providers are `openrouter`, `ollama`, `groq`, `nvidia`, and `cloudflare`.

