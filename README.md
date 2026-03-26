# Financial Dashboard AI — Household Financial Manager

A full-stack application for financial advisors to manage client household data. It ingests Excel files for structured household information and uses AI (Gemini) to process audio conversations for enrichment and insights.

---

## Current Status

**Frontend / UI Layer – 100% Complete** ✅
**Backend / API Layer – 100% Complete** ✅

The UI is **pixel-perfect** to the test HTML mockup created and includes:
- Full shell layout with sidebar
- Households listing page with stats cards and interactive table
- Household detail page with financial overview, members, accounts, and AI audio insight section
- Insights dashboard with pure CSS bar charts and legend-style distributions
- Modal-based upload experience for both Excel and Audio
- Toast notification system for user feedback
- Proper Next.js routing and client-side interactions

---

## Tech Stack

| Layer              | Choice                                      |
|--------------------|---------------------------------------------|
| Framework          | Next.js 16 (App Router)                     |
| Language           | TypeScript                                  |
| Styling            | Plain CSS (custom design system, no Tailwind) |
| UI Components      | React + Lucide React Icons                  |
| Database           | PostgreSQL (Neon.tech)                      |
| AI                 | Gemini 2.5 Flash Lite via Google AI Studio  |
| Excel Parsing      | `xlsx` library                              |
| Charts             | Pure CSS (Recharts planned for future)      |
| Hosting            | Vercel                                      |

---

## Project Structure

```bash
root/
├── app/
│   ├── layout.tsx                      ✅ Root layout
│   ├── page.tsx                        ✅ Redirect to /households
│   ├── globals.css                     ✅ All styles from original mockup
│   ├── households/
│   │   ├── page.tsx                    ✅ Listing page + stats + table
│   │   └── [id]/
│   │       └── page.tsx                ✅ Detail page (dynamic)
│   └── insights/
│       └── page.tsx                    ✅ Insights dashboard with charts
│
├── components/
│   ├── Sidebar.tsx                     ✅ Navigation
│   ├── Modal.tsx                       ✅ Pure CSS modal
│   ├── Toast.tsx                       ✅ Toast notifications
│   ├── useToast.ts                     ✅ Toast hook
│   ├── UploadExcel.tsx                 ✅ Drag & drop Excel uploader
│   └── UploadAudio.tsx                 ✅ Audio uploader with preview
│
├── lib/
│   ├── db.ts                           ✅ Postgres pool
│   ├── migrate.js                      ✅ DB schema migration
│   ├── excelParser.ts                  ✅ Flexible Excel parser with fuzzy matching
│   └── gemini.ts                       ✅ Audio processing with Gemini
│
├── app/api/
│   ├── households/
│   │   ├── route.ts                    ✅ GET all, POST
│   │   └── [id]/
│   │       └── route.ts                ✅ GET detail, PATCH
│   ├── upload/
│   │   ├── excel/route.ts              ✅ Excel processing with upsert
│   │   └── audio/route.ts              ✅ Audio + Gemini insight extraction
│   └── insights/
│       └── route.ts                    ✅ Aggregated insights (7 chart datasets)
│
├── package.json
├── tsconfig.json
├── .env.example
└── README.md                          ✅ this file
```

---

## Database Schema

```sql
households       — core entity: name, income, net_worth, liquid_net_worth, expense_range, tax_bracket, risk_tolerance, time_horizon, notes
members          — belongs to household: name, dob, email, phone, relationship, address
accounts         — belongs to household: account_number, custodian, account_type, account_value, ownership_distribution
bank_details     — belongs to household: bank_name, account_number, routing_number
audio_insights   — belongs to household: transcript, summary, extracted_updates (JSONB)
```

---

## Pages

### `/households` — Household Listing
- Table of all households
- Columns: name, income, net worth, members count, accounts count, total AUM
- Upload Excel button (opens modal or inline)
- Click row → navigates to detail

### `/households/[id]` — Household Detail
- Header: household name + key stats (income, net worth, risk tolerance)
- Tabs or sections: Members | Accounts | Bank Details | Audio Insights
- Upload Audio button (tied to this household)
- Shows AI-extracted transcript + summary from last audio

### `/insights` — Insights Dashboard
- Stat cards: total households, total AUM, average net worth
- Charts:
  1. Bar chart — Net Worth by Household
  2. Bar chart — Income by Household
  3. Pie chart — Account distribution by type
  4. Pie chart — Account distribution by custodian
  5. Bar chart — Members per household
  6. Pie chart — Risk tolerance distribution

---

## Setup Instructions

### 1. Clone and install
```bash
git clone <repo>
cd <project-folder>
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
```
Fill in:
- `DATABASE_URL` — from Neon.tech (postgresql://...)
- `GEMINI_API_KEY` — from aistudio.google.com

### 3. Run DB migration
```bash
npm run db:migrate
```
This creates all 5 tables in your Neon database.

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 5. Deploy to Vercel
```bash
npx vercel
```
Add `DATABASE_URL` and `GEMINI_API_KEY` as environment variables in Vercel dashboard.

---

## Assumptions

- Excel files may have variable column names — parser uses fuzzy matching on normalized keys
- A household is identified by name (case-insensitive); re-uploading the same Excel enriches existing data rather than duplicating
- Audio files are always uploaded against a specific household (selected from dropdown)
- Gemini processes audio natively (no separate STT step needed)
- Incomplete or ambiguous audio data is stored as notes rather than overwriting structured fields

---

## What AI Does

1. **Excel**: Rule-based parser with fuzzy column matching handles variable headers across sheets
2. **Audio**: Gemini 1.5 Flash receives the raw audio file, returns a structured JSON with transcript, summary, and extracted field updates — which are then applied to the household record automatically