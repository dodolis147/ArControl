
-- Habilitar extensão para UUIDs
create extension if not exists "uuid-ossp";

-- =================================================================
-- 1. Tabela de USUÁRIOS
-- =================================================================
create table if not exists public.users (
  id text primary key,
  username text unique not null,
  password text not null,
  email text,
  phone text,
  role text not null check (role in ('ADMIN', 'CLIENT', 'TECHNICIAN')),
  client_name text,
  status text not null check (status in ('ACTIVE', 'BLOCKED')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sincronização de Colunas Novas (Migration)
do $$
begin
  -- Adicionar avatar_url se não existir
  if not exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'avatar_url') then
    alter table public.users add column avatar_url text;
  end if;
end $$;

-- =================================================================
-- 2. Tabela de EQUIPAMENTOS (AC UNITS)
-- =================================================================
create table if not exists public.ac_units (
  id text primary key,
  client_name text not null,
  department text,
  brand text not null,
  model text,
  serial_number text,
  btu integer not null,
  location text not null,
  regional text,
  install_date date,
  status text not null,
  unit_photos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- =================================================================
-- 3. Tabela de REGISTROS DE MANUTENÇÃO (HISTORY)
-- =================================================================
create table if not exists public.maintenance_records (
  id text primary key,
  unit_id text references public.ac_units(id) on delete cascade,
  type text not null,
  technician text not null,
  description text not null,
  date date not null,
  time text,
  photos jsonb default '[]'::jsonb,
  documents jsonb default '[]'::jsonb,
  rating integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sincronização de Colunas Novas (Migration)
do $$
begin
  -- Adicionar technical_report se não existir
  if not exists (select 1 from information_schema.columns where table_name = 'maintenance_records' and column_name = 'technical_report') then
    alter table public.maintenance_records add column technical_report text;
  end if;
end $$;

-- =================================================================
-- 4. Tabela de MANUTENÇÕES PLANEJADAS
-- =================================================================
create table if not exists public.planned_maintenance (
  id text primary key,
  unit_id text references public.ac_units(id) on delete cascade,
  type text not null,
  description text not null,
  expected_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- =================================================================
-- 5. Tabela de CHAMADOS (TICKETS)
-- =================================================================
create table if not exists public.tickets (
  id text primary key,
  unit_id text references public.ac_units(id) on delete set null,
  client_name text not null,
  description text not null,
  date date not null,
  status text not null,
  priority text not null,
  technician_id text,
  rating integer,
  feedback text,
  reschedule_reason text,
  solution text,
  technical_report text,
  photos jsonb default '[]'::jsonb,
  documents jsonb default '[]'::jsonb,
  wa_notified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- =================================================================
-- INSERÇÃO/ATUALIZAÇÃO DO USUÁRIO ADMINISTRADOR PADRÃO
-- =================================================================
INSERT INTO public.users (id, username, password, role, status, email)
VALUES (
  'admin_default_01',
  'admin',
  'admin',
  'ADMIN',
  'ACTIVE',
  'admin@arcontrol.com'
)
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password, 
    role = EXCLUDED.role, 
    status = EXCLUDED.status;

-- =================================================================
-- CONFIGURAÇÃO DE SEGURANÇA (RLS)
-- =================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Recriar Policies (Drop preventivo para evitar erros de duplicidade ao rodar o script novamente)
DROP POLICY IF EXISTS "Public Access Users" ON public.users;
CREATE POLICY "Public Access Users" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Units" ON public.ac_units;
CREATE POLICY "Public Access Units" ON public.ac_units FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Maintenance" ON public.maintenance_records;
CREATE POLICY "Public Access Maintenance" ON public.maintenance_records FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Planned" ON public.planned_maintenance;
CREATE POLICY "Public Access Planned" ON public.planned_maintenance FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Tickets" ON public.tickets;
CREATE POLICY "Public Access Tickets" ON public.tickets FOR ALL USING (true);
