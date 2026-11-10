-- TechFiyr Agent-to-Agent (A2A) Commerce & Zoho Sales Pipeline Schema
-- Compatible with PostgreSQL / Supabase SQL.
-- Note: Live runtime persists through lib/server/store.ts (Cloud Firestore in production / .data/ locally)
-- using the identical field contract defined below.

create extension if not exists "pgcrypto";

create type inquiry_status as enum ('PENDING', 'NEGOTIATING', 'CLOSED', 'REJECTED');
create type milestone_status as enum ('AWAITING_DEPOSIT', 'UPFRONT_PAID', 'MVP_DELIVERED', 'FULLY_PAID');

create table if not exists inquiries (
	id text primary key,
	sender_email text not null,
	sender_name text,
	subject text not null default '',
	thread_id text not null,
	status inquiry_status not null default 'PENDING',
	-- JSON array of { timestamp: string, role: 'client' | 'sales_agent', text: string, messageId?: string }
	messages jsonb not null default '[]'::jsonb,
	order_id text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_inquiries_thread_id on inquiries (thread_id);
create index if not exists idx_inquiries_sender_email on inquiries (sender_email);
create index if not exists idx_inquiries_status_updated on inquiries (status, updated_at desc);

create table if not exists orders (
	id text primary key,
	inquiry_id text references inquiries (id) on delete set null,
	client_contact text not null,
	client_agent_id text not null default 'autonomous-buyer',
	project_title text not null,
	total_price_usd numeric(10, 2) not null check (total_price_usd >= 600),
	milestone_status milestone_status not null default 'AWAITING_DEPOSIT',
	payment_method text not null default 'crypto_usdc_solana',
	crypto_chain text,
	crypto_tx_hash text,
	payoneer_reference text,
	srs_markdown text not null,
	srs_json jsonb not null,
	timeline_days integer not null default 7 check (timeline_days >= 7),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_orders_inquiry_id on orders (inquiry_id);
create index if not exists idx_orders_milestone_created on orders (milestone_status, created_at desc);

