import { useState } from 'react';
import { useStore } from '../store';
import {
  Save, Copy, AlertTriangle, ShieldCheck,
  Database, HardDrive, Wifi
} from 'lucide-react';

export default function ConfigPage({ onOpenAdmin, licenseInfo, licenseStatus }) {
  const activePage        = useStore(s => s.activePage);
  const configuracion     = useStore(s => s.configuracion);
  const updateConfiguracion = useStore(s => s.updateConfiguracion);
  const addLog            = useStore(s => s.addLog);
  const currentUser       = useStore(s => s.currentUser);
  const showToastAction   = useStore(s => s.showToastAction);
  const clientKey         = useStore(s => s.clientKey);
  const products          = useStore(s => s.products);

  const [form, setForm]   = useState({ ...configuracion });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  if (activePage !== 'config') return null;

  const handleSave = () => {
    updateConfiguracion(form);
    addLog('CONFIG_ACTUALIZADA', `${currentUser?.nombre} actualizó la configuración`);
    showToastAction('✓', 'Configuración guardada', 'success');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(clientKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Licencia
  const isActive       = licenseStatus === 'active' || licenseStatus === 'grace';
  const diasRestantes  = licenseInfo?.diasRestantes ?? null;
  const vencimiento    = licenseInfo?.vencimiento
    ? new Date(licenseInfo.vencimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  const esPrueba       = licenseInfo?.monto === 0;
  const alertaVenc     = isActive && diasRestantes !== null && diasRestantes <= 7;
  const stockBajo      = products.filter(p => !p.sinStock && p.stock <= p.stockMin).length;

  return (
    <div className="page active" id="page-config" style={{ background: '#FAFAFA', overflowY: 'auto' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>Configuración</h1>
            <p style={{ fontSize: 15, color: '#6B7280', margin: '6px 0 0 0' }}>Administrá las preferencias y ajustes generales del sistema.</p>
          </div>
          <button
            onClick={handleSave}
            style={{
              background: saved ? '#10B981' : '#111827',
              color: '#FFF', border: 'none', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 20px', height: 40, fontSize: 14, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <Save size={16} /> {saved ? 'Cambios guardados' : 'Guardar cambios'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        
          {/* ── Negocio ── */}
          <Section title="Detalles del negocio" description="Información pública que aparecerá en tus tickets y presupuestos.">
            <Block>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <Input label="Nombre del negocio" placeholder="Ej: Kiosco Central" value={form.nombreKiosco} onChange={v => f('nombreKiosco', v)} />
                <Select label="Moneda principal" value={form.moneda} onChange={v => f('moneda', v)}>
                  <option value="$">$ — Peso Argentino</option>
                  <option value="U$D">U$D — Dólar Estadounidense</option>
                </Select>
                <Input label="Dirección" placeholder="Av. Corrientes 1234" value={form.direccion} onChange={v => f('direccion', v)} />
                <Input label="Teléfono" placeholder="011-4321-0000" value={form.telefono} onChange={v => f('telefono', v)} />
              </div>
            </Block>
          </Section>

          {/* ── Impresión ── */}
          <Section title="Impresión" description="Ajustes sobre facturación, tickets y comportamiento de terminal de venta.">
            <Block>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ paddingRight: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Imprimir ticket automático al cobrar</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>Abre automáticamente el diálogo de impresión cada vez que se confirma una venta. Funciona perfecto con impresoras térmicas (formato 80mm).</div>
                </div>
                <Toggle checked={form.imprimirTicket} onChange={v => f('imprimirTicket', v)} />
              </div>
            </Block>
          </Section>

          {/* ── Suscripción ── */}
          <Section title="Suscripción" description="Información de tu plan actual y estado de tu cuenta Gestify.">
            <Block>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: isActive ? (alertaVenc ? '#FEF3C7' : '#D1FAE5') : '#FEE2E2', padding: 8, borderRadius: 8 }}>
                    <ShieldCheck size={24} color={isActive ? (alertaVenc ? '#F59E0B' : '#10B981') : '#EF4444'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                      {!isActive ? 'Sin suscripción activa' : esPrueba ? 'Prueba gratuita (Trial)' : 'Suscripción activa'}
                    </div>
                    {vencimiento && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Próxima renovación: <span style={{ fontWeight: 500, color: '#374151' }}>{vencimiento}</span></div>}
                  </div>
                </div>
                {isActive && diasRestantes !== null && (
                  <span style={{ background: alertaVenc ? '#FEF3C7' : '#D1FAE5', color: alertaVenc ? '#92400E' : '#065F46', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                    {diasRestantes} días restantes
                  </span>
                )}
              </div>
              
              {alertaVenc && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#92400E', background: '#FEF3C7', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <AlertTriangle size={16} /> Vence pronto. Asegurate de regularizar tu pago para no perder acceso.
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 2 }}>ID de Licencia (Client Key)</div>
                  <code style={{ fontSize: 13, color: '#111827', fontFamily: 'monospace' }}>{clientKey || 'No disponible'}</code>
                </div>
                <button
                  onClick={copyKey}
                  style={{ background: '#FFF', border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                >
                  <Copy size={13} /> {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </Block>
          </Section>

          {/* ── Sistema ── */}
          <Section title="Información del sistema" description="Diagnóstico técnico y estado actual de los recursos." noBorder>
            <Block>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <InfoItem icon={<Database size={16}/>} label="Base de datos" value="Supabase (Cloud)" status="ok" />
                <InfoItem icon={<Wifi size={16}/>} label="Estado de red" value="Conectado / Online" status="ok" />
                <InfoItem icon={<HardDrive size={16}/>} label="Versión Sistema" value="Gestify v2.0.0" status="neutral" />
                <InfoItem icon={<AlertTriangle size={16}/>} label="Alertas de Stock" value={stockBajo > 0 ? `${stockBajo} con bajo stock` : 'Sin alertas'} status={stockBajo > 0 ? 'warning' : 'ok'} />
              </div>
            </Block>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children, noBorder }) {
  return (
    <div style={{ 
      display: 'flex', flexWrap: 'wrap', gap: 32, 
      padding: '32px 0', borderBottom: noBorder ? 'none' : '1px solid #E5E7EB', alignItems: 'flex-start' 
    }}>
      <div style={{ flex: '1 1 260px', maxWidth: 300 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '8px 0 0 0', lineHeight: 1.5 }}>{description}</p>
      </div>
      <div style={{ flex: '1 1 400px', background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function Block({ children }) {
  return <div style={{ padding: '24px' }}>{children}</div>;
}

function Input({ label, placeholder, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      <input 
        type="text"
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ 
          width: '100%', height: 40, padding: '0 12px', fontSize: 14, color: '#111827',
          background: '#FFF', border: '1px solid #D1D5DB', borderRadius: 6,
          outline: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02) inset'
        }}
        onFocus={e => { e.target.style.borderColor = '#111827'; e.target.style.boxShadow = '0 0 0 1px #111827'; }}
        onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02) inset'; }}
      />
    </div>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      <select 
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ 
          width: '100%', height: 40, padding: '0 12px', fontSize: 14, color: '#111827',
          background: '#FFF', border: '1px solid #D1D5DB', borderRadius: 6,
          outline: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02) inset',
          cursor: 'pointer', appearance: 'none'
        }}
        onFocus={e => { e.target.style.borderColor = '#111827'; e.target.style.boxShadow = '0 0 0 1px #111827'; }}
        onBlur={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02) inset'; }}
      >
        {children}
      </select>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0, cursor: 'pointer',
        background: checked ? '#111827' : '#E5E7EB', transition: 'background 0.2s', position: 'relative',
        border: 'none', padding: 0
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%', background: '#FFF',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }} />
    </button>
  );
}

function InfoItem({ icon, label, value, status }) {
  const getStatusProps = () => {
    if (status === 'ok') return { color: '#059669', bg: '#D1FAE5' };
    if (status === 'warning') return { color: '#B45309', bg: '#FEF3C7' };
    return { color: '#4B5563', bg: '#F3F4F6' };
  };
  
  const { color, bg } = getStatusProps();
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 8, padding: '12px' }}>
      <div style={{ color: color, background: bg, padding: 8, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}
