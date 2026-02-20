-- Finances Magician: Initial Schema
-- All tables use RLS with user_id = auth.uid()

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enum types
create type fund_category as enum ('pension', 'education_fund', 'deposit', 'custom');
create type trade_type as enum ('buy', 'sell');
create type document_type as enum ('payslip', 'credit_card_statement');
create type document_status as enum ('processing', 'parsed', 'error');
create type fund_entry_type as enum ('contribution', 'withdrawal', 'value_snapshot');

-- 1. Profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text not null default '',
  base_currency text not null default 'ILS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (id = auth.uid());
create policy "Users can update own profile" on profiles for update using (id = auth.uid());
create policy "Users can insert own profile" on profiles for insert with check (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Fund Types
create table fund_types (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category fund_category not null default 'custom',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table fund_types enable row level security;
create policy "Users can manage own fund types" on fund_types for all using (user_id = auth.uid());

-- 3. Payslips
create table payslips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  gross_salary numeric not null default 0,
  net_salary numeric not null default 0,
  tax numeric not null default 0,
  bituach_leumi numeric not null default 0,
  health_tax numeric not null default 0,
  pension_employee numeric not null default 0,
  pension_employer numeric not null default 0,
  hishtalmut_employee numeric not null default 0,
  hishtalmut_employer numeric not null default 0,
  overtime numeric not null default 0,
  bonus numeric not null default 0,
  vacation_days_balance numeric not null default 0,
  sick_days_balance numeric not null default 0,
  currency text not null default 'ILS',
  source_file_url text,
  notes text,
  created_at timestamptz not null default now()
);

alter table payslips enable row level security;
create policy "Users can manage own payslips" on payslips for all using (user_id = auth.uid());

-- 4. Expense Categories
create table expense_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table expense_categories enable row level security;
create policy "Users can manage own expense categories" on expense_categories for all using (user_id = auth.uid());

-- 5. Expenses
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  description text not null,
  amount numeric not null,
  currency text not null default 'ILS',
  category_id uuid references expense_categories(id) on delete set null,
  source_file_url text,
  notes text,
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;
create policy "Users can manage own expenses" on expenses for all using (user_id = auth.uid());

-- 6. Stock Trades
create table stock_trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  ticker text not null,
  exchange text not null default 'NASDAQ',
  trade_type trade_type not null,
  quantity numeric not null,
  price_per_share numeric not null,
  currency text not null default 'USD',
  exchange_rate_at_trade numeric not null default 1,
  fees numeric not null default 0,
  broker text not null default '',
  trade_date date not null,
  lot_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

alter table stock_trades enable row level security;
create policy "Users can manage own stock trades" on stock_trades for all using (user_id = auth.uid());

-- 7. Dividends
create table dividends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  ticker text not null,
  amount numeric not null,
  currency text not null default 'USD',
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table dividends enable row level security;
create policy "Users can manage own dividends" on dividends for all using (user_id = auth.uid());

-- 8. Fund Entries
create table fund_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  fund_type_id uuid not null references fund_types(id) on delete cascade,
  entry_type fund_entry_type not null,
  amount numeric not null,
  currency text not null default 'ILS',
  date date not null,
  source_description text,
  notes text,
  created_at timestamptz not null default now()
);

alter table fund_entries enable row level security;
create policy "Users can manage own fund entries" on fund_entries for all using (user_id = auth.uid());

-- 9. Deposits
create table deposits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  fund_type_id uuid not null references fund_types(id) on delete cascade,
  bank text not null,
  principal numeric not null,
  currency text not null default 'ILS',
  interest_rate numeric not null default 0,
  start_date date not null,
  maturity_date date not null,
  projected_value numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table deposits enable row level security;
create policy "Users can manage own deposits" on deposits for all using (user_id = auth.uid());

-- 10. Loans
create table loans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  principal numeric not null,
  remaining_balance numeric not null,
  currency text not null default 'ILS',
  interest_rate numeric not null default 0,
  monthly_payment numeric not null default 0,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table loans enable row level security;
create policy "Users can manage own loans" on loans for all using (user_id = auth.uid());

-- 11. Physical Assets
create table physical_assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  current_value numeric not null default 0,
  currency text not null default 'ILS',
  last_valued_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table physical_assets enable row level security;
create policy "Users can manage own physical assets" on physical_assets for all using (user_id = auth.uid());

-- 12. Asset Value History
create table asset_value_history (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references physical_assets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  value numeric not null,
  currency text not null default 'ILS',
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table asset_value_history enable row level security;
create policy "Users can manage own asset value history" on asset_value_history for all using (user_id = auth.uid());

-- 13. Cashflow Corrections
create table cashflow_corrections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  corrected_balance numeric not null,
  currency text not null default 'ILS',
  date date not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table cashflow_corrections enable row level security;
create policy "Users can manage own cashflow corrections" on cashflow_corrections for all using (user_id = auth.uid());

-- 14. Exchange Rates (shared reference data)
create table exchange_rates (
  id uuid primary key default uuid_generate_v4(),
  base_currency text not null,
  target_currency text not null,
  rate numeric not null,
  date date not null,
  unique (base_currency, target_currency, date)
);

alter table exchange_rates enable row level security;
create policy "Authenticated users can read exchange rates" on exchange_rates for select using (auth.role() = 'authenticated');
create policy "Service role can manage exchange rates" on exchange_rates for all using (true);

-- 15. Uploaded Documents
create table uploaded_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  document_type document_type not null,
  parsed_data jsonb not null default '{}',
  status document_status not null default 'processing',
  created_at timestamptz not null default now()
);

alter table uploaded_documents enable row level security;
create policy "Users can manage own uploaded documents" on uploaded_documents for all using (user_id = auth.uid());

-- Storage bucket for document uploads
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict do nothing;

create policy "Users can upload documents" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own documents" on storage.objects
  for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes for common queries
create index idx_payslips_user_date on payslips(user_id, date desc);
create index idx_expenses_user_date on expenses(user_id, date desc);
create index idx_expenses_category on expenses(category_id);
create index idx_stock_trades_user_ticker on stock_trades(user_id, ticker);
create index idx_stock_trades_user_date on stock_trades(user_id, trade_date desc);
create index idx_dividends_user_date on dividends(user_id, date desc);
create index idx_fund_entries_user_fund on fund_entries(user_id, fund_type_id);
create index idx_deposits_user on deposits(user_id);
create index idx_loans_user on loans(user_id);
create index idx_physical_assets_user on physical_assets(user_id);
create index idx_asset_value_history_asset on asset_value_history(asset_id, date desc);
create index idx_exchange_rates_lookup on exchange_rates(base_currency, target_currency, date desc);
