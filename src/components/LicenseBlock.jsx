import { ShieldOff, Phone, RefreshCw, Clock } from 'lucide-react';
import { useState } from 'react';

export default function LicenseBlock({ licenseInfo, status, onRecheck }) {
  const [checking, setChecking] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    await onRecheck();
    setTimeout(() => setChecking(false), 2000);
  };

  const isGrace = status === 'grace';
  const bloqueado = licenseInfo?.bloqueado;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '48px',
        maxWidth: '460px',
        width: '90%',
        textAlign: 'center',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>

        {/* Icono */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: isGrace ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
          border: `2px solid ${isGrace ? '#f59e0b' : '#ef4444'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isGrace
            ? <Clock size={32} color="#f59e0b" />
            : <ShieldOff size={32} color="#ef4444" />
          }
        </div>

        {/* Título */}
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>
          {isGrace ? 'Modo sin conexión' : bloqueado ? 'Cuenta suspendida' : 'Licencia vencida'}
        </h1>

        {/* Nombre del negocio */}
        {licenseInfo?.nombre && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 24px' }}>
            {licenseInfo.nombre}
          </p>
        )}

        {/* Mensaje */}
        <div style={{
          background: isGrace ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${isGrace ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '12px', padding: '16px', marginBottom: '28px',
        }}>
          {isGrace ? (
            <p style={{ color: '#fbbf24', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              Sin conexión a internet. El sistema funciona por gracia durante{' '}
              <strong>3 días</strong> desde el último chequeo exitoso.
              <br/>Conectate a internet para verificar tu licencia.
            </p>
          ) : (
            <p style={{ color: '#fca5a5', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              {bloqueado
                ? 'Tu cuenta fue suspendida. Contactá al proveedor para regularizar.'
                : `Tu licencia ha vencido${licenseInfo?.vencimiento ? ` el ${new Date(licenseInfo.vencimiento + 'T00:00:00').toLocaleDateString('es-AR')}` : ''}.
                   Para continuar usando el sistema, realizá el pago mensual.`
              }
            </p>
          )}
        </div>

        {/* Info de pago */}
        {!isGrace && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px', padding: '16px', marginBottom: '24px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>
              Aboná tu suscripción
            </p>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '0 0 4px' }}>
              ${licenseInfo?.monto?.toLocaleString('es-AR') || '14.999'}
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>/mes</span>
            </p>
          </div>
        )}

        {/* Contacto */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '24px',
        }}>
          <Phone size={14} />
          <span>Contactá a tu proveedor para habilitar el sistema</span>
        </div>

        {/* Botón recheck */}
        <button
          onClick={handleRecheck}
          disabled={checking}
          style={{
            background: isGrace ? '#f59e0b' : '#6366f1',
            color: '#fff', border: 'none', borderRadius: '10px',
            padding: '12px 28px', fontSize: '14px', fontWeight: 600,
            cursor: checking ? 'not-allowed' : 'pointer',
            opacity: checking ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto',
            transition: 'opacity 0.2s',
          }}
        >
          <RefreshCw size={15} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
          {checking ? 'Verificando...' : 'Verificar licencia'}
        </button>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
