import { useEffect, useState, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CACHE_KEY = 'kiosco_lic_cache';
const GRACE_DAYS = 3;
const CHECK_INTERVAL = 4 * 60 * 60 * 1000;

const IS_DEV = import.meta.env.DEV;

async function querySupabase(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Supabase error ${res.status}`);
  return res.json();
}

export function useLicense(clientKey) {
  const [status, setStatus] = useState('loading');
  const [licenseInfo, setLicenseInfo] = useState(null);

  const applyCache = useCallback(() => {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) { setStatus('expired'); return; }
    try {
      const c = JSON.parse(raw);
      const daysSince = (Date.now() - c.checkedAt) / 86400000;
      if (c.status === 'active' && daysSince <= GRACE_DAYS) {
        setLicenseInfo(c.info);
        setStatus('grace');
      } else {
        setLicenseInfo(c.info);
        setStatus('expired');
      }
    } catch {
      setStatus('expired');
    }
  }, []);

  const check = useCallback(async () => {
    if (clientKey === null || clientKey === undefined) return; // esperando machine ID
    if (!clientKey) { setStatus('no_key'); return; }

    try {
      // 1. Buscar cliente
      const clientes = await querySupabase(
        `clientes?client_key=eq.${clientKey}&select=id,nombre_negocio,activo&limit=1`
      );

      if (!clientes || clientes.length === 0) { 
        localStorage.removeItem(CACHE_KEY);
        setStatus('no_key'); 
        return; 
      }
      const cliente = clientes[0];

      if (!cliente.activo) {
        setStatus('expired');
        setLicenseInfo({ nombre: cliente.nombre_negocio, bloqueado: true });
        return;
      }

      // 2. Buscar licencia más reciente
      const licencias = await querySupabase(
        `licencias?cliente_id=eq.${cliente.id}&select=fecha_vencimiento,pagado,monto&order=fecha_vencimiento.desc&limit=1`
      );

      if (!licencias || licencias.length === 0) {
        setStatus('expired');
        setLicenseInfo({ nombre: cliente.nombre_negocio });
        return;
      }
      const lic = licencias[0];

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const vence = new Date(lic.fecha_vencimiento + 'T00:00:00');
      const diasRestantes = Math.ceil((vence - hoy) / 86400000);
      const activa = diasRestantes > 0;

      const info = {
        nombre: cliente.nombre_negocio,
        vencimiento: lic.fecha_vencimiento,
        diasRestantes,
        monto: lic.monto,
        pagado: lic.pagado,
      };

      setLicenseInfo(info);
      setStatus(activa ? 'active' : 'expired');

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        status: activa ? 'active' : 'expired',
        checkedAt: Date.now(),
        info,
      }));

    } catch (err) {
      console.error('[License] fetch error:', err);
      applyCache();
    }
  }, [clientKey, applyCache]);

  useEffect(() => {
    check();
    const interval = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [check, clientKey]);

  return { status, licenseInfo, recheck: check };
}
