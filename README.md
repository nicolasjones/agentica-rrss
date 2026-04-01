# 🎸 AGENMATICA - Agentic RRSS

**AI-Powered Social Media Automation for Rock Bands**

Sistema agéntico que aprende la esencia de cada banda y genera contenido auténtico para redes sociales.

## 🏗️ Tech Stack

| Component | Technology | Tier |
|-----------|-----------|------|
| Backend API | FastAPI (Python 3.11+) | Render.com free |
| Database | PostgreSQL + pgvector | Render.com free |
| LLM | Llama 13B via Together.ai | Pay-per-token |
| Images | Flux Pro via Replicate | Pay-per-image |
| Frontend | React 18 + Vite | Vercel free |
| Queue | Celery + RabbitMQ (CloudAMQP) | Free tier |
| Cache | Redis | Render.com free |
| Email | SendGrid | Free tier |

## 📁 Project Structure

```
Agentic_RRSS/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # REST endpoints
│   │   ├── core/             # Config, security, dependencies
│   │   ├── db/               # Database connection & session
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   │   ├── ai/           # LLM, embeddings, image gen
│   │   │   ├── social/       # Instagram, TikTok, YouTube APIs
│   │   │   └── analytics/    # Metrics & reporting
│   │   ├── tasks/            # Celery async jobs
│   │   └── utils/            # Helpers
│   ├── tests/
│   ├── alembic/              # DB migrations
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API client
│   │   ├── pages/            # Route pages
│   │   └── utils/            # Helpers
│   ├── package.json
│   └── vite.config.js
├── docs/                     # Documentation
├── scripts/                  # Dev & deploy scripts
├── .github/workflows/        # CI/CD
├── docker-compose.yml        # Local dev environment
└── .env.example              # Environment template
```

## 🚀 Quick Start

```bash
# 1. Clone & setup
cp .env.example .env
# Edit .env with your keys (or leave mocks for development)

# 2. Start services (Docker)
docker-compose up -d

# 3. Run migrations
cd backend && alembic upgrade head

# 4. Start backend
uvicorn app.main:app --reload --port 8000

# 5. Start frontend
cd frontend && npm install && npm run dev
```

## 🔑 API Keys Required

| Service | Required For | Can Mock? |
|---------|-------------|-----------|
| Together.ai | LLM post generation | ✅ Yes |
| Replicate | Image generation | ✅ Yes |
| Instagram Graph API | Network scanning | ✅ Yes (test data) |
| Stripe | Payments | ✅ Yes (test mode) |
| SendGrid | Emails | ✅ Yes |
| CloudAMQP | Job queue | ⚠️ Use local RabbitMQ |

## 📊 MVP Milestones

- **Week 4**: Scanning works, Band Profile created
- **Week 6**: Generating 5 posts/day, 60%+ approval rate
- **Week 8**: Auto-publishing + analytics dashboard
- **Week 10**: 85%+ approval rate, case study ready
- **Week 12**: 5-10 beta customers, $2-4K MRR

## 📄 License

Proprietary - AGENMATICA © 2026
