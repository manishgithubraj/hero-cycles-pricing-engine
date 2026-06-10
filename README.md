# 🚲 Hero Cycles Pricing Engine

A full-stack web application for Hero Cycles' sales team to build cycle configurations and instantly get itemized price quotes — replacing Excel sheets with a proper digital pricing system.

## Features

- **Pricing Engine** — Select parts, set quantities, add margin %, get instant breakdown
- **Parts Manager** — Add/edit parts, update prices with full audit history
- **Quote History** — Save, search, view, and print past quotes
- **Dashboard** — Stats and charts for parts and quote activity
- **Price Snapshot** — Saved quotes lock prices at creation time

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 + FastAPI |
| Database | SQLite + SQLAlchemy ORM |
| Frontend | React 18 + React Router |
| Charts | Recharts |
| Styling | Custom CSS |

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# → http://localhost:8000
# → Swagger UI: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /categories | List all categories |
| GET | /parts | List all parts (filter by category) |
| POST | /parts | Add new part |
| PUT | /parts/{id} | Edit part |
| DELETE | /parts/{id} | Soft-delete part |
| POST | /parts/{id}/update-price | Update price + log history |
| GET | /parts/{id}/price-history | Full price change log |
| POST | /quotes/calculate | Calculate quote (no save) |
| POST | /quotes/save | Save quote with snapshot |
| GET | /quotes | List all saved quotes |
| GET | /dashboard/stats | Dashboard statistics |

## Project Structure

```
hero-cycles/
├── backend/
│   ├── main.py          # FastAPI app + routes
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── crud.py          # Database operations
│   ├── database.py      # DB connection
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── PricingEngine.js
│   │   │   ├── PartsManager.js
│   │   │   └── QuoteHistory.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── docs/
    └── DOCUMENTATION.md
```

## Assignment Requirements Coverage

| Requirement | Status |
|-------------|--------|
| Problem questions & assumptions | ✅ docs/DOCUMENTATION.md |
| Pseudocode | ✅ docs/DOCUMENTATION.md |
| Interactive backend | ✅ FastAPI with 12+ endpoints |
| Interactive UI | ✅ React SPA |
| AI prompt used | ✅ docs/DOCUMENTATION.md |
| GitHub repo | ✅ (this repo) |
