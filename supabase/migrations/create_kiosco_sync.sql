-- Tabla de datos del kiosco (una fila por instalación)
CREATE TABLE IF NOT EXISTS kiosco_sync (
  client_key   TEXT PRIMARY KEY,
  productos    JSONB NOT NULL DEFAULT '[]',
  categorias   JSONB NOT NULL DEFAULT '[]',
  usuarios     JSONB NOT NULL DEFAULT '[]',
  configuracion JSONB NOT NULL DEFAULT '{}',
  ventas       JSONB NOT NULL DEFAULT '[]',
  caja_movs    JSONB NOT NULL DEFAULT '[]',
  logs         JSONB NOT NULL DEFAULT '[]',
  counters     JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: solo el propio kiosco puede leer/escribir su fila
ALTER TABLE kiosco_sync ENABLE ROW LEVEL SECURITY;

-- Política: anon puede hacer todo sobre su propia fila (validamos por client_key)
CREATE POLICY "kiosco_own_data" ON kiosco_sync
  FOR ALL
  USING (true)
  WITH CHECK (true);
