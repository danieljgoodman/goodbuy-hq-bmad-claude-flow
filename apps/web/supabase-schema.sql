-- GoodBuy HQ Database Schema
-- Run this in your Supabase SQL editor after creating the project

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Drop and recreate users table if it exists
drop table if exists public.users cascade;

-- Create users table
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  business_name text not null,
  industry text not null,
  role text not null check (role in ('owner', 'manager', 'advisor')),
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login_at timestamp with time zone default timezone('utc'::text, now())
);

-- Drop and recreate other tables if they exist
drop table if exists public.business_evaluations cascade;
drop table if exists public.businesses cascade;

-- Create businesses table for detailed business information
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  industry text not null,
  description text,
  website text,
  employee_count integer,
  annual_revenue numeric,
  founded_year integer,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create business_evaluations table
create table public.business_evaluations (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  evaluation_data jsonb not null,
  valuation_result numeric,
  ai_analysis text,
  status text not null default 'draft' check (status in ('draft', 'completed', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.business_evaluations enable row level security;

-- Create policies for users table
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Create policies for businesses table
create policy "Users can view own businesses" on public.businesses
  for select using (user_id = auth.uid());

create policy "Users can create own businesses" on public.businesses
  for insert with check (user_id = auth.uid());

create policy "Users can update own businesses" on public.businesses
  for update using (user_id = auth.uid());

create policy "Users can delete own businesses" on public.businesses
  for delete using (user_id = auth.uid());

-- Create policies for business_evaluations table
create policy "Users can view own evaluations" on public.business_evaluations
  for select using (business_id in (
    select id from public.businesses where user_id = auth.uid()
  ));

create policy "Users can create own evaluations" on public.business_evaluations
  for insert with check (business_id in (
    select id from public.businesses where user_id = auth.uid()
  ));

create policy "Users can update own evaluations" on public.business_evaluations
  for update using (business_id in (
    select id from public.businesses where user_id = auth.uid()
  ));

create policy "Users can delete own evaluations" on public.business_evaluations
  for delete using (business_id in (
    select id from public.businesses where user_id = auth.uid()
  ));

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger handle_businesses_updated_at
  before update on public.businesses
  for each row execute function public.handle_updated_at();

create trigger handle_business_evaluations_updated_at
  before update on public.business_evaluations
  for each row execute function public.handle_updated_at();

-- Create indexes for better performance
create index idx_businesses_user_id on public.businesses(user_id);
create index idx_business_evaluations_business_id on public.business_evaluations(business_id);
create index idx_users_email on public.users(email);