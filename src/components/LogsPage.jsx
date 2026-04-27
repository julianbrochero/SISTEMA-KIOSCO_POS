import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { ClipboardList, Search, Filter, ShieldCheck, User, LogIn, LogOut, ShoppingCart, XCircle, Package, Wallet, TrendingUp, Settings, Trash2, Calendar, ChevronDown } from 'lucide-react';

const BG = '#FAFAFA';
const WHITE = '#FFFFFF';
const BORDER = '#E5E7EB';
const TEXT1 = '#111827';
const TEXT2 = '#4B5563';
const TEXT3 = '#6B7280';
const GREEN = '#059669';
const RED = '#DC2626';
const BLUE = '#2563EB';

function TrendingDown(props) {
    return <TrendingUp {...props} style={{ ...props.style, transform: 'scaleY(-1)' }} />;
}

const ACTION_META = {
    LOGIN: { icon: <LogIn size={14} />, color: GREEN, bg: '#ECFDF5', label: 'Inicio de sesión' },
    VENTA_REGISTRADA: { icon: <ShoppingCart size={14} />, color: GREEN, bg: '#ECFDF5', label: 'Venta registrada' },
    PRODUCTO_CREADO: { icon: <Package size={14} />, color: GREEN, bg: '#ECFDF5', label: 'Producto creado' },
    APERTURA_CAJA: { icon: <Wallet size={14} />, color: GREEN, bg: '#ECFDF5', label: 'Apertura de caja' },
    INGRESO_CAJA: { icon: <TrendingUp size={14} />, color: GREEN, bg: '#ECFDF5', label: 'Ingreso manual' },
    USUARIO_CREADO: { icon: <User size={14} />, color: GREEN, bg: '#ECFDF5', label: 'Usuario creado' },
    VENTA_ANULADA: { icon: <XCircle size={14} />, color: RED, bg: '#FEF2F2', label: 'Venta anulada' },
    PRODUCTO_ELIMINADO: { icon: <Trash2 size={14} />, color: RED, bg: '#FEF2F2', label: 'Producto eliminado' },
    EGRESO_CAJA: { icon: <TrendingDown size={14} />, color: RED, bg: '#FEF2F2', label: 'Egreso de caja' },
    USUARIO_ELIMINADO: { icon: <User size={14} />, color: RED, bg: '#FEF2F2', label: 'Usuario eliminado' },
    PRODUCTO_EDITADO: { icon: <Package size={14} />, color: '#D97706', bg: '#FFFBEB', label: 'Producto editado' },
    ITEM_ELIMINADO: { icon: <Trash2 size={14} />, color: '#D97706', bg: '#FFFBEB', label: 'Ítem eliminado' },
    USUARIO_EDITADO: { icon: <User size={14} />, color: '#D97706', bg: '#FFFBEB', label: 'Usuario editado' },
    PRECIO_MASIVO: { icon: <TrendingUp size={14} />, color: '#D97706', bg: '#FFFBEB', label: 'Ajuste de precios' },
    LOGOUT: { icon: <LogOut size={14} />, color: TEXT3, bg: '#F3F4F6', label: 'Cierre de sesión' },
    CIERRE_CAJA: { icon: <Wallet size={14} />, color: TEXT3, bg: '#F3F4F6', label: 'Cierre de caja' },
    INGRESO_STOCK: { icon: <Package size={14} />, color: BLUE, bg: '#EFF6FF', label: 'Ingreso de stock' },
    USUARIO_ESTADO: { icon: <User size={14} />, color: BLUE, bg: '#EFF6FF', label: 'Estado usuario' },
    CONFIG_ACTUALIZADA: { icon: <Settings size={14} />, color: '#7C3AED', bg: '#F5F3FF', label: 'Configuración' },
};

const DEFAULT_META = { icon: <ClipboardList size={14} />, color: TEXT3, bg: '#F3F4F6', label: 'Acción' };

const FILTROS_MAP = {
    sesion: ['LOGIN', 'LOGOUT'],
    venta: ['VENTA_REGISTRADA', 'VENTA_ANULADA', 'ITEM_ELIMINADO'],
    caja: ['APERTURA_CAJA', 'CIERRE_CAJA', 'EGRESO_CAJA', 'INGRESO_CAJA'],
    producto: ['PRODUCTO_CREADO', 'PRODUCTO_EDITADO', 'PRODUCTO_ELIMINADO', 'INGRESO_STOCK', 'PRECIO_MASIVO'],
    usuario: ['USUARIO_CREADO', 'USUARIO_EDITADO', 'USUARIO_ELIMINADO', 'USUARIO_ESTADO'],
};

