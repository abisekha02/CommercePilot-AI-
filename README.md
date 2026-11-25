# CommercePilot AI
### Enterprise Full-Stack E-Commerce & ERP Inventory System with Autonomous AI Features

[![React](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Backend-Django_6_%2B_DRF-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Deploy-Docker_%2B_Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![OpenAPI](https://img.shields.io/badge/API_Docs-Swagger_UI-85EA2D?logo=swagger&logoColor=black)](http://127.0.0.1:8000/api/docs/)

---

## Executive Summary

**CommercePilot AI** is far more than a basic shopping website. It is an end-to-end commercial platform designed to model real-world enterprise business operations:
1. **Customer-Facing Storefront**: High-converting, responsive shopping experience featuring live search, faceted category filters, variant tier selectors, stock availability badges, slide-over cart with free shipping threshold meter, encrypted checkout, and real-time package milestone tracking.
2. **ERP-Style Admin Backoffice**: Comprehensive supply-chain suite with multi-warehouse inventory tracking, atomic stock adjustment auditing, vendor management, Purchase Order (PO) creation, automated goods-receiving stock incrementation, fulfillment pipeline, and sales reporting.
3. **Four Built-in AI Capabilities**:
   - **AI Copywriter**: Generates rich marketing descriptions, SEO metadata, and bullet points.
   - **PilotBot Assistant**: Live catalog-grounded store support chatbot that answers customer inquiries and renders interactive product recommendation cards.
   - **Smart Recommendations**: Suggests complementary items based on customer context and category affinity.
   - **Autonomous Inventory Health Diagnostic**: Identifies critical low-stock items and highlights slow-moving capital with automated promotion strategies.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (React 19 + TypeScript + Tailwind CSS v4)"]
        UI_Store["Customer Storefront\n(Catalog, Cart, Checkout, Order Tracking)"]
        UI_ERP["ERP Backoffice\n(Inventory, POs, Ledger, Analytics, Catalog)"]
        UI_AI["PilotBot AI Shopping Assistant Widget"]
    end

    subgraph API_Gateway["Backend API (Django REST Framework 6.x)"]
        JWT["JWT Auth & Role-Based Access Control\n(Admin, Manager, Warehouse, Customer)"]
        App_Products["Products & Variants Engine"]
        App_Inventory["Inventory & Warehouse Hub\n(Atomic Transactions & Audit Ledger)"]
        App_Orders["Order Fulfillment & Tracking Engine"]
        App_AI["AI Integration Service Layer"]
    end

    subgraph Data["Persistence & External Services"]
        DB[("PostgreSQL / Relational Data Model")]
        AI_Provider["Google Gemini REST API / Heuristic Fallback Engine"]
    end

    UI_Store <-->|REST API + JWT| API_Gateway
    UI_ERP <-->|REST API + JWT| API_Gateway
    UI_AI <-->|REST API| App_AI

    App_Products <--> DB
    App_Inventory <--> DB
    App_Orders <--> DB
    App_AI <--> AI_Provider
```

---

## 🔑 Demo Credentials & Role-Based Access Control (RBAC)

The application includes an **Instant Demo Role Switcher** on both the storefront navbar and login screen. You can switch personas with a single click:

| Role | Username | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| ** Administrator** | `admin` | `AdminPass123!` | Complete access to ERP, Inventory, Catalog Manager, Staff, Orders, and Analytics |
| ** Store Manager** | `manager` | `ManagerPass123!` | Catalog management, AI description generation, Orders, and Sales Analytics |
| ** Warehouse Staff** | `warehouse` | `WarehousePass123!` | Stock adjustments, PO goods-receiving, and Movement ledger |
| ** Customer** | `customer` | `CustomerPass123!` | Browsing, shopping bag, checkout, reviews, and personal order tracking |

---

##  Core Real-World Business Workflows

### 1. Atomic Order Checkout & Stock Allocation
- When a customer checks out, the backend executes a database transaction (`transaction.atomic()`):
  1. Calculates subtotal, 8% tax, and determines if order qualifies for **Free Shipping** (orders > $50).
  2. Creates the `Order` record and snapshots `OrderItem` prices and variant SKUs.
  3. Deducts units from the primary warehouse (`StockItem.quantity_on_hand`).
  4. Automatically records an **Immutable Audit Log** (`StockMovement` with type `OUTBOUND_SALE`).
  5. Instantiates initial milestone in `OrderTimeline` ("Order Confirmed & Payment Authorized").
  6. Empties the customer's cart.

### 2. Multi-Warehouse Stock Adjustments
- Warehouse staff can execute physical inventory cycle counts or scrap damaged items:
  - Selects reason (`ADJUSTMENT_AUDIT`, `ADJUSTMENT_DAMAGE`, `RETURN_RESTOCK`).
  - Inputs delta (+/- units) and reference ID.
  - Updates on-hand quantities while logging the delta in the `StockMovement` ledger.

### 3. Procurement & Purchase Order Receiving
- Store Managers create Purchase Orders (POs) specifying supplier, destination warehouse, and unit costs.
- When shipment arrives at the distribution center, clicking **"Receive Goods"**:
  - Automatically updates `quantity_received`.
  - Increments warehouse stock levels.
  - Records `StockMovement` of type `INBOUND_PURCHASE`.
  - Transitions PO status to `COMPLETED`.

### 4. Interactive Order Milestone Tracking
- Every order features live tracking by reference ID (e.g. `CP-2026-9042`).
- Four-stage progress indicator:
  `Confirmed` ➔ `Warehouse Processing` ➔ `In Transit (with Carrier Code)` ➔ `Delivered`.

---

## 🧠 AI Features Deep-Dive

### 1. Catalog AI Marketing Copywriter
- **Endpoint**: `POST /api/ai/generate-description/`
- **Function**: Takes title, category, and key features. Generates an engaging tagline, 2-3 paragraph marketing description, 4 value bullet points, and SEO search tags.
- **Location**: Accessible inside ERP Catalog Manager ("Add Product" modal).

### 2. PilotBot AI Store Assistant
- **Endpoint**: `POST /api/ai/chat/`
- **Function**: A floating shopping assistant widget that answers customer questions grounded in real catalog inventory (prices, stock, categories) and store policies (free shipping over $50, 30-day returns).
- **Features**: Returns conversational responses accompanied by clickable **Product Cards** right inside the chat window.

### 3. Personalized Product Recommendations
- **Endpoint**: `POST /api/ai/recommendations/`
- **Function**: Recommends complementary and trending products with contextual AI explanations (e.g. *"Frequently paired with items in Audio"* or *"Top-seller with 4.9+ rating"*).

### 4. Autonomous Inventory Health & Velocity Diagnostic
- **Endpoint**: `GET /api/ai/inventory-summary/`
- **Function**: Aggregates live warehouse stock against 30-day sales velocity:
  - Flags critical stockouts (`quantity_on_hand <= min_stock_threshold`) with 1-click PO drafting.
  - Detects slow-moving dormant capital and recommends promotional flash discounts or homepage bundling.

> **💡 Resilient Dual-Engine Design**: Every AI feature supports real Google Gemini REST API keys (`GEMINI_API_KEY`). If no API key is configured or when offline, CommercePilot automatically engages its internal semantic heuristic generator, ensuring 100% functionality with zero setup friction!

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript (Vite bundler)
- **Styling**: Tailwind CSS v4 + Lucide React Icons
- **State & Routing**: React Router v7, Context API (`AuthContext`, `CartContext`)
- **HTTP Client**: Axios with JWT interceptors & guest session management

### Backend
- **Framework**: Python 3.14 + Django 6.x + Django REST Framework
- **Authentication**: SimpleJWT (`rest_framework_simplejwt`) with custom payload claims
- **Database**: PostgreSQL (Production) / SQLite3 (Zero-setup local development fallback)
- **API Documentation**: OpenAPI 3.0 via `drf-spectacular` & Swagger UI
- **Deployment**: Gunicorn WSGI server, WhiteNoise / Staticfiles

---

## 🚀 Quick-Start Local Setup

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed
- Git

### 1. Clone & Setup Backend
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed database with realistic demo data
python manage.py seed_data

# Start Django development server
python manage.py runserver 0.0.0.0:8000
```
Backend API will be live at `http://127.0.0.1:8000/`.
Interactive OpenAPI Swagger docs will be available at `http://127.0.0.1:8000/api/docs/`.

### 2. Setup Frontend
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend Storefront will be live at `http://localhost:5173/`.

---

## 🐳 Docker 1-Command Startup

To run the entire full-stack system with managed PostgreSQL in isolated containers:

```bash
docker-compose up --build
```

Services started:
- `commercepilot_db`: PostgreSQL on port `5432`
- `commercepilot_backend`: Django REST API on port `8000` (auto-migrated and auto-seeded)
- `commercepilot_frontend`: React Vite App on port `5173`

---

## 🧪 Automated Test Suite

Run the full end-to-end integration and unit test suite:

```bash
cd backend
python manage.py test core.tests
```

**Test Coverage Highlights**:
- JWT Authentication & RBAC role permission checks
- Product catalog search, category filtering, and slug resolution
- Customer cart operations (add, quantity increment, remove, clear)
- Atomic checkout transaction and warehouse stock decrement
- Stock adjustment and movement audit logging
- AI Description generation and grounded customer chat assistant
- AI inventory velocity and slow-moving diagnostics

---

## 🌐 Production Deployment Plan

### 1. Frontend — Vercel
1. Push repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Configure Build Command: `npm run build` and Output Directory: `dist`.
5. Set Environment Variable:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com`
6. Click **Deploy**. Vercel will handle automatic SSL, CDN caching, and continuous deployment on every Git push.

### 2. Backend — Render
1. Create a new Web Service on [Render](https://render.com) connected to your repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command**:
   ```bash
   pip install -r requirements.txt && python manage.py migrate && python manage.py seed_data
   ```
4. Set **Start Command**:
   ```bash
   gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
   ```
5. Configure Environment Variables:
   - `SECRET_KEY`: `<your-secure-random-secret-key>`
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `.onrender.com`
   - `DATABASE_URL`: Managed PostgreSQL connection string (Neon or Render Postgres)
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key

### 3. Database — PostgreSQL (Neon / Render)
1. Provision a free PostgreSQL database on [Neon](https://neon.tech) or Render.
2. Copy the connection string (format: `postgres://user:password@host/dbname?sslmode=require`).
3. Set `DATABASE_URL` in your Render backend settings. Django will automatically use `psycopg` to connect to PostgreSQL.

---

## 📄 License
MIT License. Built for portfolio presentation, production demonstration, and enterprise e-commerce architecture evaluation.
