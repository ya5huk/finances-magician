# Finances Magician — Full Product Spec

## Context

A personal finance tracking app for a single user. Tracks income, expenses, investments, funds, deposits, debt, and physical assets — all in one place. Data comes from PDF uploads (parsed by AI) and manual entry. The goal is to always know: how much do I have, where is it, and how much did I actually put in vs. what it's worth now.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth with Google provider, restricted to a single whitelisted email (stored in `.env`)
- **Styling**: Tailwind CSS only (no component library). Dark mode only. Shared component kit for consistency.
- **Charts**: Recharts
- **PDF Parsing**: Gemini API (few actions/month, ~cents). Research local/open model option on Vercel for security — fallback to Gemini.
- **Stock Prices**: Yahoo Finance API (free, no auth required). Fetch live on page load.
- **Currency Rates**: Free FX API (e.g., exchangerate.host or similar). Historical + current rates.
- **PWA**: Installable on home screen (manifest + service worker), no offline data or push notifications.
- **Deployment**: Vercel

---

## Authentication & Security

- Google Sign-In via Supabase Auth
- Only one email is allowed to sign in (defined in `ALLOWED_EMAIL` env var)
- Auth flow: user signs in with Google → server checks if email matches `ALLOWED_EMAIL` → if not, session is destroyed and access denied
- All Supabase tables have RLS policies: only the authenticated user's `user_id` can read/write their data
- All API keys, secrets, and email stored in environment variables (never in client code)
- App only accessible via Vercel deployment domain

---

## Database Schema (Supabase / PostgreSQL)

### Core Tables

**`profiles`**
- `id` (uuid, PK, references auth.users)
- `email` (text)
- `display_name` (text)
- `base_currency` (text, default 'ILS')
- `created_at`, `updated_at`

**`fund_types`** — user-configurable fund/account categories
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `name` (text) — e.g., "Pension", "Education Fund", "Locked Deposit", "Savings"
- `category` (enum: 'pension', 'education_fund', 'deposit', 'custom')
- `is_active` (boolean)
- `created_at`

**`payslips`**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `date` (date) — pay period
- `gross_salary` (numeric)
- `net_salary` (numeric)
- `tax` (numeric)
- `bituach_leumi` (numeric)
- `health_tax` (numeric)
- `pension_employee` (numeric)
- `pension_employer` (numeric)
- `hishtalmut_employee` (numeric)
- `hishtalmut_employer` (numeric)
- `overtime` (numeric)
- `bonus` (numeric)
- `vacation_days_balance` (numeric)
- `sick_days_balance` (numeric)
- `currency` (text, default 'ILS')
- `source_file_url` (text, nullable) — reference to uploaded PDF in Supabase Storage
- `notes` (text, nullable)
- `created_at`

**`expenses`**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `date` (date)
- `description` (text) — merchant/transaction name
- `amount` (numeric)
- `currency` (text)
- `category_id` (uuid, FK → expense_categories, nullable)
- `source_file_url` (text, nullable)
- `notes` (text, nullable)
- `created_at`

**`expense_categories`**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text) — e.g., "Groceries", "Restaurants", "Transport"
- `is_active` (boolean)
- `created_at`

**`stock_trades`**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `ticker` (text) — e.g., "AAPL", "TSLA", TASE tickers
- `exchange` (text) — e.g., "NASDAQ", "TASE", "LSE"
- `trade_type` (enum: 'buy', 'sell')
- `quantity` (numeric)
- `price_per_share` (numeric)
- `currency` (text)
- `exchange_rate_at_trade` (numeric) — FX rate to ILS at time of trade
- `fees` (numeric, default 0)
- `broker` (text)
- `trade_date` (date)
- `lot_id` (uuid, nullable) — for FIFO/LIFO tax lot tracking, links sells to buys
- `notes` (text, nullable)
- `created_at`

