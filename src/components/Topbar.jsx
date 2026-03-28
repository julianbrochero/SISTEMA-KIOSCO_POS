import { useEffect, useState } from 'react';
import { useStore } from '../store';
import {
    ShoppingCart, Package, Clock, Tag, Wallet,
    BarChart2, Users, FileText, Settings,
    User, ShieldCheck, LogOut, DollarSign, ChevronDown,
    Store,
} from 'lucide-react';

const NAV_ITEMS = [
    { id: 'pos',       label: 'POS',        icon: ShoppingCart, roles: ['admin', 'cajero'] },
    { id: 'stock',     label: 'Stock',      icon: Package,      roles: ['admin', 'cajero'] },
    { id: 'historial', label: 'Historial',  icon: Clock,        roles: ['admin', 'cajero'] },
    { id: 'productos', label: 'Productos',  icon: Tag,          roles: ['admin', 'cajero'] },
    { id: 'caja',      label: 'Caja',       icon: Wallet,       roles: ['admin', 'cajero'] },
    { id: 'reportes',  label: 'Reportes',   icon: BarChart2,    roles: ['admin'] },
    { id: 'usuarios',  label: 'Empleados',  icon: Users,        roles: ['admin'] },
    { id: 'logs',      label: 'Logs',       icon: FileText,     roles: ['admin'] },
    { id: 'config',    label: 'Config',     icon: Settings,     roles: ['admin'] },
];

export default function Topbar() {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const activePage    = useStore((s) => s.activePage);
    const setActivePage = useStore((s) => s.setActivePage);
    const cajaTotal     = useStore((s) => s.cajaTotal);
    const cajaAbierta   = useStore((s) => s.cajaAbierta);
    const currentUser   = useStore((s) => s.currentUser);
    const logout        = useStore((s) => s.logout);

    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest('.user-menu-wrap')) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Ctrl + ← / → para cambiar de módulo (funciona desde cualquier lugar)
    useEffect(() => {
        const btns = NAV_ITEMS.filter(b => b.roles.includes(currentUser?.rol));
        const handler = (e) => {
            if (!e.ctrlKey) return;
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            const idx = btns.findIndex(b => b.id === activePage);
            if (idx === -1) return;
            e.preventDefault();
            const next = e.key === 'ArrowRight'
                ? btns[(idx + 1) % btns.length]
                : btns[(idx - 1 + btns.length) % btns.length];
            setActivePage(next.id);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activePage, currentUser]);

    const btns = NAV_ITEMS.filter(b => b.roles.includes(currentUser?.rol));

    return (
        <div style={{
            padding: '0 24px',
            background: '#0f1117',
            flexShrink: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            height: 56,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>

            {/* ── Logo ── */}
            <button
                onClick={() => setActivePage('pos')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '0 24px 0 0', marginRight: 8, flexShrink: 0,
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    height: '100%',
                }}
            >
                <img
                    src="/favicon.png"
                    alt="Logo"
                    style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, objectFit: 'contain' }}
                />
                <span style={{
                    fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px',
                    color: '#ffffff',
                }}>
                    Gestify
                </span>
            </button>

            {/* ── Nav ── */}
            <nav style={{
                display: 'flex', alignItems: 'stretch', gap: 0,
                flex: 1, overflowX: 'auto', scrollbarWidth: 'none',
                height: '100%',
            }}>
                {btns.map(({ id, label, icon: Icon }) => {
                    const active = activePage === id;
                    return (
                        <button
                            key={id}
                            onClick={() => setActivePage(id)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '0 16px',
                                border: 'none',
                                borderBottom: active ? '2px solid #818cf8' : '2px solid transparent',
                                borderTop: '2px solid transparent',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: 13,
                                fontWeight: active ? 700 : 500,
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                                background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                                color: active ? '#ffffff' : '#d1d5db',
                                flexShrink: 0,
                                borderRadius: 0,
                            }}
                            onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#f3f4f6'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                            onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'transparent'; } }}
                        >
                            <Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
                            {label}
                        </button>
                    );
                })}
            </nav>

            {/* ── Derecha ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

                {/* Caja badge */}
                <button
                    onClick={() => setActivePage('caja')}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: `1px solid ${cajaAbierta ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                        background: cajaAbierta ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                        color: cajaAbierta ? '#34d399' : '#f87171',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                    <span style={{
                        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                        background: cajaAbierta ? '#34d399' : '#f87171',
                        boxShadow: cajaAbierta ? '0 0 4px #34d399' : '0 0 4px #f87171',
                    }} />
                    <DollarSign size={11} strokeWidth={2.5} />
                    {cajaAbierta ? `$${cajaTotal.toLocaleString('es-AR')}` : 'CERRADA'}
                </button>

                {/* Divider */}
                <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

                {/* User menu */}
                <div className="user-menu-wrap" style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                        onClick={() => setUserMenuOpen(o => !o)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '4px 8px 4px 4px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: userMenuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                        onMouseLeave={e => { if (!userMenuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                    >
                        <div style={{
                            width: 26, height: 26, borderRadius: 6,
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {currentUser?.rol === 'admin'
                                ? <ShieldCheck size={12} color="#fff" strokeWidth={2.5} />
                                : <User size={12} color="#fff" strokeWidth={2.5} />
                            }
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#e5e7eb', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {currentUser?.nombre?.split(' ')[0]}
                        </span>
                        <ChevronDown size={12} color="#6b7280" style={{ flexShrink: 0, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {userMenuOpen && (
                        <div style={{
                            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                            width: 210,
                            background: '#1a1d27',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                            overflow: 'hidden',
                            zIndex: 1000,
                        }}>
                            {/* Info usuario */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '12px 12px 10px',
                                borderBottom: '1px solid rgba(255,255,255,0.07)',
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {currentUser?.rol === 'admin'
                                        ? <ShieldCheck size={16} color="#fff" />
                                        : <User size={16} color="#fff" />
                                    }
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {currentUser?.nombre}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginTop: 2 }}>
                                        {currentUser?.rol}
                                    </div>
                                </div>
                            </div>

                            {/* Opciones */}
                            <div style={{ padding: '6px' }}>
                                {currentUser?.rol === 'admin' && (
                                    <button
                                        onClick={() => { setActivePage('config'); setUserMenuOpen(false); }}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '8px 10px', borderRadius: 8, border: 'none',
                                            background: 'transparent', cursor: 'pointer', color: '#d1d5db',
                                            fontSize: 13, fontFamily: 'inherit', transition: 'background 0.12s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Settings size={13} color="#6b7280" /> Configuración
                                    </button>
                                )}
                                <button
                                    onClick={() => { setUserMenuOpen(false); logout(); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 10px', borderRadius: 8, border: 'none',
                                        background: 'transparent', cursor: 'pointer', color: '#f87171',
                                        fontSize: 13, fontFamily: 'inherit', transition: 'background 0.12s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <LogOut size={13} color="#f87171" /> Cerrar sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
