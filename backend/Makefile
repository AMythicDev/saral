.PHONY: install dev lint

install:
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

lint:
	ruff check app/
	ruff format --check app/