**`dividends`**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `ticker` (text)
- `amount` (numeric)
- `currency` (text)
- `date` (date)
- `notes` (text, nullable)
- `created_at`

**`fund_entries`** — pension, education fund, deposits, etc.
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `fund_type_id` (uuid, FK → fund_types)
- `entry_type` (enum: 'contribution', 'withdrawal', 'value_snapshot')
- `amount` (numeric)
- `currency` (text)
- `date` (date)
- `source_description` (text, nullable) — where the money came from/went to
- `notes` (text, nullable)
- `created_at`

**`deposits`** — locked deposits (פקדונות) with terms
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `fund_type_id` (uuid, FK → fund_types)
- `bank` (text)
- `principal` (numeric)
- `currency` (text)
- `interest_rate` (numeric) — annual %
- `start_date` (date)
- `maturity_date` (date)
- `projected_value` (numeric) — calculated at maturity
- `notes` (text, nullable)
- `created_at`

**`loans`** — mortgage, car loans, etc.
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text) — e.g., "Mortgage", "Car Loan"
- `principal` (numeric)
- `remaining_balance` (numeric)
- `currency` (text)
- `interest_rate` (numeric)
- `monthly_payment` (numeric)
- `start_date` (date)
- `end_date` (date, nullable)
- `notes` (text, nullable)
- `created_at`, `updated_at`

**`physical_assets`**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text) — e.g., "Car", "Apartment"
- `current_value` (numeric)
- `currency` (text)
- `last_valued_at` (date)
- `notes` (text, nullable)
- `created_at`, `updated_at`

**`asset_value_history`** — snapshots for physical assets over time
- `id` (uuid, PK)
- `asset_id` (uuid, FK → physical_assets)
- `user_id` (uuid, FK)
- `value` (numeric)
- `currency` (text)
- `date` (date)
- `notes` (text, nullable)
- `created_at`

**`cashflow_corrections`** — manual balance adjustments
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `corrected_balance` (numeric)
- `currency` (text)
- `date` (date)
- `reason` (text, nullable)
- `created_at`

**`exchange_rates`** — cached historical + current FX rates
- `id` (uuid, PK)
- `base_currency` (text)
- `target_currency` (text)
- `rate` (numeric)
- `date` (date)
- UNIQUE constraint on (base_currency, target_currency, date)

**`uploaded_documents`** — tracks all uploaded PDFs
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `file_name` (text)
- `file_url` (text) — Supabase Storage URL
- `document_type` (enum: 'payslip', 'credit_card_statement')
- `parsed_data` (jsonb) — raw AI extraction result for reference
- `status` (enum: 'processing', 'parsed', 'error')
- `created_at`

### RLS Policies
- Every table: `user_id = auth.uid()` for SELECT, INSERT, UPDATE, DELETE
- `exchange_rates`: readable by any authenticated user (shared reference data)

---

## Navigation Structure (6 Tabs)

Bottom tabs on mobile, sidebar on desktop:

1. **Overview** — Net worth, cash, invested vs. current value summary, mini portfolio chart
2. **Portfolio** — Stock holdings (flat list), trade history, dividends, performance
3. **Income** — Payslip history, upload payslip PDFs, manual entry
4. **Expenses** — Transaction list, categories, upload credit card PDFs, manual entry
5. **Funds & Deposits** — Pension, education fund, locked deposits (with maturity timeline & projected values), debt/loans
6. **Assets** — Physical assets with value history

### Global Elements
- **FAB (Floating Action Button)**: Always visible '+' button. Opens a menu:
  - Upload PDF (payslip or credit card statement)
  - Add Income Entry
  - Add Expense
  - Add Stock Trade
  - Add Fund Entry
  - Add/Edit Asset
  - Add Loan
  - Correct Cash Balance
- **Currency selector**: Per-section currency display (ILS / USD / GBP / EUR)
- **Settings**: Accessible from sidebar/header. Manage fund types, expense categories, base currency

---

## Feature Details

