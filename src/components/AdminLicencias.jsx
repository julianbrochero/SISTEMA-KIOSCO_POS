import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { LogIn, LogOut, Plus, RefreshCw, Check, X, Users, Key, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

// ── Admin panel del dueño del software (acceso via Supabase Auth) ────────────
export default function AdminLicencias({ onClose }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Datos
  const [clientes, setClientes] = useState([]);
  const [expanded, setExpanded] = useState(null);

  // Nuevo cliente
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({ nombre_negocio: '', email: '', telefono: '' });

  // Nueva licencia
  const [newLic, setNewLic] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setSession(data.session); loadClientes(); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, sess) => {
      setSession(sess);
      if (sess) loadClientes();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function login() {
    setLoginErr(''); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginErr('Email o contraseña incorrectos');
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function loadClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*, licencias(id, fecha_inicio, fecha_vencimiento, monto, pagado, fecha_pago)')
      .order('created_at', { ascending: false });
    setClientes(data || []);
  }

  async function crearCliente() {
    if (!newCliente.nombre_negocio.trim()) return;
    setLoading(true);
    await supabase.from('clientes').insert(newCliente);
    setNewCliente({ nombre_negocio: '', email: '', telefono: '' });
    setShowNewCliente(false);
    await loadClientes();
    setLoading(false);
  }

  async function toggleActivo(cliente) {
    await supabase.from('clientes').update({ activo: !cliente.activo }).eq('id', cliente.id);
    loadClientes();
  }

  async function registrarPago(clienteId) {
    const datos = newLic[clienteId];
    if (!datos?.fecha_vencimiento) return;
    setLoading(true);
    await supabase.from('licencias').insert({
      cliente_id: clienteId,
      fecha_inicio: datos.fecha_inicio || new Date().toISOString().slice(0, 10),
      fecha_vencimiento: datos.fecha_vencimiento,
      monto: datos.monto || 14999,
      pagado: true,
      fecha_pago: new Date().toISOString(),
      notas: datos.notas || '',
    });
    setNewLic(prev => ({ ...prev, [clienteId]: {} }));
    await loadClientes();
    setLoading(false);
  }

  async function marcarPagado(licId, pagado) {
    await supabase.from('licencias').update({
      pagado,
      fecha_pago: pagado ? new Date().toISOString() : null,
    }).eq('id', licId);
    loadClientes();
  }

  // Calcula estado de licencia actual
  function estadoLicencia(licencias) {
    if (!licencias?.length) return { label: 'Sin licencia', color: '#6b7280' };
    const ultima = [...licencias].sort((a, b) => new Date(b.fecha_vencimiento) - new Date(a.fecha_vencimiento))[0];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const vence = new Date(ultima.fecha_vencimiento + 'T00:00:00');
    const dias = Math.ceil((vence - hoy) / 86400000);
    if (!ultima.pagado) return { label: 'No pagado', color: '#ef4444', dias };
    if (dias <= 0) return { label: 'Vencido', color: '#ef4444', dias };
    if (dias <= 7) return { label: `Vence en ${dias}d`, color: '#f59e0b', dias };
    return { label: `Activo — ${dias}d`, color: '#10b981', dias };
  }

  function nlv(clienteId) {
    return newLic[clienteId] || {};
  }
  function setNlv(clienteId, campo, val) {
    setNewLic(prev => ({ ...prev, [clienteId]: { ...prev[clienteId], [campo]: val } }));
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  const overlay = {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'flex-start', justifyContent: 'center',
    padding: '24px 12px', overflowY: 'auto',
    backdropFilter: 'blur(4px)',
  };
  const card = {
    background: 'var(--surface)', borderRadius: '16px',
    width: '100%', maxWidth: '780px',
    border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  };
  const header = {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px',
  };
  const inp = {
    width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', boxSizing: 'border-box',
  };
  const btn = (color = '#4f46e5') => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    background: color, color: '#fff', fontWeight: 600, fontSize: '13px',
    display: 'flex', alignItems: 'center', gap: '6px',
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ ...card, maxWidth: '380px', marginTop: '80px' }}>
          <div style={header}>
            <Key size={20} color="#fff" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
              Administrador del Software
            </span>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ padding: '32px 28px' }}>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '20px' }}>
              Ingresá con tu cuenta de Supabase para gestionar licencias.
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: '4px' }}>Email</label>
              <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@email.com" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: '4px' }}>Contraseña</label>
              <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && login()} />
            </div>
            {loginErr && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>{loginErr}</p>}
            <button style={{ ...btn(), width: '100%', justifyContent: 'center' }} onClick={login} disabled={loading}>
              <LogIn size={15} /> {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Panel principal ─────────────────────────────────────────────────────────
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={card}>

        {/* Header */}
        <div style={header}>
          <Users size={20} color="#fff" />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
            Panel de Licencias — Gestify POS
          </span>
          <div style={{ flex: 1 }} />
          <button style={{ ...btn('rgba(255,255,255,0.15)'), marginRight: '8px' }} onClick={logout}>
            <LogOut size={14} /> Salir
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)' }}>
          <button style={btn()} onClick={() => setShowNewCliente(v => !v)}>
            <Plus size={14} /> Nuevo cliente
          </button>
          <button style={btn('#374151')} onClick={loadClientes}>
            <RefreshCw size={14} /> Actualizar
          </button>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)', alignSelf: 'center' }}>
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Formulario nuevo cliente */}
        {showNewCliente && (
          <div style={{ padding: '16px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text2)', display: 'block', marginBottom: '3px' }}>Nombre del negocio *</label>
                <input style={inp} value={newCliente.nombre_negocio}
                  onChange={e => setNewCliente(p => ({ ...p, nombre_negocio: e.target.value }))}
                  placeholder="Kiosco San Martín" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text2)', display: 'block', marginBottom: '3px' }}>Email</label>
                <input style={inp} value={newCliente.email}
                  onChange={e => setNewCliente(p => ({ ...p, email: e.target.value }))}
                  placeholder="dueno@email.com" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text2)', display: 'block', marginBottom: '3px' }}>Teléfono</label>
                <input style={inp} value={newCliente.telefono}
                  onChange={e => setNewCliente(p => ({ ...p, telefono: e.target.value }))}
                  placeholder="11-1234-5678" />
              </div>
            </div>
            <button style={btn('#10b981')} onClick={crearCliente} disabled={loading}>
              <Check size={14} /> Crear cliente
            </button>
          </div>
        )}

        {/* Lista de clientes */}
        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {clientes.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text3)' }}>
              No hay clientes todavía. Creá el primero con el botón de arriba.
            </div>
          )}

          {clientes.map(c => {
            const est = estadoLicencia(c.licencias);
            const isOpen = expanded === c.id;
            const licOrdenadas = [...(c.licencias || [])].sort((a, b) =>
              new Date(b.fecha_vencimiento) - new Date(a.fecha_vencimiento)
            );

            return (
              <div key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>

                {/* Fila cliente */}
                <div
                  style={{
                    padding: '14px 20px', display: 'flex', alignItems: 'center',
                    gap: '12px', cursor: 'pointer',
                    background: isOpen ? 'var(--surface2)' : 'transparent',
                  }}
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: c.activo ? '#4f46e5' : '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                  }}>
                    {c.nombre_negocio.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {c.nombre_negocio}
                      {!c.activo && <span style={{ fontSize: '11px', background: '#374151', color: '#9ca3af', padding: '2px 6px', borderRadius: '4px' }}>SUSPENDIDO</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                      {c.email || c.telefono || '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, color: est.color,
                      background: `${est.color}22`, padding: '3px 10px', borderRadius: '12px',
                    }}>
                      {est.label}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
                </div>

                {/* Detalle expandido */}
                {isOpen && (
                  <div style={{ padding: '0 20px 20px 68px', background: 'var(--surface2)' }}>

                    {/* Client key */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 12px', background: 'var(--surface)', borderRadius: '8px',
                      marginBottom: '16px', border: '1px solid var(--border)',
                    }}>
                      <Key size={13} color="var(--text3)" />
                      <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '4px' }}>CLIENT KEY:</span>
                      <code style={{ fontSize: '12px', color: 'var(--accent)', flex: 1 }}>{c.client_key}</code>
                      <button
                        style={{ ...btn('#374151'), padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => navigator.clipboard.writeText(c.client_key)}
                      >
                        Copiar
                      </button>
                    </div>

                    {/* Registrar nuevo pago */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '8px' }}>
                        Registrar pago
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '3px' }}>Desde</label>
                          <input type="date" style={inp}
                            value={nlv(c.id).fecha_inicio || ''}
                            onChange={e => setNlv(c.id, 'fecha_inicio', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '3px' }}>Vencimiento *</label>
                          <input type="date" style={inp}
                            value={nlv(c.id).fecha_vencimiento || ''}
                            onChange={e => setNlv(c.id, 'fecha_vencimiento', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '3px' }}>Monto $</label>
                          <input type="number" style={inp} placeholder="14999"
                            value={nlv(c.id).monto || ''}
                            onChange={e => setNlv(c.id, 'monto', e.target.value)} />
                        </div>
                        <button
                          style={btn('#10b981')}
                          onClick={() => registrarPago(c.id)}
                          disabled={!nlv(c.id).fecha_vencimiento || loading}
                        >
                          <DollarSign size={14} /> Confirmar pago
                        </button>
                      </div>
                    </div>

                    {/* Historial de licencias */}
                    {licOrdenadas.length > 0 && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '8px' }}>
                          Historial de pagos
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ color: 'var(--text3)' }}>
                              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Desde</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Vencimiento</th>
                              <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Monto</th>
                              <th style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600 }}>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {licOrdenadas.map(lic => (
                              <tr key={lic.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={{ padding: '6px 8px', color: 'var(--text2)' }}>
                                  <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />
                                  {lic.fecha_inicio}
                                </td>
                                <td style={{ padding: '6px 8px', color: 'var(--text2)' }}>{lic.fecha_vencimiento}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                                  ${Number(lic.monto).toLocaleString('es-AR')}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                  {lic.pagado
                                    ? <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Pagado</span>
                                    : <button style={{ ...btn('#ef4444'), padding: '3px 8px', fontSize: '11px' }}
                                        onClick={() => marcarPagado(lic.id, true)}>
                                        Marcar pagado
                                      </button>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Suspender/activar */}
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <button
                        style={btn(c.activo ? '#ef4444' : '#10b981')}
                        onClick={() => toggleActivo(c)}
                      >
                        {c.activo ? <><X size={13} /> Suspender cliente</> : <><Check size={13} /> Reactivar cliente</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
