#!/bin/bash
# ============================================
# AGENMATICA - Quick Setup Script
# Run: chmod +x scripts/setup.sh && ./scripts/setup.sh
# ============================================

set -e

echo "🎸 AGENMATICA - Setting up development environment"
echo "=================================================="

# 1. Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3.11+ required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 20+ required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required for local DB/Redis"; exit 1; }

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "  Python: $PYTHON_VERSION ✓"
echo "  Node: $(node -v) ✓"
echo "  Docker: $(docker -v | cut -d' ' -f3) ✓"

# 2. Environment file
echo ""
echo "📝 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  Created .env from .env.example ✓"
    echo "  ⚠️  Edit .env if you have API keys (optional for dev)"
else
    echo "  .env already exists ✓"
fi

# 3. Start Docker services
echo ""
echo "🐳 Starting Docker services (PostgreSQL + Redis + RabbitMQ)..."
docker-compose up -d db redis rabbitmq
echo "  Waiting for services..."
sleep 5

# Check DB is ready
until docker exec agenmatica_db pg_isready -U agenmatica > /dev/null 2>&1; do
    echo "  Waiting for PostgreSQL..."
    sleep 2
done
echo "  PostgreSQL ✓"
echo "  Redis ✓"
echo "  RabbitMQ ✓ (management: http://localhost:15672)"

# 4. Enable pgvector extension
echo ""
echo "🔧 Enabling pgvector extension..."
docker exec agenmatica_db psql -U agenmatica -d agenmatica -c "CREATE EXTENSION IF NOT EXISTS vector;" > /dev/null 2>&1
echo "  pgvector enabled ✓"

# 5. Backend setup
echo ""
echo "🐍 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "  Virtual environment created ✓"
fi

source venv/bin/activate
pip install -r requirements.txt -q
echo "  Dependencies installed ✓"

# 6. Run migrations (or create tables)
echo ""
echo "📦 Setting up database tables..."
python3 -c "
import asyncio
from app.db.session import init_db
asyncio.run(init_db())
print('  Tables created ✓')
" 2>/dev/null || echo "  ⚠️  Tables will be created on first run"

cd ..

# 7. Frontend setup
echo ""
echo "⚛️  Setting up frontend..."
cd frontend
npm install --silent 2>/dev/null
echo "  Dependencies installed ✓"
cd ..

# 8. Summary
echo ""
echo "=================================================="
echo "🎸 AGENMATICA setup complete!"
echo "=================================================="
echo ""
echo "To start development:"
echo ""
echo "  Backend:   cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  Frontend:  cd frontend && npm run dev"
echo "  Worker:    cd backend && celery -A app.core.celery_app worker --loglevel=info"
echo "  Beat:      cd backend && celery -A app.core.celery_app beat --loglevel=info"
echo ""
echo "  API docs:  http://localhost:8000/api/v1/docs"
echo "  Frontend:  http://localhost:5173"
echo "  RabbitMQ:  http://localhost:15672 (guest/guest)"
echo ""
echo "  Mock mode is ON — no API keys needed for development 🚀"
echo ""