const CATEGORIAS = [
    { label: 'Todas las acciones', value: 'Todas' },
    { label: 'Sesiones', value: 'sesion' },
    { label: 'Ventas', value: 'venta' },
    { label: 'Caja', value: 'caja' },
    { label: 'Productos', value: 'producto' },
    { label: 'Usuarios', value: 'usuario' },
];

function parseLogDate(fecha) {
    if (!fecha || typeof fecha !== 'string') return null;
    const [day, month, year] = fecha.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isWithinRange(logDate, from, to) {
    if (!logDate) return false;
    if (from && logDate < from) return false;
    if (to && logDate > to) return false;
    return true;
}

export default function LogsPage() {
    const activePage = useStore(s => s.activePage);
    const logs = useStore(s => s.logs);

    const today = useMemo(() => new Date(), []);
    const [search, setSearch] = useState('');
    const [filterAccion, setFilterAccion] = useState('Todas');
    const [filterUsuario, setFilterUsuario] = useState('Todos');
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState(formatDateForInput(today));

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const fromDate = filterDesde ? new Date(`${filterDesde}T00:00:00`) : null;
        const toDate = filterHasta ? new Date(`${filterHasta}T00:00:00`) : null;

        return logs.filter(l => {
            const logDate = parseLogDate(l.fecha);
            const matchSearch = !q || (l.detalle || '').toLowerCase().includes(q) || (l.usuario || '').toLowerCase().includes(q) || (l.accion || '').toLowerCase().includes(q);
            const matchAccion = filterAccion === 'Todas' || (FILTROS_MAP[filterAccion] || []).includes(l.accion);
            const matchUser = filterUsuario === 'Todos' || l.usuario === filterUsuario;
            const matchDate = isWithinRange(logDate, fromDate, toDate);
            return matchSearch && matchAccion && matchUser && matchDate;
        });
    }, [logs, search, filterAccion, filterUsuario, filterDesde, filterHasta]);

    const groupedLogs = useMemo(() => {
        const groups = {};
        const hoyStr = new Date().toLocaleDateString('es-AR');
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        const ayerStr = ayer.toLocaleDateString('es-AR');

        filtered.forEach(log => {
            let label = log.fecha;
            if (log.fecha === hoyStr) label = 'Hoy';
            else if (log.fecha === ayerStr) label = 'Ayer';

            if (!groups[label]) groups[label] = [];
            groups[label].push(log);
        });

        return groups;
    }, [filtered]);

    if (activePage !== 'logs') return null;

    const usuarios = [...new Set(logs.map(l => l.usuario).filter(Boolean))];
    const hoyStr = new Date().toLocaleDateString('es-AR');
    const hoyLogs = logs.filter(l => l.fecha === hoyStr);
    const hoyVentas = hoyLogs.filter(l => l.accion === 'VENTA_REGISTRADA').length;
    const hoyAnuladas = hoyLogs.filter(l => l.accion === 'VENTA_ANULADA').length;
    const hoySesiones = hoyLogs.filter(l => l.accion === 'LOGIN').length;

    return (
        <div className="page active" id="page-logs" style={{ background: BG, padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 30, padding: '0 32px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, height: 68 }}>
                <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 24, borderRight: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: TEXT1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Auditoría</span>
                    <span style={{ fontSize: 13, color: TEXT3, fontWeight: 500 }}>Registro de actividad</span>
                </div>

                <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: TEXT3 }} />
                    <input
                        type="text"
                        placeholder="Buscar transacción, evento, descripción..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', height: 40, padding: '0 16px 0 42px', background: BG, border: 'none', borderRadius: 8, fontSize: 13, color: TEXT1, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                        onFocus={e => e.target.style.boxShadow = '0 0 0 2px #E0E7FF, inset 0 1px 2px rgba(0,0,0,0.02)'}
                        onBlur={e => e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'}
                    />
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {[
                        { l: 'Ventas hoy', v: hoyVentas, c: BLUE, icon: <ShoppingCart size={16} color={BLUE} />, bg: '#EFF6FF' },
                        { l: 'Anulaciones', v: hoyAnuladas, c: RED, icon: <XCircle size={16} color={RED} />, bg: '#FEF2F2' },
                        { l: 'Ingresos hoy', v: hoySesiones, c: GREEN, icon: <LogIn size={16} color={GREEN} />, bg: '#ECFDF5' },
                        { l: 'Total histórico', v: logs.length, c: TEXT1, icon: <ClipboardList size={16} color={TEXT2} />, bg: '#F3F4F6' },
                    ].map((st, i) => (
                        <div key={i} style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {st.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: TEXT1, lineHeight: 1 }}>{st.v}</div>
                                <div style={{ fontSize: 13, color: TEXT3, fontWeight: 500, marginTop: 4 }}>{st.l}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 24px', borderBottom: `1px solid #F3F4F6`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: '#FAFAFA' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Filter size={14} color={TEXT3} style={{ marginRight: 4 }} />
                            {CATEGORIAS.map(c => {
                                const active = filterAccion === c.value;
                                return (
                                    <button
                                        key={c.value}
                                        onClick={() => setFilterAccion(c.value)}
                                        style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${active ? '#E5E7EB' : 'transparent'}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s', background: active ? WHITE : 'transparent', color: active ? TEXT1 : TEXT3, boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                                        onMouseEnter={e => { if (!active) e.target.style.background = '#E5E7EB'; }}
                                        onMouseLeave={e => { if (!active) e.target.style.background = 'transparent'; }}
                                    >
                                        {c.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ width: 1, height: 20, background: BORDER }} />

                        <div style={{ position: 'relative' }}>
                            <select
                                value={filterUsuario}
                                onChange={e => setFilterUsuario(e.target.value)}
                                style={{ appearance: 'none', padding: '6px 28px 6px 12px', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: TEXT2, cursor: 'pointer', outline: 'none' }}
                            >
                                <option value="Todos">Todos los usuarios</option>
                                {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <ChevronDown size={14} color={TEXT3} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT3 }}>Desde</span>
                            <input
                                type="date"
                                value={filterDesde}
                                max={filterHasta || undefined}
                                onChange={e => setFilterDesde(e.target.value)}
                                style={{ padding: '6px 10px', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: TEXT2, outline: 'none' }}
                            />
                            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT3 }}>Hasta</span>
                            <input
                                type="date"
                                value={filterHasta}
                                min={filterDesde || undefined}
                                onChange={e => setFilterHasta(e.target.value)}
                                style={{ padding: '6px 10px', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: TEXT2, outline: 'none' }}
                            />
                            <button
                                onClick={() => {
                                    setFilterDesde('');
                                    setFilterHasta(formatDateForInput(new Date()));
                                }}
                                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                                Limpiar fecha
                            </button>
                        </div>

                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: TEXT3 }}>{filtered.length} eventos</span>
                    </div>

                    <div style={{ padding: '0 24px' }}>
                        {Object.keys(groupedLogs).length === 0 ? (
                            <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BORDER}` }}>
                                    <ClipboardList size={20} color="#D1D5DB" />
                                </div>
                                <span style={{ fontSize: 14, color: TEXT2, fontWeight: 500 }}>No hay actividad para los filtros seleccionados</span>
                            </div>
                        ) : (
                            Object.entries(groupedLogs).map(([grupoFecha, logsGrupo]) => (
                                <div key={grupoFecha} style={{ padding: '24px 0', borderBottom: `1px solid #F3F4F6` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <Calendar size={14} color={TEXT3} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{grupoFecha}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {logsGrupo.map(log => {
                                            const meta = ACTION_META[log.accion] || DEFAULT_META;
                                            return (
                                                <div
                                                    key={log.id}
                                                    style={{ display: 'grid', gridTemplateColumns: '120px 32px 1fr 140px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, transition: 'background 0.15s', cursor: 'default' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ fontSize: 12, color: TEXT3, paddingTop: 4, fontFamily: 'monospace' }}>{log.hora}</div>

                                                    <div style={{ width: 24, height: 24, borderRadius: 6, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                                        {meta.icon}
                                                    </div>

                                                    <div style={{ paddingRight: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT1 }}>{meta.label}</span>
                                                            {log.accion === 'CONFIG_ACTUALIZADA' && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D1D5DB' }} />}
                                                        </div>
                                                        <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.4 }}>{log.detalle}</div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingTop: 4 }}>
                                                        <span style={{ fontSize: 12, fontWeight: 500, color: TEXT3 }}>{log.usuario}</span>
                                                        {log.rol === 'admin' ? <ShieldCheck size={12} color="#10B981" /> : <User size={12} color="#9CA3AF" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
