import { useState } from 'react';
import { useStore } from '../store';
import { Settings, Store, MapPin, Phone, Printer, Save, MonitorSmartphone, RefreshCw, ShieldCheck, Copy, ExternalLink } from 'lucide-react';

export default function ConfigPage({ onOpenAdmin }) {
    const activePage = useStore(s => s.activePage);
    const configuracion = useStore(s => s.configuracion);
    const updateConfiguracion = useStore(s => s.updateConfiguracion);
    const addLog = useStore(s => s.addLog);
    const currentUser = useStore(s => s.currentUser);
    const showToastAction = useStore(s => s.showToastAction);
    const clientKey = useStore(s => s.clientKey);

    const [form, setForm] = useState({ ...configuracion });
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyKey = () => {
        navigator.clipboard.writeText(clientKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (activePage !== 'config') return null;

    const handleSave = () => {
        updateConfiguracion(form);
        addLog('CONFIG_ACTUALIZADA', `${currentUser?.nombre} actualizó la configuración del kiosco`);
        showToastAction('✓', 'Configuración guardada', 'success');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        if (window.confirm('¿Resetear configuración a los valores por defecto?')) {
            const defaults = {
                nombreKiosco: 'KIOSCO CENTRAL',
                direccion: '',
                telefono: '',
                imprimirTicket: false,
                moneda: '$',
            };
            setForm(defaults);
            updateConfiguracion(defaults);
            showToastAction('✓', 'Configuración reseteada', 'info');
        }
    };

    const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    return (
        <div className="page active" id="page-config" style={{ flexDirection: 'column' }}>
            <div className="page-toolbar">
                <Settings size={18} style={{ color: 'var(--accent)' }} />
                <span className="page-title">Configuración del Sistema</span>
                <div className="spacer" />
                <button className="toolbar-btn btn-outline" onClick={handleReset}>
                    <RefreshCw size={14} /> Resetear
                </button>
                <button
                    className="toolbar-btn btn-primary"
                    onClick={handleSave}
                    style={{ background: saved ? 'var(--success)' : '' }}
                >
                    <Save size={14} /> {saved ? '¡Guardado!' : 'Guardar Cambios'}
                </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                <div className="config-grid">

                    {/* Datos del Kiosco */}
                    <div className="config-section">
                        <div className="config-section-title">
                            <Store size={18} /> Datos del Kiosco
                        </div>
                        <div className="config-section-body">
                            <div className="form-group">
                                <label className="form-label">Nombre del Kiosco</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ej: KIOSCO CENTRAL"
                                    value={form.nombreKiosco}
                                    onChange={e => f('nombreKiosco', e.target.value)}
                                />
                                <div className="field-hint">Se muestra en la pantalla de login y en los tickets</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    <MapPin size={13} /> Dirección
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    value={form.direccion}
                                    onChange={e => f('direccion', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    <Phone size={13} /> Teléfono
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ej: 011-4321-0000"
                                    value={form.telefono}
                                    onChange={e => f('telefono', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Símbolo de Moneda</label>
                                <select
                                    className="form-control"
                                    value={form.moneda}
                                    onChange={e => f('moneda', e.target.value)}
                                >
                                    <option value="$">$ - Peso Argentino</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Impresión */}
                    <div className="config-section">
                        <div className="config-section-title">
                            <Printer size={18} /> Impresión de Tickets
                        </div>
                        <div className="config-section-body">
                            <div className="config-toggle-row">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Imprimir ticket automáticamente</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                                        Abre el diálogo de impresión al confirmar cada venta
                                    </div>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={form.imprimirTicket}
                                        onChange={e => f('imprimirTicket', e.target.checked)}
                                    />
                                    <span className="toggle-slider" />
                                </label>
                            </div>
                            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text3)' }}>
                                <Printer size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                <b>Ticket térmico 80mm:</b> El ticket se imprime en formato optimizado para impresoras térmicas. También podés imprimir manualmente desde el modal de venta exitosa.
                            </div>
                        </div>
                    </div>

                    {/* Sistema */}
                    <div className="config-section" style={{ gridColumn: 'span 2' }}>
                        <div className="config-section-title">
                            <MonitorSmartphone size={18} /> Información del Sistema
                        </div>
                        <div className="config-section-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                {[
                                    { label: 'Nombre del Sistema', value: 'Gestify POS Kiosco' },
                                    { label: 'Versión', value: '2.0.0' },
                                    { label: 'Almacenamiento', value: 'Local + Supabase' },
                                    { label: 'Tecnología', value: 'React + Electron' },
                                    { label: 'Modo Offline', value: '✓ Gracia 3 días' },
                                    { label: 'Compatibilidad Escáner', value: '✓ HID / USB / BT' },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Licencia */}
                    <div className="config-section" style={{ gridColumn: 'span 2' }}>
                        <div className="config-section-title">
                            <ShieldCheck size={18} /> Licencia y Suscripción
                        </div>
                        <div className="config-section-body">
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>
                                    Clave única de esta instalación (Client Key)
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <code style={{
                                        flex: 1, padding: '10px 14px', background: 'var(--surface2)',
                                        border: '1px solid var(--border)', borderRadius: '8px',
                                        fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.5px',
                                        overflowX: 'auto', whiteSpace: 'nowrap',
                                    }}>
                                        {clientKey}
                                    </code>
                                    <button className="toolbar-btn btn-outline" onClick={copyKey}>
                                        <Copy size={13} /> {copied ? '¡Copiado!' : 'Copiar'}
                                    </button>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
                                    Enviá esta clave a tu proveedor para activar la suscripción.
                                </div>
                            </div>
                            <button className="toolbar-btn btn-primary" onClick={onOpenAdmin} style={{ gap: '6px' }}>
                                <ExternalLink size={13} /> Panel de administración
                            </button>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
                                Solo para el proveedor del software. Requiere credenciales de administrador.
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
