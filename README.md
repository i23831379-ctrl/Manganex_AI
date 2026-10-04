# MANGANEX AI 🌍

> **AI-Powered Manganese Mineral Prospectivity Mapping**  
> Smart India Hackathon 2026 — Problem Statement SIH26009

<div align="center">

![MANGANEX AI](https://img.shields.io/badge/Status-MVP%20Complete-brightgreen?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4.x-38BDF8?style=for-the-badge&logo=tailwindcss)

</div>

---

> [!IMPORTANT]
> **SCIENTIFIC DISCLAIMER**: MANGANEX AI is an AI-powered mineral exploration **DECISION-SUPPORT** system. AI predictions are NOT proof of actual manganese reserves. All prospectivity scores and targets require independent field verification by qualified geologists before any exploration decisions are made.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Credentials](#demo-credentials)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Documentation](#documentation)

---

## Overview

MANGANEX AI is a full-stack web application that integrates satellite remote sensing analysis, geological intelligence, terrain modelling, and explainable AI to help geologists and data scientists **identify, prioritize, and verify manganese mineral exploration targets** in Central India.

The system simulates a production-grade geological AI workflow — from data ingestion to field verification — in a polished, interactive web interface with role-based access control.

---

## ✨ Features

### 🗺️ GIS Explorer
- Interactive dark-matter basemap powered by **MapLibre GL**
- 4 toggleable geological layers:
  - **Geological Boundaries** — Sausar Group & Tirodi Gneiss formations
  - **ML Prospectivity Zones** — AI-derived high-potential polygons
  - **Structural Lineaments** — Fault lines & minor fractures (dashed cyan)
  - **Geochemical Anomalies** — Soil sampling heatmap (intensity-weighted)
- Clickable target markers with on-map popups
- Side panel with SHAP explainability charts per target

### 🤖 AI / ML Model
- Simulated **Random Forest classifier** producing prospectivity scores (0–1)
- Per-prediction **SHAP value decomposition** explaining top geological features
- Live "Run Prediction" for random coordinates on the Dashboard
- Model version tracking in API responses

### 🎯 Target Prioritization
- Full target table sorted by AI prospectivity score
- Search, filter (All / Verified / Unverified) and rank ordering
- Prospectivity score bar charts with color-coded tiers (High / Medium / Low)
- **Field Visit Log modal** — geologists can record: name, visit date, access difficulty, GPS accuracy, rock sample ID, observations, and AI confidence adjustment
- Notes persisted to `localStorage`, verification flag synced to backend

### 📊 Analytics Dashboard
- KPI cards: Total Targets, Average Prospectivity, High Potential, Verified Sites
- Interactive Recharts visualizations:
  - Score distribution histogram
  - Tier classification pie chart
  - Verification progress over time (line chart)
  - SHAP feature importance bar chart
  - Zone analysis grouped bar chart
  - Score vs. confidence scatter plot

### 📤 Report Export
- **CSV Export** — full target list with field notes, formatted for Excel
- **HTML/PDF Export** — print-ready report with KPIs, table, and disclaimers

### 📥 Data Import
- Drag-and-drop CSV / GeoJSON upload (Admin only)
- 3-phase animated progress: Parsing → ML Model → Saving
- Generates 2–3 new high-prospectivity targets via backend API on import

### 🔐 Authentication & RBAC
- Mock login with two demo roles:
  - **Admin** — full access to all pages
  - **Geologist** — restricted to GIS Explorer and Targets
- JWT-style session persisted to `localStorage`
- Sidebar and routes dynamically filtered per role
- Logout clears session

### 🔔 Activity Feed
- Bell icon with live **unread count badge** in sidebar and mobile top bar
- Dropdown feed with color-coded events (success / info / warning / error)
- Relative timestamps ("just now", "3m ago")
- Per-event dismiss, mark-all-read, and clear-all
- Events fired automatically on: field verification, data import success/failure

### 📱 Mobile-First Design
- Sticky **bottom tab bar** navigation on mobile (iOS-style)
- Responsive mobile top bar with hamburger menu and user avatar
- Full-screen map on mobile with floating layer controls
- All pages adapt from 375px phone widths up to wide desktops

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8 |
| **Styling** | Tailwind CSS v4, custom CSS variables |
| **Maps** | MapLibre GL JS |
| **Charts** | Recharts |
| **State** | @tanstack/react-query, React Context |
| **Routing** | React Router v7 |
| **Icons** | Lucide React |
| **Backend** | FastAPI, Python 3.12+ |
| **ORM** | SQLAlchemy 2.x |
| **Database** | SQLite (dev) |
| **API Client** | Axios |

---

## 📁 Project Structure

```
mangnese exploration/
├── backend/
│   └── app/
│       ├── __init__.py
│       ├── main.py          # FastAPI app entry point
│       ├── config.py        # Settings (pydantic-settings)
│       ├── database.py      # SQLAlchemy engine & session
│       ├── api/
│       │   ├── targets.py   # CRUD endpoints for targets
│       │   └── ml.py        # ML predict & SHAP endpoints
│       ├── models/
│       │   └── target.py    # SQLAlchemy ORM model
│       ├── schemas/
│       │   ├── target.py    # Pydantic schemas
│       │   └── ml.py        # ML response schemas
│       └── services/
│           └── ml_service.py # Simulated Random Forest + SHAP
│
├── frontend/
│   └── src/
│       ├── App.tsx           # Router + Provider tree
│       ├── index.css         # Global styles & design tokens
│       ├── context/
│       │   ├── AuthContext.tsx          # Auth state & mock login
│       │   └── NotificationsContext.tsx # Activity feed state
│       ├── components/
│       │   ├── Layout.tsx               # Sidebar + bottom nav
│       │   ├── ShapChart.tsx            # SHAP bar chart
│       │   ├── FieldVerificationModal.tsx # Field visit log form
│       │   ├── DataImportModal.tsx      # File upload + AI import
│       │   ├── NotificationBell.tsx     # Activity feed dropdown
│       │   └── ProtectedRoute.tsx       # RBAC route wrapper
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   ├── MapExplorer.tsx
│       │   ├── Targets.tsx
│       │   ├── Analytics.tsx
│       │   └── Settings.tsx
│       ├── services/
│       │   └── api.ts         # Axios API client
│       ├── data/
│       │   └── mockGeoData.ts # GeoJSON layers (faults, zones, anomalies)
│       └── utils/
│           └── reportExport.ts # CSV & HTML report generators
│
└── docs/
    └── BUILD_STATUS.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Anaconda (or any virtualenv tool)

### Backend Setup

```bash
# From the project root, navigate to backend
cd backend

# Install FastAPI with extras
pip install "fastapi[standard]" sqlalchemy pydantic-settings

# Start the dev server (from the backend/ directory)
fastapi dev app/main.py
```

The API will be available at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

### Frontend Setup

```bash
# From the project root, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin / Data Scientist** | `admin@manganex.ai` | `demo123` | All pages |
| **Field Geologist** | `geo@manganex.ai` | `demo123` | Map & Targets only |

> The login page has clickable credential buttons for easy access — just click the role card and hit Sign In.

---

## 🏗️ Architecture

```
Browser (React SPA)
      │
      ▼
React Router ──► ProtectedRoute (RBAC)
      │
      ├── AuthContext (mock JWT session)
      ├── NotificationsContext (activity feed)
      └── @tanstack/react-query (server state cache)
              │
              ▼ HTTP/REST
        FastAPI Backend
              │
              ├── /api/targets  ── SQLAlchemy ──► SQLite DB
              └── /api/ml       ── ML Service (simulated RF + SHAP)
```

---

## 📡 API Reference

### Targets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/targets/` | List all exploration targets |
| `POST` | `/api/targets/` | Create a new target |
| `GET` | `/api/targets/{id}` | Get a specific target |
| `PUT` | `/api/targets/{id}/verify` | Mark target as field-verified |

### ML

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ml/predict` | Run prospectivity prediction for lat/lng |
| `GET` | `/api/ml/target/{id}/explanation` | Get SHAP explanation for a target |

---

## 🔑 Environment Variables

| Variable | Scope | Default / Example | Description |
|---|---|---|---|
| `VITE_API_URL` | Frontend | `http://localhost:8000/api` | Base URL for FastAPI backend API |
| `PROJECT_NAME` | Backend | `Manganex AI` | Project title string |
| `DEMO_MODE` | Backend | `true` | Toggles baseline demo simulation vs live engine |
| `ALLOWED_ORIGINS` | Backend | `http://localhost:5173,...` | Comma-separated CORS allowed origins |

---

## 🧪 Testing

### Backend Unit Tests (Pytest)

```bash
cd backend
python -m pytest tests/
```

### Frontend Build Verification

```bash
cd frontend
npm run build
```

---

## 📦 Build & Production Deployment

### Frontend (Netlify / Static SPA)
- **Build Command**: `npm run build`
- **Publish Directory**: `frontend/dist`
- **SPA Routing**: Handled via [`public/_redirects`](frontend/public/_redirects) (`/* /index.html 200`)
- **Environment**: Set `VITE_API_URL` in Netlify dashboard pointing to deployed FastAPI host.

### Backend (FastAPI / Uvicorn)
- **Run Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Dependencies**: Defined in [`backend/requirements.txt`](backend/requirements.txt)

---

## ⚠️ Known Limitations

1. **Simulated Model Baseline**: The prospectivity engine uses a demonstration baseline model suitable for UI evaluation. Real-world deployment requires training on localized satellite and geophysical rasters.
2. **Single-Instance Database**: The backend utilizes SQLite for light single-instance deployment. For multi-node scaling, configure PostgreSQL via SQLAlchemy URI.

---

## 📚 Documentation

| Doc | Description |
|---|---|
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | Master Phase Status Ledger |
| [`docs/BUILD_STATUS.md`](docs/BUILD_STATUS.md) | Build log with phases and architecture |
| [`docs/PHASE_STATUS.md`](docs/PHASE_STATUS.md) | Granular phase ledger |

---

## 🏆 Built For

**Smart India Hackathon 2026**  
Problem Statement: **SIH26009** — AI-Powered Manganese Mineral Prospectivity Mapping  
Domain: Mining / Geosciences / Earth Observation

---

*Built with ❤️ using React, FastAPI, MapLibre GL, and Recharts.*
# Deploy trigger