### PDF Upload & AI Parsing
1. User drops/uploads a PDF via the FAB or within a section
2. PDF is uploaded to Supabase Storage
3. Server sends PDF to Gemini API with a structured prompt requesting specific fields
4. For **payslips**: extract gross, net, tax, bituach leumi, health tax, pension (employee + employer), hishtalmut (employee + employer), overtime, bonus, vacation/sick days balance
5. For **credit card statements**: extract each individual transaction (date, merchant, amount, currency). Record installment purchases as monthly charge amount only.
6. AI also auto-categorizes expenses (assigns category from user's existing categories or suggests new ones)
7. Extracted data is saved to DB immediately
8. UI shows the parsed results in an **editable form** on the same page — user can review and correct any values
9. Document stored in `uploaded_documents` with raw `parsed_data` JSON for audit trail

### Stock Portfolio
- **Adding trades**: Ticker, exchange, buy/sell, quantity, price, currency, date, broker, fees, notes
- **Tax lot tracking**: Buy trades create lots. Sell trades linked to buy lots via FIFO by default. Tracks cost basis per lot.
- **Live prices**: Fetched from Yahoo Finance API on page load for all held tickers. No caching — always fresh.
- **Display**: Flat list of positions (merged across brokers). Each shows:
  - Ticker & name
  - Current price & daily change
  - Total shares held
  - Average cost basis
  - Total invested (sum of all buy lots)
  - Current value
  - Unrealized P&L (% and absolute)
  - All in chosen display currency
- **Charts**: Portfolio value over time (1M / 3M / 6M / YTD / 1Y / ALL)
- **Dividends**: Separate section/list showing dividend income per ticker and total

### Income (Payslips)
- List of all payslips, sortable by date
- Each payslip shows all extracted fields
- Upload or manually add
- Monthly/yearly income charts

### Expenses
- List of all transactions, sortable by date
- Category filter
- AI auto-categorization (editable)
- Upload credit card PDF or manual entry
- Monthly/yearly spending charts by category
- Each transaction: date, description, amount, currency, category, notes

### Funds & Deposits
- **Fund types**: User-configurable (pension, education fund, etc.) via settings
- **Fund entries**: Track contributions (with source description) and periodic value snapshots
- **Invested vs. current**: Per fund, show total contributed vs. latest snapshot value
- **Deposits (פקדונות)**: Track principal, interest rate, start/maturity dates, bank
  - Show projected value at maturity
  - Timeline view of upcoming maturities
- **Debt (Loans)**: Track name, principal, remaining balance, interest rate, monthly payment, dates
  - Net position shown (funds minus debt)

### Physical Assets
- List of assets with current estimated value
- Manual value snapshots over time
- Value history chart per asset
- Counts toward net worth

### Overview Dashboard
- **Net worth**: Total across all categories (cash + stocks + funds + deposits + assets - debt), with breakdown bar/pie
- **Invested vs. current value**: Combined across all investment types (stocks + funds + deposits)
- **Cash**: Auto-calculated (starting value + income - expenses - investments, with manual corrections)
- **Mini portfolio chart**: Small stock portfolio performance chart
- **Recent activity**: Last few transactions/entries across all categories
- Per-section currency display (ILS / USD / GBP / EUR)

### Currency Handling
- **Supported currencies**: ILS, USD, GBP, EUR
- **Per-section display currency**: Each tab/section has its own currency selector
- **Historical rates**: Store exchange rate at time of each transaction. Used for accurate gain/loss calculations.
- **Current rates**: Fetched for display conversions
- **FX trend charts**: Show how currency movements affected returns over time (1M / 3M / 6M / YTD / 1Y / ALL)

### Cashflow
- Computed: `starting_balance + sum(payslip.net_salary) - sum(expenses) - sum(fund_contributions) - sum(stock_buys) + sum(stock_sells) + sum(dividends)`
- Manual correction: user can enter their actual bank balance at any time → app records the discrepancy in `cashflow_corrections`
- Ongoing calculation uses the latest correction as new baseline

---

## Shared UI Component Kit

Build a consistent component library used throughout (all Tailwind, dark mode only):

- **Button** (primary, secondary, ghost, destructive variants)
- **Input** (text, number, date, currency-amount with currency selector)
- **Select** (single, with search for tickers/categories)
- **Card** (metric card, chart card, list item card)
- **Modal / Drawer** (for forms, mobile-friendly bottom drawer)
- **Table** (sortable, with mobile-responsive card fallback)
- **FAB** (floating action button with expandable menu)
- **Tabs** (bottom nav mobile, sidebar desktop)
- **Badge** (for status, categories, currency)
- **Chart wrappers** (line, bar, pie — consistent styling around Recharts)
- **FileUpload** (drag & drop zone for PDFs)
- **Toast** (success/error notifications)
- **Empty state** (consistent empty state for sections with no data)
- **Loading skeleton** (consistent loading states)

---

## API Routes (Next.js Route Handlers)

- `POST /api/upload` — Upload PDF to Supabase Storage, trigger AI parsing
- `POST /api/parse` — Send PDF to Gemini, return structured data
- `GET /api/stocks/prices` — Fetch live prices from Yahoo Finance for given tickers
- `GET /api/exchange-rates` — Fetch current + historical FX rates
- All CRUD operations go directly through Supabase client (no custom API needed for basic CRUD)

---

## Implementation Phases

### Phase 1: Foundation
- Next.js 15 project setup with TypeScript, Tailwind (dark mode only)
- Supabase project setup (tables, RLS, storage bucket)
- Google auth with single-user restriction
- Shared UI component kit
- PWA manifest + basic service worker
- Tab navigation (responsive: bottom tabs mobile, sidebar desktop)

### Phase 2: Core Data Entry
- PDF upload flow (Supabase Storage)
- Gemini AI parsing integration (payslips + credit card statements)
- Editable parsed data UI
- Manual entry forms for all data types
- FAB with action menu
- Expense categories (CRUD + AI auto-categorization)
- Fund types management

### Phase 3: Portfolio & Investments
- Stock trade recording (buy/sell with full fields)
- Yahoo Finance API integration (live prices on load)
- Portfolio view (flat list with P&L, cost basis, etc.)
- Tax lot tracking (FIFO)
- Dividend tracking
- Portfolio performance charts

### Phase 4: Funds, Deposits & Debt
- Fund entries (contributions + value snapshots)
- Invested vs. current per fund
- Locked deposits with terms + projected value + maturity timeline
- Loans with payment schedules + remaining balance

### Phase 5: Dashboard & Overview
- Net worth calculation + breakdown visualization
- Combined invested vs. current value widget
- Cashflow calculation + correction mechanism
- Currency handling (per-section selector, historical rates, FX trend charts)
- Mini portfolio chart
- Recent activity feed
- Physical assets + value history

### Phase 6: Polish
- Mobile responsiveness pass
- Loading states, empty states, error handling
- PWA installability verification
- Performance optimization

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALLOWED_EMAIL=
GEMINI_API_KEY=
```

---

## Verification

- Auth: Sign in with allowed email → access granted. Sign in with any other email → access denied.
- PDF upload: Drop a payslip PDF → see extracted fields in editable form → correct and save → verify data in DB.
- Stocks: Add a buy trade → see it in portfolio → verify live price fetched → check P&L calculation.
- Funds: Create a fund type → add contributions → add value snapshot → verify invested vs. current.
- Deposits: Add a deposit with terms → verify projected value calculation → check maturity timeline.
- Dashboard: Verify net worth = sum of all assets - debt. Verify cashflow calculation. Switch currencies per section.
- Mobile: Test all views on mobile viewport. Verify bottom tabs, FAB, forms work on touch.
- PWA: Add to home screen on iOS/Android. Verify app icon and standalone mode.
