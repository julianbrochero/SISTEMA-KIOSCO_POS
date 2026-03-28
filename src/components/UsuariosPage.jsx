import { useState } from 'react';
import { useStore } from '../store';
import { Users, Plus, Edit2, Trash2, ShieldCheck, User, Eye, EyeOff, KeyRound, XCircle, CheckCircle2 } from 'lucide-react';

export default function UsuariosPage() {
    const activePage = useStore(s => s.activePage);
    const usuarios = useStore(s => s.usuarios);
    const currentUser = useStore(s => s.currentUser);
    const addUsuario = useStore(s => s.addUsuario);
    const updateUsuario = useStore(s => s.updateUsuario);
    const deleteUsuario = useStore(s => s.deleteUsuario);
    const addLog = useStore(s => s.addLog);
    const showToastAction = useStore(s => s.showToastAction);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showPins, setShowPins] = useState({});
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [form, setForm] = useState({ nombre: '', pin: '', rol: 'cajero', activo: true });
    const [pinError, setPinError] = useState('');

    if (activePage !== 'usuarios') return null;

    const togglePin = (id) => setShowPins(prev => ({ ...prev, [id]: !prev[id] }));

    const openAdd = () => {
        setEditingId(null);
        setForm({ nombre: '', pin: '', rol: 'cajero', activo: true });
        setPinError('');
        setModalOpen(true);
    };

    const openEdit = (u) => {
        setEditingId(u.id);
        setForm({ nombre: u.nombre, pin: u.pin, rol: u.rol, activo: u.activo });
        setPinError('');
        setModalOpen(true);
    };

    const validatePin = (pin) => {
        if (!pin || pin.length < 4) return 'El PIN debe tener al menos 4 dígitos';
        if (!/^\d+$/.test(pin)) return 'El PIN solo puede contener números';
        const dup = usuarios.find(u => u.pin === pin && u.id !== editingId);
        if (dup) return `El PIN ya está en uso por ${dup.nombre}`;
        return '';
    };

    const handleSave = () => {
        const { nombre, pin, rol, activo } = form;
        if (!nombre.trim()) { showToastAction('!', 'El nombre es requerido', 'warn'); return; }
        const err = validatePin(pin);
        if (err) { setPinError(err); return; }

        if (editingId) {
            updateUsuario(editingId, { nombre: nombre.trim(), pin, rol, activo });
            addLog('USUARIO_EDITADO', `${currentUser?.nombre} editó usuario: ${nombre.trim()} (${rol})`);
            showToastAction('✓', 'Usuario actualizado', 'success');
        } else {
            addUsuario({ nombre: nombre.trim(), pin, rol });
            addLog('USUARIO_CREADO', `${currentUser?.nombre} creó usuario: ${nombre.trim()} (${rol})`);
            showToastAction('✓', 'Usuario creado', 'success');
        }
        setModalOpen(false);
    };

    const handleDelete = (id) => {
        if (id === currentUser?.id) {
            showToastAction('!', 'No podés eliminar tu propio usuario', 'error');
            return;
        }
        const u = usuarios.find(x => x.id === id);
        deleteUsuario(id);
        addLog('USUARIO_ELIMINADO', `${currentUser?.nombre} eliminó usuario: ${u?.nombre}`);
        showToastAction('✓', 'Usuario eliminado', 'success');
        setConfirmDeleteId(null);
    };

    const toggleActivo = (u) => {
        if (u.id === currentUser?.id) {
            showToastAction('!', 'No podés desactivar tu propio usuario', 'warn');
            return;
        }
        updateUsuario(u.id, { activo: !u.activo });
        addLog('USUARIO_ESTADO', `${currentUser?.nombre} ${!u.activo ? 'activó' : 'desactivó'} usuario: ${u.nombre}`);
        showToastAction('✓', `Usuario ${!u.activo ? 'activado' : 'desactivado'}`, 'success');
    };

    const BG     = '#f1f4f9';
    const WHITE  = '#ffffff';
    const BORDER = '#e4e7ef';
    const TEXT1  = '#0f1117';
    const TEXT2  = '#4b5563';
    const TEXT3  = '#9ca3af';
    const SHADOW = '0 1px 2px rgba(15,17,23,0.04), 0 4px 20px rgba(15,17,23,0.07)';

    const inp = {
        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
        border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14,
        color: TEXT1, background: '#f8fafc', outline: 'none',
        fontFamily: 'inherit', transition: 'all 0.18s',
    };
    const onFocus = e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = WHITE; e.target.style.boxShadow = '0 0 0 3px #dbeafe'; };
    const onBlur  = e => { e.target.style.borderColor = BORDER; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; };

    const activos = usuarios.filter(u => u.activo).length;

    return (
        <div className="page active" id="page-usuarios" style={{ background: BG, padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* ── TOPBAR ── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, height: 64, padding: '0 24px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, boxShadow: '0 1px 0 rgba(15,17,23,0.05)' }}>
                <div>
                    <span style={{ fontSize: 17, fontWeight: 700, color: TEXT1, letterSpacing: '-0.4px' }}>Empleados</span>
                    <span style={{ fontSize: 12, color: TEXT3, fontWeight: 500, marginLeft: 8 }}>· {activos} activos de {usuarios.length}</span>
                </div>
                <div style={{ flex: 1 }} />
                <button onClick={openAdd}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: '#0f1117', color: WHITE, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(15,17,23,0.22)', transition: 'all 0.18s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1e2432'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0f1117'; e.currentTarget.style.transform = 'none'; }}>
                    <Plus size={15} /> Nuevo Empleado
                </button>
            </div>

            {/* ── CONTENIDO ── */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Resumen */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <div style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', borderRadius: 16, border: '1.5px solid #93c5fd', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Users size={20} style={{ color: '#1d4ed8' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#1e3a8a', lineHeight: 1 }}>{usuarios.length}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginTop: 3 }}>Total empleados</div>
                        </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)', borderRadius: 16, border: '1.5px solid #86efac', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle2 size={20} style={{ color: '#15803d' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#14532d', lineHeight: 1 }}>{activos}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginTop: 3 }}>Activos</div>
                        </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)', borderRadius: 16, border: '1.5px solid #fcd34d', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShieldCheck size={20} style={{ color: '#b45309' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#78350f', lineHeight: 1 }}>{usuarios.filter(u => u.rol === 'admin').length}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#d97706', marginTop: 3 }}>Administradores</div>
                        </div>
                    </div>
                </div>

                {/* Cards de empleados */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {usuarios.map(u => {
                        const isAdmin = u.rol === 'admin';
                        const isMe = u.id === currentUser?.id;
                        return (
                            <div key={u.id} style={{ background: WHITE, borderRadius: 18, border: `1px solid ${u.activo ? BORDER : '#fca5a5'}`, boxShadow: SHADOW, overflow: 'hidden', opacity: u.activo ? 1 : 0.75, transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,17,23,0.08),0 8px 32px rgba(15,17,23,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = SHADOW; }}>

                                {/* Header colorido */}
                                <div style={{ height: 6, background: isAdmin ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#3b82f6,#1d4ed8)' }} />

                                <div style={{ padding: '18px 20px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                    {/* Avatar */}
                                    <div style={{ width: 52, height: 52, borderRadius: 14, background: isAdmin ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${isAdmin ? '#fcd34d' : '#93c5fd'}` }}>
                                        {isAdmin ? <ShieldCheck size={24} style={{ color: '#b45309' }} /> : <User size={24} style={{ color: '#1d4ed8' }} />}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span style={{ fontSize: 15, fontWeight: 700, color: TEXT1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nombre}</span>
                                            {isMe && <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Vos</span>}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isAdmin ? '#fef3c7' : '#dbeafe', color: isAdmin ? '#b45309' : '#1d4ed8' }}>
                                                {isAdmin ? 'ADMIN' : 'CAJERO'}
                                            </span>
                                            {!u.activo && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#fee2e2', color: '#dc2626' }}>INACTIVO</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* PIN */}
                                <div style={{ margin: '0 20px 16px', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <KeyRound size={13} style={{ color: TEXT3, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: TEXT2, fontWeight: 600, flex: 1 }}>PIN:</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT1, letterSpacing: showPins[u.id] ? '0' : '3px', fontVariantNumeric: 'tabular-nums' }}>
                                        {showPins[u.id] ? u.pin : '•'.repeat(u.pin.length)}
                                    </span>
                                    <button onClick={() => togglePin(u.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT3, display: 'flex', alignItems: 'center', padding: 2 }}>
                                        {showPins[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>

                                {/* Acciones */}
                                <div style={{ padding: '12px 20px', borderTop: `1px solid #f3f4f6`, display: 'flex', gap: 8 }}>
                                    <button onClick={() => toggleActivo(u)} title={u.activo ? 'Desactivar' : 'Activar'}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 9, border: `1.5px solid ${u.activo ? '#86efac' : BORDER}`, background: u.activo ? '#f0fdf4' : '#f8fafc', color: u.activo ? '#16a34a' : TEXT3, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                        <CheckCircle2 size={14} /> {u.activo ? 'Activo' : 'Inactivo'}
                                    </button>
                                    <button onClick={() => openEdit(u)} title="Editar"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: `1.5px solid #93c5fd`, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                        <Edit2 size={14} /> Editar
                                    </button>
                                    <button onClick={() => setConfirmDeleteId(u.id)} title="Eliminar" disabled={isMe}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${isMe ? BORDER : '#fca5a5'}`, background: isMe ? '#f8fafc' : '#fef2f2', color: isMe ? TEXT3 : '#dc2626', cursor: isMe ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: isMe ? 0.5 : 1 }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info roles */}
                <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <ShieldCheck size={18} style={{ color: '#b45309', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
                        <b>Roles del sistema:</b> El <b>Admin</b> tiene acceso completo (reportes, empleados, logs, config). El <b>Cajero</b> accede a POS, Caja, Stock e Historial.
                    </div>
                </div>
            </div>

            {/* ── MODAL ALTA/EDICIÓN ── */}
            {modalOpen && (
                <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: WHITE, borderRadius: 20, width: 440, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 8px 40px rgba(15,17,23,0.22)', overflow: 'hidden' }}>
                        {/* Header modal */}
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid #f3f4f6`, background: '#fafafa', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={18} style={{ color: '#1d4ed8' }} />
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1 }}>{editingId ? 'Editar Empleado' : 'Nuevo Empleado'}</div>
                            <button onClick={() => setModalOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: TEXT3, display: 'flex' }}>
                                <XCircle size={20} />
                            </button>
                        </div>
                        {/* Body modal */}
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Nombre *</label>
                                <input type="text" placeholder="Nombre del empleado" value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    style={inp} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>PIN (mín. 4 dígitos) *</label>
                                <input type="text" placeholder="Ej: 1234" value={form.pin} maxLength={6} inputMode="numeric"
                                    onChange={e => { setForm({ ...form, pin: e.target.value }); setPinError(''); }}
                                    style={{ ...inp, borderColor: pinError ? '#fca5a5' : BORDER }}
                                    onFocus={onFocus} onBlur={onBlur} />
                                {pinError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 5, fontWeight: 500 }}>{pinError}</div>}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Rol</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {['cajero', 'admin'].map(r => {
                                        const sel = form.rol === r;
                                        return (
                                            <button key={r} onClick={() => setForm({ ...form, rol: r })}
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: `2px solid ${sel ? (r === 'admin' ? '#fcd34d' : '#93c5fd') : BORDER}`, background: sel ? (r === 'admin' ? '#fffbeb' : '#eff6ff') : '#f8fafc', color: sel ? (r === 'admin' ? '#b45309' : '#1d4ed8') : TEXT2, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                                {r === 'admin' ? <ShieldCheck size={16} /> : <User size={16} />}
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {editingId && (
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Estado</label>
                                    <button onClick={() => setForm({ ...form, activo: !form.activo })}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: `2px solid ${form.activo ? '#86efac' : BORDER}`, background: form.activo ? '#f0fdf4' : '#f8fafc', color: form.activo ? '#16a34a' : TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                        <CheckCircle2 size={15} /> {form.activo ? 'Activo' : 'Inactivo'}
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Footer modal */}
                        <div style={{ padding: '16px 24px', borderTop: `1px solid #f3f4f6`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setModalOpen(false)}
                                style={{ padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: '#f8fafc', color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancelar
                            </button>
                            <button onClick={handleSave}
                                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#0f1117', color: WHITE, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(15,17,23,0.22)' }}>
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CONFIRMAR ELIMINAR ── */}
            {confirmDeleteId && (
                <div onClick={e => { if (e.target === e.currentTarget) setConfirmDeleteId(null); }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: WHITE, borderRadius: 20, width: 360, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 8px 40px rgba(15,17,23,0.22)', padding: '32px 28px', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Trash2 size={28} style={{ color: '#dc2626' }} />
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: TEXT1, marginBottom: 8 }}>¿Eliminar empleado?</div>
                        <p style={{ fontSize: 13, color: TEXT3, margin: '0 0 24px' }}>Esta acción no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setConfirmDeleteId(null)}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: '#f8fafc', color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancelar
                            </button>
                            <button onClick={() => handleDelete(confirmDeleteId)}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#dc2626', color: WHITE, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
