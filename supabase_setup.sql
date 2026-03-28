-- =============================================
-- SISTEMA KIOSCO - Setup de Supabase
-- Ejecutar este SQL en el SQL Editor de Supabase
-- =============================================

-- Tabla de clientes (uno por kiosco)
CREATE TABLE clientes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_negocio TEXT NOT NULL,
  email          TEXT,
  telefono       TEXT,
  client_key     UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  activo         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Tabla de licencias (una por mes pagado)
CREATE TABLE licencias (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id         UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  fecha_inicio       DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento  DATE NOT NULL,
  monto              NUMERIC NOT NULL DEFAULT 14999,
  pagado             BOOLEAN NOT NULL DEFAULT false,
  fecha_pago         TIMESTAMPTZ,
  notas              TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE clientes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE licencias ENABLE ROW LEVEL SECURITY;

-- Anon puede leer clientes (la app filtra por client_key)
CREATE POLICY "anon_select_clientes" ON clientes
  FOR SELECT TO anon USING (true);

-- Anon puede leer licencias (la app filtra por cliente_id)
CREATE POLICY "anon_select_licencias" ON licencias
  FOR SELECT TO anon USING (true);

-- Usuarios autenticados (el dueño del software) pueden hacer todo
CREATE POLICY "admin_all_clientes" ON clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_licencias" ON licencias
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- INSTRUCCIONES:
-- 1. Ir a https://supabase.com → tu proyecto → SQL Editor
-- 2. Pegar y ejecutar este script
-- 3. Ir a Authentication → Users → Add user
--    (ese será tu usuario de admin para el panel)
-- 4. Copiar la URL y ANON KEY de Settings → API
-- 5. Crear archivo .env en la raíz del proyecto:
--    VITE_SUPABASE_URL=https://xxx.supabase.co
--    VITE_SUPABASE_ANON_KEY=eyJ...
-- =============================================
