import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ClipboardList, Search, Filter, ShieldCheck, User, LogIn, LogOut, ShoppingCart, XCircle, Package, Wallet, TrendingUp, Settings, Trash2 } from 'lucide-react';

const ACTION_META = {
    LOGIN: { icon: <LogIn size={14} />, color: '#10b981', bg: '#d1fae5', label: 'Inicio de sesión' },
    LOGOUT: { icon: <LogOut size={14} />, color: '#64748b', bg: '#f1f5f9', label: 'Cierre de sesión' },
    VENTA_REGISTRADA: { icon: <ShoppingCart size={14} />, color: '#0ea5e9', bg: '#e0f2fe', label: 'Venta registrada' },
    VENTA_ANULADA: { icon: <XCircle size={14} />, color: '#ef4444', bg: '#fee2e2', label: 'Venta anulada' },
    PRODUCTO_CREADO: { icon: <Package size={14} />, color: '#10b981', bg: '#d1fae5', label: 'Producto creado' },
    PRODUCTO_EDITADO: { icon: <Package size={14} />, color: '#f59e0b', bg: '#fef3c7', label: 'Producto editado' },
    PRODUCTO_ELIMINADO: { icon: <Trash2 size={14} />, color: '#ef4444', bg: '#fee2e2', label: 'Producto eliminado' },
    ITEM_ELIMINADO: { icon: <Trash2 size={14} />, color: '#f59e0b', bg: '#fef3c7', label: 'Ítem eliminado' },
    APERTURA_CAJA: { icon: <Wallet size={14} />, color: '#10b981', bg: '#d1fae5', label: 'Apertura de caja' },
    CIERRE_CAJA: { icon: <Wallet size={14} />, color: '#475569', bg: '#f1f5f9', label: 'Cierre de caja' },
    EGRESO_CAJA: { icon: <TrendingUp size={14} />, color: '#ef4444', bg: '#fee2e2', label: 'Egreso de caja' },
    INGRESO_CAJA: { icon: <TrendingUp size={14} />, color: '#10b981', bg: '#d1fae5', label: 'Ingreso manual' },
    INGRESO_STOCK: { icon: <Package size={14} />, color: '#8b5cf6', bg: '#ede9fe', label: 'Ingreso de stock' },
    USUARIO_CREADO: { icon: <User size={14} />, color: '#10b981', bg: '#d1fae5', label: 'Usuario creado' },
    USUARIO_EDITADO: { icon: <User size={14} />, color: '#f59e0b', bg: '#fef3c7', label: 'Usuario editado' },
    USUARIO_ELIMINADO: { icon: <User size={14} />, color: '#ef4444', bg: '#fee2e2', label: 'Usuario eliminado' },
    USUARIO_ESTADO: { icon: <User size={14} />, color: '#0ea5e9', bg: '#e0f2fe', label: 'Estado usuario' },
    PRECIO_MASIVO: { icon: <TrendingUp size={14} />, color: '#f59e0b', bg: '#fef3c7', label: 'Ajuste de precios' },
    CONFIG_ACTUALIZADA: { icon: <Settings size={14} />, color: '#8b5cf6', bg: '#ede9fe', label: 'Configuración' },
};

const DEFAULT_META = { icon: <ClipboardList size={14} />, color: '#64748b', bg: '#f1f5f9', label: 'Acción' };

