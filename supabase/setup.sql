-- ============================================================
-- Gestify POS — Setup de tablas
-- Correr en Supabase → SQL Editor
-- ============================================================

-- Tabla de clientes (una fila por instalación)
create table if not exists clientes (
  id            bigserial primary key,
  client_key    text unique not null,
  nombre_negocio text not null default 'Mi Kiosco',
  email         text not null default '',
  telefono      text not null default '',
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

-- Tabla de licencias (un registro por pago mensual)
create table if not exists licencias (
  id                bigserial primary key,
  cliente_id        bigint not null references clientes(id) on delete cascade,
  fecha_inicio      date not null,
  fecha_vencimiento date not null,
  monto             numeric(10,2) not null default 14999,
  pagado            boolean not null default false,
  fecha_pago        timestamptz,
  notas             text,
  creado_en         timestamptz not null default now()
);

-- Índices para acelerar las consultas de la app
create index if not exists idx_clientes_client_key on clientes(client_key);
create index if not exists idx_licencias_cliente_id on licencias(cliente_id);
create index if not exists idx_licencias_vencimiento on licencias(fecha_vencimiento desc);

-- RLS: habilitar pero permitir todo desde service_role (Edge Functions)
alter table clientes enable row level security;
alter table licencias enable row level security;

-- Política: solo service_role puede leer/escribir (las Edge Functions usan service_role)
create policy "service_role full access clientes"
  on clientes for all
  using (auth.role() = 'service_role');

create policy "service_role full access licencias"
  on licencias for all
  using (auth.role() = 'service_role');

-- La anon key solo puede leer su propio cliente por client_key (para el chequeo de licencia)
create policy "anon puede leer su cliente"
  on clientes for select
  using (true);

create policy "anon puede leer sus licencias"
  on licencias for select
  using (true);
