import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

const CACHE_KEY = 'kiosco_lic_cache';
const GRACE_DAYS = 3;         // días offline permitidos
const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 horas

// En modo desarrollo siempre está activo — para producción se verifica en Supabase
const IS_DEV = import.meta.env.DEV;

/**
 * Hook que verifica la licencia contra Supabase.
 *
 * Retorna:
 *  status: 'loading' | 'active' | 'grace' | 'expired' | 'no_key'
 *  licenseInfo: { nombre, vencimiento, diasRestantes, monto } | null
 *  recheck: función para forzar re-verificación
 */
export function useLicense(clientKey) {
  const [status, setStatus] = useState(IS_DEV ? 'active' : 'loading');
  const [licenseInfo, setLicenseInfo] = useState(IS_DEV ? { nombre: 'Modo desarrollo' } : null);

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
    if (!clientKey) { setStatus('no_key'); return; }

    try {
      // 1. Buscar cliente por client_key
      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .select('id, nombre_negocio, activo')
        .eq('client_key', clientKey)
        .maybeSingle();

      if (errCliente || !cliente) { applyCache(); return; }

      if (!cliente.activo) {
        setStatus('expired');
        setLicenseInfo({ nombre: cliente.nombre_negocio, bloqueado: true });
        return;
      }

      // 2. Buscar la licencia más reciente
      const { data: lic, error: errLic } = await supabase
        .from('licencias')
        .select('fecha_vencimiento, pagado, monto')
        .eq('cliente_id', cliente.id)
        .order('fecha_vencimiento', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errLic || !lic) {
        setStatus('expired');
        setLicenseInfo({ nombre: cliente.nombre_negocio });
        return;
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const vence = new Date(lic.fecha_vencimiento + 'T00:00:00');
      const diasRestantes = Math.ceil((vence - hoy) / 86400000);
      const activa = diasRestantes > 0 && lic.pagado;

      const info = {
        nombre: cliente.nombre_negocio,
        vencimiento: lic.fecha_vencimiento,
        diasRestantes,
        monto: lic.monto,
        pagado: lic.pagado,
      };

      setLicenseInfo(info);
      setStatus(activa ? 'active' : 'expired');

      // Guardar cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        status: activa ? 'active' : 'expired',
        checkedAt: Date.now(),
        info,
      }));

    } catch {
      applyCache();
    }
  }, [clientKey, applyCache]);

  useEffect(() => {
    if (IS_DEV) return; // en desarrollo no chequea
    check();
    const interval = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [check]);

  return { status, licenseInfo, recheck: check };
}
