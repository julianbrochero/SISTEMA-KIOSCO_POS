import './index.css';
import { useState, useEffect, useRef } from 'react';
import { useStore } from './store';
import { useLicense } from './useLicense';
import { loadFromCloud, scheduleSave } from './db';

import LoginPage from './components/LoginPage';
import Topbar from './components/Topbar';
import PosPage from './components/PosPage';
import ProductosPage from './components/ProductosPage';
import StockPage from './components/StockPage';
import CajaPage from './components/CajaPage';
import ReportesPage from './components/ReportesPage';
import HistorialPage from './components/HistorialPage';
import UsuariosPage from './components/UsuariosPage';
import LogsPage from './components/LogsPage';
import ConfigPage from './components/ConfigPage';
import LicenseBlock from './components/LicenseBlock';
import ActivationScreen from './components/ActivationScreen';
import AdminLicencias from './components/AdminLicencias';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

function App() {
  const currentUser = useStore((state) => state.currentUser);
  const toast = useStore((state) => state.toast);
  const clientKey = useStore((state) => state.clientKey);
  const setClientKey = useStore((state) => state.setClientKey);
  const showActivation = useStore(s => s.showActivation);
  const setShowActivation = useStore(s => s.setShowActivation);
  const [showAdmin, setShowAdmin] = useState(false);
  // null = esperando machine ID, string = listo
  const [resolvedKey, setResolvedKey] = useState(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    const resolveKey = async (key) => {
      // Cargar datos desde la nube si hay conexión
      try {
        const cloud = await loadFromCloud(key);
        if (cloud) {
          const s = useStore.getState();
          // Solo sobreescribir si la nube tiene datos (no vacío)
          useStore.setState({
            ...(cloud.productos?.length     ? { products:      cloud.productos }     : {}),
            ...(cloud.categorias?.length    ? { categorias:    cloud.categorias }    : {}),
            ...(cloud.usuarios?.length      ? { usuarios:      cloud.usuarios }      : {}),
            ...(cloud.ventas?.length        ? { sales:         cloud.ventas }        : {}),
            ...(cloud.caja_movs?.length     ? { cajaMovs:      cloud.caja_movs }    : {}),
            ...(cloud.logs?.length          ? { logs:          cloud.logs }          : {}),
            ...(Object.keys(cloud.configuracion || {}).length ? { configuracion: { ...s.configuracion, ...cloud.configuracion } } : {}),
            ...(cloud.counters ? {
              nextId:       cloud.counters.nextId      || s.nextId,
              nextUserId:   cloud.counters.nextUserId  || s.nextUserId,
              saleCounter:  cloud.counters.saleCounter || s.saleCounter,
              cajaTotal:    cloud.counters.cajaTotal   ?? s.cajaTotal,
              cajaApertura: cloud.counters.cajaApertura ?? s.cajaApertura,
              cajaAbierta:  cloud.counters.cajaAbierta ?? s.cajaAbierta,
            } : {}),
          });
        }
      } catch (e) {
        console.warn('[App] No se pudo cargar datos de la nube:', e.message);
      }
      setCloudLoaded(true);
    };

    if (window.electronAPI?.getMachineId) {
      window.electronAPI.getMachineId().then((machineId) => {
        const key = machineId || clientKey;
        if (machineId) setClientKey(machineId);
        setResolvedKey(key);
        resolveKey(key);
      });
    } else {
      setResolvedKey(clientKey);
      resolveKey(clientKey);
    }
  }, []);

  // Suscribirse a cambios del store y sincronizar con la nube
  useEffect(() => {
    if (!resolvedKey || syncedRef.current) return;
    syncedRef.current = true;

    const unsub = useStore.subscribe((state, prev) => {
      // Solo sincronizar si cambió algo relevante (no el carrito ni toast)
      const changed =
        state.products    !== prev.products    ||
        state.categorias  !== prev.categorias  ||
        state.usuarios    !== prev.usuarios    ||
        state.sales       !== prev.sales       ||
        state.cajaMovs    !== prev.cajaMovs    ||
        state.configuracion !== prev.configuracion ||
        state.logs        !== prev.logs;
      if (changed) scheduleSave(resolvedKey, useStore.getState);
    });
    return () => unsub();
  }, [resolvedKey]);

  const { status, licenseInfo, recheck } = useLicense(resolvedKey);

  const toastIcons = {
    success: <CheckCircle size={18} />,
    warn: <AlertTriangle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  };

  const toastClass = toast.type || 'info';

  // ── Carga inicial desde la nube ─────────────────────────────────────────
  if (!cloudLoaded && resolvedKey) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid #111827', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>Sincronizando datos...</p>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Chequeo de licencia ──────────────────────────────────────────────────
  // Mientras carga, mostrar pantalla en blanco
  if (status === 'loading') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid #111827', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>Verificando licencia...</p>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Sin licencia o vencida → pantalla de activación/suscripción
  if (status === 'expired' || status === 'no_key') {
    return (
      <>
        <ActivationScreen
          clientKey={clientKey}
          licenseInfo={licenseInfo}
          onRecheck={recheck}
        />
        {showAdmin && <AdminLicencias onClose={() => setShowAdmin(false)} />}
        <div
          style={{ position: 'fixed', bottom: 8, right: 12, fontSize: '10px', color: 'rgba(255,255,255,0.08)', cursor: 'default' }}
          onClick={() => setShowAdmin(true)}
        >●</div>
      </>
    );
  }

  // ── Si no está logueado, mostrar login ──────────────────────────────────
  if (!currentUser) {
    return (
      <>
        <LoginPage />
        {toast.show && (
          <div className={`toast toast-${toastClass}`}>
            <span className="toast-icon">{toastIcons[toastClass] || toastIcons.info}</span>
            <span>{toast.msg}</span>
          </div>
        )}
        {/* Punto de acceso al admin: esquina inferior derecha */}
        <div
          title="Admin del sistema"
          style={{ position: 'fixed', bottom: 8, right: 12, fontSize: '10px', color: 'rgba(255,255,255,0.15)', cursor: 'default' }}
          onClick={() => setShowAdmin(true)}
        >
          ●
        </div>
        {showAdmin && <AdminLicencias onClose={() => setShowAdmin(false)} />}
      </>
    );
  }

  return (
    <>
      <Topbar licenseInfo={licenseInfo} />
      <div className="main-area">
        <PosPage />
        <ProductosPage />
        <StockPage />
        <CajaPage />
        <ReportesPage />
        <HistorialPage />
        {currentUser.rol === 'admin' && (
          <>
            <UsuariosPage />
            <LogsPage />
            <ConfigPage onOpenAdmin={() => setShowAdmin(true)} licenseInfo={licenseInfo} licenseStatus={status} />
          </>
        )}
      </div>

      {/* Global Toast */}
      <div className={`toast toast-${toastClass} ${!toast.show ? 'hidden' : ''}`}>
        <span className="toast-icon">{toastIcons[toastClass] || toastIcons.info}</span>
        <span>{toast.msg}</span>
      </div>

      {/* Modal admin licencias */}
      {showAdmin && <AdminLicencias onClose={() => setShowAdmin(false)} />}
      
      {/* Visualizar pantalla de pago manual */}
      {showActivation && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
          <ActivationScreen clientKey={clientKey} licenseInfo={licenseInfo} onRecheck={recheck} />
          <button
             onClick={() => setShowActivation(false)}
             style={{ position: 'fixed', top: 20, right: 20, background: '#222', color: '#fff', border: '1px solid #444', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, zIndex: 100000 }}
          >
            ✕ Cerrar ventana de pago
          </button>
        </div>
      )}

      {/* Aviso si está en modo gracia (sin internet) */}
      {status === 'grace' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#92400e', color: '#fef3c7',
          padding: '8px 16px', fontSize: '12px', textAlign: 'center', zIndex: 999,
        }}>
          ⚠ Sin conexión a internet — verificación de licencia en modo gracia.
          Conectate para validar tu suscripción.
        </div>
      )}
    </>
  );
}

export default App;
