import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import {
    Users, Plus, Edit2, Trash2, ShieldCheck, User, Eye, EyeOff,
    KeyRound, XCircle, CheckCircle2, Search, Download, Briefcase,
    Activity, Clock, ChevronRight, PieChart, ShoppingCart
} from 'lucide-react';

export default function UsuariosPage() {
    const activePage = useStore(s => s.activePage);
    const usuarios = useStore(s => s.usuarios) || [];
    const sales = useStore(s => s.sales) || [];
    const logs = useStore(s => s.logs) || [];
    const currentUser = useStore(s => s.currentUser);
    const addUsuario = useStore(s => s.addUsuario);
    const updateUsuario = useStore(s => s.updateUsuario);
    const deleteUsuario = useStore(s => s.deleteUsuario);
    const addLog = useStore(s => s.addLog);
    const showToastAction = useStore(s => s.showToastAction);

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [detailUsuario, setDetailUsuario] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // States
    const [editingId, setEditingId] = useState(null);
    const [showPins, setShowPins] = useState({});
    const [form, setForm] = useState({ nombre: '', pin: '', rol: 'cajero', activo: true });
    const [pinError, setPinError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');

    const filteredUsuarios = useMemo(() => {
        return usuarios.filter(u => {
            if (searchTerm && !u.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (filterStatus === 'activos' && !u.activo) return false;
            if (filterStatus === 'inactivos' && u.activo) return false;
            if (filterStatus === 'admin' && u.rol !== 'admin') return false;
            if (filterStatus === 'cajero' && u.rol !== 'cajero') return false;
            return true;
        });
    }, [usuarios, searchTerm, filterStatus]);

    if (activePage !== 'usuarios') return null;

    // --- Helpers ---
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
            addLog('USUARIO_EDITADO', `${currentUser?.nombre} editó a ${nombre.trim()} (${rol})`);
            showToastAction('✓', 'Empleado actualizado', 'success');
        } else {
            addUsuario({ nombre: nombre.trim(), pin, rol });
            addLog('USUARIO_CREADO', `${currentUser?.nombre} registró a ${nombre.trim()} (${rol})`);
            showToastAction('✓', 'Empleado registrado', 'success');
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
        addLog('USUARIO_ELIMINADO', `${currentUser?.nombre} eliminó a ${u?.nombre}`);
        showToastAction('✓', 'Empleado eliminado', 'success');
        setConfirmDeleteId(null);
        if (detailUsuario?.id === id) setDetailUsuario(null);
    };

    const toggleActivo = (u) => {
        if (u.id === currentUser?.id) {
            showToastAction('!', 'No podés cambiar tu propio estado', 'warn');
            return;
        }
        updateUsuario(u.id, { activo: !u.activo });
        addLog('USUARIO_ESTADO', `${currentUser?.nombre} ${!u.activo ? 'activó' : 'desactivó'} a ${u.nombre}`);
        showToastAction('✓', `Empleado ${!u.activo ? 'activado' : 'desactivado'}`, 'success');
    };

    const toggleRolInline = (u) => {
        if (u.id === currentUser?.id) {
            showToastAction('!', 'No podés cambiar tu propio rol', 'warn');
            return;
        }
        const nuevoRol = u.rol === 'admin' ? 'cajero' : 'admin';
        updateUsuario(u.id, { rol: nuevoRol });
        addLog('USUARIO_ROL', `${currentUser?.nombre} cambió rol de ${u.nombre} a ${nuevoRol}`);
        showToastAction('✓', `Rol actualizado a ${nuevoRol}`, 'success');
    };

    const exportCSV = () => {
        const headers = ["ID", "Nombre", "Rol", "Estado", "PIN"];
        const rows = usuarios.map(u => [u.id, u.nombre, u.rol, u.activo ? "Activo" : "Inactivo", u.pin]);
        const content = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(content));
        link.setAttribute("download", `empleados_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToastAction('✓', 'CSV Exportado', 'success');
    };

    // --- Computed Data ---
    const activos = usuarios.filter(u => u.activo).length;
    const inactivos = usuarios.length - activos;
    const admins = usuarios.filter(u => u.rol === 'admin').length;

    const getUserStats = (uid, uname) => {
        const userSales = sales.filter(s => !s.anulada && (s.usuarioId === uid || s.usuarioNombre === uname));
        const totalVendido = userSales.reduce((acc, s) => acc + s.total, 0);
        const userLogs = logs.filter(l => l.detalle.includes(uname)).slice(0, 10);
        return { count: userSales.length, total: totalVendido, logs: userLogs };
    };

    const getHslColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${hash % 360}, 75%, 60%)`;
    };

    // --- Styles Vars ---
    const BG = '#F8FAFC';
    const WHITE = '#FFFFFF';
    const BORDER = '#E2E8F0';
    const TEXT1 = '#0F172A';
    const TEXT2 = '#475569';
    const TEXT3 = '#64748B';
    const ACCENT = '#0F172A'; // SaaS Black
    const RED = '#EF4444';
    const GREEN = '#10B981';
    const BLUE = '#3B82F6';

    return (
        <div className="page active" id="page-usuarios" style={{ background: BG, padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* ── HEADER ── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '0 32px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 24, borderRight: `1px solid ${BORDER}` }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: TEXT1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Empleados</span>
                        <span style={{ fontSize: 13, color: TEXT3, fontWeight: 500 }}>Gestión de equipo</span>
                    </div>
                    {/* Search */}
                    <div style={{ position: 'relative', width: 300 }}>
                        <Search size={16} color={TEXT3} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', height: 40, padding: '0 16px 0 42px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#F1F5F9', fontSize: 13, color: TEXT1, outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                            onFocus={e => { e.target.style.background = WHITE; e.target.style.borderColor = ACCENT; }}
                            onBlur={e => { e.target.style.background = '#F1F5F9'; e.target.style.borderColor = BORDER; }}
                        />
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={exportCSV} style={{ padding: '0 16px', height: 40, borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                        onMouseEnter={e => e.target.style.background = '#F8FAFC'} onMouseLeave={e => e.target.style.background = WHITE}>
                        <Download size={16} /> Exportar CSV
                    </button>
                    <button onClick={openAdd} style={{ padding: '0 20px', height: 40, borderRadius: 8, border: 'none', background: ACCENT, color: WHITE, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        onMouseEnter={e => e.target.style.filter = 'brightness(1.2)'} onMouseLeave={e => e.target.style.filter = 'none'}>
                        <Plus size={16} /> Nuevo empleado
                    </button>
                </div>
            </div>

            {/* ── CONTENIDO ── */}
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
                
                {/* ── KPIs ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={22} color={TEXT2} />
                        </div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: TEXT1, lineHeight: 1 }}>{usuarios.length}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT3, marginTop: 4 }}>Total Empleados</div>
                        </div>
                    </div>
                    <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={22} color={GREEN} />
                        </div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: '#065F46', lineHeight: 1 }}>{activos}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: GREEN, marginTop: 4 }}>Activos</div>
                        </div>
                    </div>
                    <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={22} color={TEXT3} />
                        </div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: TEXT2, lineHeight: 1 }}>{inactivos}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT3, marginTop: 4 }}>Inactivos</div>
                        </div>
                    </div>
                    <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={22} color={BLUE} />
                        </div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: '#1E3A8A', lineHeight: 1 }}>{admins}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: BLUE, marginTop: 4 }}>Administradores</div>
                        </div>
                    </div>
                </div>

                {/* ── TABLA PRINCIPAL ── */}
                <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 400, overflow: 'hidden' }}>
                    
                    {/* Filters Strip */}
                    <div style={{ padding: '16px 24px', borderBottom: `1px solid #F1F5F9`, display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAFA' }}>
                        {[
                            { key: 'todos', label: 'Todos' },
                            { key: 'activos', label: 'Activos' },
                            { key: 'inactivos', label: 'Inactivos' },
                            { key: 'admin', label: 'Administradores' },
                            { key: 'cajero', label: 'Cajeros / Vendedores' }
                        ].map(f => {
                            const isActive = filterStatus === f.key;
                            return (
                                <button key={f.key} onClick={() => setFilterStatus(f.key)}
                                    style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${isActive ? '#CBD5E1' : 'transparent'}`, background: isActive ? WHITE : 'transparent', color: isActive ? TEXT1 : TEXT3, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                                    {f.label}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                                <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BORDER}` }}>
                                    <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empleado</th>
                                    <th style={{ padding: '16px 16px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol de Acceso</th>
                                    <th style={{ padding: '16px 16px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                    <th style={{ padding: '16px 16px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rendimiento</th>
                                    <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsuarios.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '80px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: TEXT3 }}>
                                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F1F5F9', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Users size={28} color="#CBD5E1" />
                                                </div>
                                                <span style={{ fontSize: 16, fontWeight: 600, color: TEXT1 }}>No hay empleados registrados</span>
                                                <button onClick={openAdd} style={{ padding: '8px 16px', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8, color: TEXT1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    Crear el primero
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsuarios.map((u, idx) => {
                                    const isAdmin = u.rol === 'admin';
                                    const isMe = u.id === currentUser?.id;
                                    const stats = getUserStats(u.id, u.nombre);
                                    
                                    return (
                                        <tr key={u.id} style={{ borderBottom: idx < filteredUsuarios.length - 1 ? `1px solid #F1F5F9` : 'none', opacity: u.activo ? 1 : 0.6, transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            
                                            {/* Empleado */}
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: getHslColor(u.nombre), display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontWeight: 700, fontSize: 14, flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                        {u.nombre.charAt(0).toUpperCase()}
                                                        {isMe && <div style={{ position: 'absolute', transform: 'translate(14px, 14px)', width: 12, height: 12, borderRadius: '50%', background: GREEN, border: `2px solid ${WHITE}` }} title="Vos" />}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT1 }}>{u.nombre} {isMe && <span style={{ fontSize: 10, background: '#E2E8F0', padding: '2px 6px', borderRadius: 4, marginLeft: 4 }}>TÚ</span>}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: TEXT3, marginTop: 2 }}>
                                                            <KeyRound size={12} /> PIN: {showPins[u.id] ? <span style={{ fontWeight: 700, color: TEXT2 }}>{u.pin}</span> : '••••'}
                                                            <span onClick={() => togglePin(u.id)} style={{ cursor: 'pointer', padding: 2, display: 'flex' }} title="Revelar">
                                                                {showPins[u.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rol */}
                                            <td style={{ padding: '16px 16px' }}>
                                                <div onClick={() => toggleRolInline(u)} title={isMe ? '' : 'Click para cambiar rol'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: isAdmin ? '#EFF6FF' : '#F1F5F9', color: isAdmin ? BLUE : TEXT2, cursor: isMe ? 'default' : 'pointer', border: `1px solid ${isAdmin ? '#BFDBFE' : BORDER}`, transition: 'all 0.15s' }}>
                                                    {isAdmin ? <ShieldCheck size={14} /> : <Briefcase size={14} />}
                                                    {isAdmin ? 'Administrador' : 'Cajero'}
                                                </div>
                                            </td>

                                            {/* Estado */}
                                            <td style={{ padding: '16px 16px' }}>
                                                <span onClick={() => toggleActivo(u)} title={isMe ? '' : 'Click para cambiar estado'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: u.activo ? '#ECFDF5' : '#F8FAFC', color: u.activo ? '#059669' : TEXT3, cursor: isMe ? 'default' : 'pointer' }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.activo ? GREEN : TEXT3 }}></span>
                                                    {u.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>

                                            {/* Rendimiento (Ventas) */}
                                            <td style={{ padding: '16px 16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT1 }}>{stats.count} ventas</span>
                                                    <span style={{ fontSize: 12, color: TEXT3 }}>{fmt(stats.total)}</span>
                                                </div>
                                            </td>

                                            {/* Acciones */}
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                    <button onClick={() => setDetailUsuario(u)} title="Ver detalle" style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: TEXT2, transition: 'all 0.15s' }} onMouseEnter={e => {e.target.style.background = '#F1F5F9'; e.target.style.color = TEXT1}} onMouseLeave={e => {e.target.style.background = 'transparent'; e.target.style.color = TEXT2}}>
                                                        <Activity size={16} />
                                                    </button>
                                                    <button onClick={() => openEdit(u)} title="Editar" style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: BLUE, transition: 'all 0.15s' }} onMouseEnter={e => {e.target.style.background = '#EFF6FF';}} onMouseLeave={e => {e.target.style.background = 'transparent';}}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteId(u.id)} disabled={isMe} title="Eliminar" style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: isMe ? 'not-allowed' : 'pointer', color: isMe ? '#CBD5E1' : RED, transition: 'all 0.15s' }} onMouseEnter={e => {if (!isMe) e.target.style.background = '#FEF2F2';}} onMouseLeave={e => {if (!isMe) e.target.style.background = 'transparent';}}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODAL ALTA/EDICIÓN ── */}
            {modalOpen && (
                <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s' }}>
                    <div style={{ background: WHITE, borderRadius: 16, width: 440, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} color={BLUE} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT1 }}>{editingId ? 'Editar perfil' : 'Nuevo empleado'}</div>
                                    <div style={{ fontSize: 12, color: TEXT3 }}>Configure credenciales y accesos</div>
                                </div>
                            </div>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT3, padding: 4, borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <XCircle size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 8 }}>Nombre completo *</label>
                                <input type="text" placeholder="Ej: Juan Pérez" value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, color: TEXT1, outline: 'none' }} 
                                    onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = BORDER} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 8 }}>PIN de Acceso (mín. 4 dígitos) *</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" placeholder="Ej: 1234" value={form.pin} maxLength={6} inputMode="numeric"
                                        onChange={e => { setForm({ ...form, pin: e.target.value }); setPinError(''); }}
                                        style={{ width: '100%', padding: '10px 14px', paddingLeft: 40, borderRadius: 8, border: `1px solid ${pinError ? RED : BORDER}`, fontSize: 14, outline: 'none' }} 
                                        onFocus={e => { if(!pinError) e.target.style.borderColor = BLUE; }} onBlur={e => { if(!pinError) e.target.style.borderColor = BORDER; }} />
                                    <KeyRound size={16} color={TEXT3} style={{ position: 'absolute', left: 12, top: 12 }} />
                                </div>
                                {pinError && <div style={{ fontSize: 12, color: RED, marginTop: 6, fontWeight: 500 }}>{pinError}</div>}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 8 }}>Nivel de Permisos</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {['cajero', 'admin'].map(r => {
                                        const sel = form.rol === r;
                                        return (
                                            <button key={r} onClick={() => setForm({ ...form, rol: r })}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px', borderRadius: 12, border: `2px solid ${sel ? BLUE : BORDER}`, background: sel ? '#EFF6FF' : WHITE, cursor: 'pointer', transition: 'all 0.15s' }}>
                                                {r === 'admin' ? <ShieldCheck size={20} color={sel ? BLUE : TEXT3} /> : <Briefcase size={20} color={sel ? BLUE : TEXT3} />}
                                                <span style={{ fontSize: 13, fontWeight: 700, color: sel ? BLUE : TEXT2 }}>{r === 'admin' ? 'Administrador' : 'Cajero'}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BORDER}`, background: '#FAFAFA', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button onClick={() => setModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button onClick={handleSave} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: ACCENT, color: WHITE, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {editingId ? 'Guardar Cambios' : 'Registrar Empleado'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL DETALLE (MUY PRO) ── */}
            {detailUsuario && (
                <div onClick={e => { if (e.target === e.currentTarget) setDetailUsuario(null); }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', padding: 24 }}>
                    <div style={{ background: WHITE, borderRadius: 20, width: 680, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden', animation: 'fadeIn 0.2s' }}>
                        
                        {/* Header cover */}
                        <div style={{ height: 100, background: 'linear-gradient(135deg, #0F172A, #1E293B)', position: 'relative' }}>
                            <button onClick={() => setDetailUsuario(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: WHITE, padding: 6, borderRadius: '50%' }}>
                                <XCircle size={20} />
                            </button>
                        </div>
                        
                        {/* Profile Info */}
                        <div style={{ padding: '0 32px 24px', position: 'relative' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: WHITE, padding: 4, position: 'absolute', top: -40, left: 24 }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: getHslColor(detailUsuario.nombre), display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontSize: 32, fontWeight: 700 }}>
                                    {detailUsuario.nombre.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            
                            <div style={{ marginLeft: 90, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, color: TEXT1, margin: 0 }}>{detailUsuario.nombre}</h2>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                        <span style={{ fontSize: 13, background: '#F1F5F9', padding: '4px 10px', borderRadius: 20, color: TEXT2, fontWeight: 600 }}>ROL: {detailUsuario.rol.toUpperCase()}</span>
                                        <span style={{ fontSize: 13, background: detailUsuario.activo ? '#ECFDF5' : '#FEF2F2', color: detailUsuario.activo ? GREEN : RED, padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>{detailUsuario.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                                    </div>
                                </div>
                                <button onClick={() => { setDetailUsuario(null); openEdit(detailUsuario); }} style={{ padding: '8px 16px', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: TEXT1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <Edit2 size={14} /> Editar
                                </button>
                            </div>
                        </div>

                        {/* Contenido scrolleable */}
                        <div style={{ padding: '0 32px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Estadísticas */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT3, fontWeight: 600, fontSize: 13 }}><ShoppingCart size={16} /> Total Ventas Administradas</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: TEXT1 }}>{getUserStats(detailUsuario.id, detailUsuario.nombre).count}</div>
                                </div>
                                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT3, fontWeight: 600, fontSize: 13 }}><PieChart size={16} /> Dinero Ingresado (Caja)</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: GREEN }}>{fmt(getUserStats(detailUsuario.id, detailUsuario.nombre).total)}</div>
                                </div>
                            </div>

                            {/* Logs / Actividad Frecuente */}
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT1, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={18} /> Historial de Actividad</h3>
                                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
                                    {getUserStats(detailUsuario.id, detailUsuario.nombre).logs.length === 0 ? (
                                        <div style={{ padding: 32, textAlign: 'center', color: TEXT3, fontSize: 14 }}>No hay actividad reciente registrada para este perfil.</div>
                                    ) : (
                                        getUserStats(detailUsuario.id, detailUsuario.nombre).logs.map((log, i) => (
                                            <div key={i} style={{ padding: '16px 20px', borderBottom: i < 9 ? `1px solid ${BORDER}` : 'none', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLUE, marginTop: 6 }} />
                                                <div>
                                                    <div style={{ fontSize: 14, color: TEXT1, fontWeight: 500 }}>{log.detalle}</div>
                                                    <div style={{ fontSize: 12, color: TEXT3, marginTop: 4 }}>{log.fecha} a las {log.hora}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL CONFIRMAR ELIMINAR ── */}
            {confirmDeleteId && (
                <div onClick={e => { if (e.target === e.currentTarget) setConfirmDeleteId(null); }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: WHITE, borderRadius: 16, width: 360, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', padding: '32px 28px', textAlign: 'center', animation: 'fadeIn 0.2s' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Trash2 size={28} style={{ color: RED }} />
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT1, marginBottom: 8 }}>¿Eliminar empleado?</div>
                        <p style={{ fontSize: 14, color: TEXT3, margin: '0 0 24px', lineHeight: 1.5 }}>Esta acción removerá el acceso al sistema inmediatamente y no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button onClick={() => handleDelete(confirmDeleteId)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: RED, color: WHITE, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(239,68,68,0.2)' }}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}
