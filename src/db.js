// Sincronización con Supabase — todos los datos del kiosco
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY;

const HEADERS = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
};

// ── Fetch genérico ──────────────────────────────────────────────────────────
async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { ...HEADERS, ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Cargar datos desde la nube ──────────────────────────────────────────────
export async function loadFromCloud(clientKey) {
  try {
    const rows = await sbFetch(
      `kiosco_sync?client_key=eq.${clientKey}&select=*&limit=1`
    );
    return rows?.[0] || null;
  } catch (e) {
    console.warn('[DB] loadFromCloud error:', e.message);
    return null;
  }
}

// ── Guardar datos en la nube (upsert) ───────────────────────────────────────
export async function saveToCloud(clientKey, snapshot) {
  try {
    await sbFetch('kiosco_sync', {
      method:  'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        client_key:    clientKey,
        productos:     snapshot.productos,
        categorias:    snapshot.categorias,
        usuarios:      snapshot.usuarios,
        configuracion: snapshot.configuracion,
        ventas:        snapshot.ventas,
        caja_movs:     snapshot.caja_movs,
        logs:          snapshot.logs,
        counters:      snapshot.counters,
        updated_at:    new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.warn('[DB] saveToCloud error:', e.message);
  }
}

// ── Debounce helper ─────────────────────────────────────────────────────────
let saveTimer = null;
export function scheduleSave(clientKey, getState) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = getState();
    saveToCloud(clientKey, {
      productos:     s.products,
      categorias:    s.categorias,
      usuarios:      s.usuarios,
      configuracion: s.configuracion,
      ventas:        s.sales.slice(0, 5000),        // máx 5000 ventas
      caja_movs:     s.cajaMovs,
      logs:          s.logs.slice(0, 500),           // máx 500 logs
      counters: {
        nextId:      s.nextId,
        nextUserId:  s.nextUserId,
        saleCounter: s.saleCounter,
        cajaTotal:   s.cajaTotal,
        cajaApertura: s.cajaApertura,
        cajaAbierta: s.cajaAbierta,
      },
    });
  }, 2000); // espera 2 segundos de inactividad antes de guardar
}
