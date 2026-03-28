import './index.css';
import { useState } from 'react';
import { useStore } from './store';
import { useLicense } from './useLicense';

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
  const [showAdmin, setShowAdmin] = useState(false);

  const { status, licenseInfo, recheck } = useLicense(clientKey);

  const toastIcons = {
    success: <CheckCircle size={18} />,
    warn: <AlertTriangle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  };

  const toastClass = toast.type || 'info';

  // ── Chequeo de licencia ──────────────────────────────────────────────────
  // Mientras carga, mostrar pantalla en blanco
  if (status === 'loading') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0f0c29',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid #4f46e5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Verificando licencia...</p>
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
      <Topbar />
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
            <ConfigPage onOpenAdmin={() => setShowAdmin(true)} />
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
