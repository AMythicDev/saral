.PHONY: install dev-backend dev-frontend dev help

help:
	@echo "Saral — Hackathon Commands:"
	@echo "  make install       Install both backend and frontend dependencies"
	@echo "  make dev-backend   Run FastAPI backend on http://localhost:8000"
	@echo "  make dev-frontend  Run Next.js frontend on http://localhost:3000"
	@echo "  make dev           Run both simultaneously"

install:
	cd backend && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
	cd frontend && npm install

dev-backend:
	cd backend && ./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting FastAPI backend (port 8000) and Next.js frontend (port 3000)..."
	make dev-backend & make dev-frontend