export default function LogsPage() {
    const activePage = useStore(s => s.activePage);
    const logs = useStore(s => s.logs);

    const [search, setSearch] = useState('');
    const [filterAccion, setFilterAccion] = useState('Todas');
    const [filterUsuario, setFilterUsuario] = useState('Todos');

    const FILTROS_MAP = {
        sesion: ['LOGIN', 'LOGOUT'],
        venta: ['VENTA_REGISTRADA', 'VENTA_ANULADA', 'ITEM_ELIMINADO'],
        caja: ['APERTURA_CAJA', 'CIERRE_CAJA', 'EGRESO_CAJA', 'INGRESO_CAJA'],
        producto: ['PRODUCTO_CREADO', 'PRODUCTO_EDITADO', 'PRODUCTO_ELIMINADO', 'INGRESO_STOCK', 'PRECIO_MASIVO'],
        usuario: ['USUARIO_CREADO', 'USUARIO_EDITADO', 'USUARIO_ELIMINADO', 'USUARIO_ESTADO'],
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return logs.filter(l => {
            const matchSearch = !q || (l.detalle || '').toLowerCase().includes(q) || (l.usuario || '').toLowerCase().includes(q) || (l.accion || '').toLowerCase().includes(q);
            const matchAccion = filterAccion === 'Todas' || (FILTROS_MAP[filterAccion] || []).includes(l.accion);
            const matchUser = filterUsuario === 'Todos' || l.usuario === filterUsuario;
            return matchSearch && matchAccion && matchUser;
        });
    }, [logs, search, filterAccion, filterUsuario]);

    if (activePage !== 'logs') return null;

    const usuarios = [...new Set(logs.map(l => l.usuario))];

    const CATEGORIAS = [
        { label: 'Todas', value: 'Todas' },
        { label: 'Sesiones', value: 'sesion' },
        { label: 'Ventas', value: 'venta' },
        { label: 'Caja', value: 'caja' },
        { label: 'Productos', value: 'producto' },
        { label: 'Usuarios', value: 'usuario' },
    ];

    // Stats
    const hoy = new Date().toLocaleDateString('es-AR');
    const hoyLogs = logs.filter(l => l.fecha === hoy);
    const hoyVentas = hoyLogs.filter(l => l.accion === 'VENTA_REGISTRADA').length;
    const hoyAnuladas = hoyLogs.filter(l => l.accion === 'VENTA_ANULADA').length;
    const hoySesiones = hoyLogs.filter(l => l.accion === 'LOGIN').length;

    return (
        <div className="page active" id="page-logs" style={{ flexDirection: 'column' }}>
            <div className="page-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <ClipboardList size={18} style={{ color: 'var(--accent)' }} />
                <span className="page-title">Registro de Acciones</span>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text3)' }} />
                    <input
                        type="text"
                        className="toolbar-input"
                        placeholder="Buscar en logs..."
                        style={{ paddingLeft: '30px' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Filter size={14} style={{ color: 'var(--text3)' }} />
                    {CATEGORIAS.map(c => (
                        <button
                            key={c.value}
                            className={`cat-chip ${filterAccion === c.value ? 'active' : ''}`}
                            onClick={() => setFilterAccion(c.value)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                <select
                    className="toolbar-input"
                    value={filterUsuario}
                    onChange={e => setFilterUsuario(e.target.value)}
                    style={{ width: '150px' }}
                >
                    <option>Todos</option>
                    {usuarios.map(u => <option key={u}>{u}</option>)}
                </select>

                <span style={{ fontSize: '12px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {filtered.length} registros
                </span>
            </div>

            {/* Stats row */}
            <div className="logs-stats-row">
                <div className="logs-stat">
                    <div className="logs-stat-val" style={{ color: '#0ea5e9' }}>{hoyVentas}</div>
                    <div className="logs-stat-label">Ventas hoy</div>
                </div>
                <div className="logs-stat">
                    <div className="logs-stat-val" style={{ color: '#ef4444' }}>{hoyAnuladas}</div>
                    <div className="logs-stat-label">Anulaciones hoy</div>
                </div>
                <div className="logs-stat">
                    <div className="logs-stat-val" style={{ color: '#10b981' }}>{hoySesiones}</div>
                    <div className="logs-stat-label">Ingresos hoy</div>
                </div>
                <div className="logs-stat">
                    <div className="logs-stat-val" style={{ color: '#8b5cf6' }}>{logs.length}</div>
                    <div className="logs-stat-label">Total logs</div>
                </div>
            </div>

            {/* Timeline */}
            <div className="logs-timeline">
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <ClipboardList size={32} style={{ opacity: 0.2 }} />
                        <p style={{ fontSize: '14px' }}>Sin registros</p>
                    </div>
                ) : (
                    filtered.map((log, idx) => {
                        const meta = ACTION_META[log.accion] || DEFAULT_META;
                        return (
                            <div key={log.id} className="log-entry">
                                <div className="log-icon-wrap" style={{ background: meta.bg, color: meta.color }}>
                                    {meta.icon}
                                </div>
                                <div className="log-connector" style={{ display: idx === filtered.length - 1 ? 'none' : 'block' }} />
                                <div className="log-body">
                                    <div className="log-header-row">
                                        <span className="log-accion-badge" style={{ background: meta.bg, color: meta.color }}>
                                            {meta.label}
                                        </span>
                                        <span className="log-usuario">
                                            {log.rol === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                                            {log.usuario}
                                        </span>
                                        <span className="log-time">{log.hora} · {log.fecha}</span>
                                    </div>
                                    <div className="log-detalle">{log.detalle}</div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
