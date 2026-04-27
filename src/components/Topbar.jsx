import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
const logoUrl = '/_preview.png';
import {
    ShoppingCart, Package, Clock, Tag, Wallet,
    BarChart2, Users, FileText, Settings,
    User, ShieldCheck, LogOut, DollarSign, ChevronDown,
    Menu, X, Bell, Zap, BellRing, Sparkles
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

export default function Topbar({ licenseInfo }) {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const activePage    = useStore((s) => s.activePage);
    const setActivePage = useStore((s) => s.setActivePage);
    const cajaTotal     = useStore((s) => s.cajaTotal);
    const cajaAbierta   = useStore((s) => s.cajaAbierta);
    const currentUser   = useStore((s) => s.currentUser);
    const logout        = useStore((s) => s.logout);
    const setShowActivation = useStore(s => s.setShowActivation);

    const userMenuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Ctrl + ← / → para cambiar de módulo
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
    const activeItem = NAV_ITEMS.find(i => i.id === activePage);

    return (
        <header className="tb-header">
            {/* ── Logo ── */}
            <div className="tb-brand" onClick={() => setActivePage('pos')}>
                <div className="tb-logo-cube">
                    <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <span className="tb-logo-text">Gestify</span>
            </div>

            {/* ── Nav (Desktop) ── */}
            <nav className="tb-nav">
                {btns.map(({ id, label, icon: Icon }) => {
                    const active = activePage === id;
                    return (
                        <button
                            key={id}
                            className={`tb-nav-item ${active ? 'active' : ''}`}
                            onClick={() => setActivePage(id)}
                            title={label}
                        >
                            <Icon size={16} strokeWidth={active ? 2.5 : 2} className="tb-nav-icon" />
                            <span className="tb-nav-label">{label}</span>
                            {active && <span className="tb-nav-indicator" />}
                        </button>
                    );
                })}
            </nav>

            {/* ── Derecha ── */}
            <div className="tb-right">
                
                {/* Opcional: Notificaciones extraíble */}
                <button className="tb-icon-btn d-none-mobile" title="Notificaciones">
                    <Bell size={18} strokeWidth={2} />
                    <span className="tb-badge-dot"></span>
                </button>

                {/* Botón Suscripción */}
                {licenseInfo?.diasRestantes !== undefined && !licenseInfo.pagado && licenseInfo.diasRestantes > 0 && currentUser?.rol === 'admin' && (
                    <button
                        className="tb-trial-btn"
                        onClick={() => setShowActivation(true)}
                    >
                        <Sparkles size={14} className="tb-trial-icon" />
                        <span className="tb-trial-text">Prueba: {licenseInfo.diasRestantes} días</span>
                    </button>
                )}

                {/* Caja Indicator */}
                <button className={`tb-caja-pill ${cajaAbierta ? 'open' : 'closed'}`} onClick={() => setActivePage('caja')}>
                    <span className="tb-caja-dot" />
                    <DollarSign size={14} strokeWidth={2.5} />
                    <span className="tb-caja-val">
                        {cajaAbierta ? `${cajaTotal.toLocaleString('es-AR')}` : 'CERRADA'}
                    </span>
                </button>

                <div className="tb-divider d-none-mobile" />

                {/* Dropdown Usuario */}
                <div className="tb-user-wrap" ref={userMenuRef}>
                    <button className="tb-user-toggle" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                        <div className="tb-avatar">
                            {currentUser?.rol === 'admin' ? <ShieldCheck size={14} /> : <User size={14} />}
                        </div>
                        <span className="tb-user-name d-none-mobile">
                            {currentUser?.nombre?.split(' ')[0]}
                        </span>
                        <ChevronDown size={14} className={`tb-user-chevron ${userMenuOpen ? 'open' : ''}`} />
                    </button>

                    {userMenuOpen && (
                        <div className="tb-dropdown">
                            <div className="tb-dropdown-header">
                                <div className="tb-avatar large">
                                    {currentUser?.rol === 'admin' ? <ShieldCheck size={18} /> : <User size={18} />}
                                </div>
                                <div className="tb-dropdown-info">
                                    <div className="tb-dropdown-name">{currentUser?.nombre}</div>
                                    <div className="tb-dropdown-role">{currentUser?.rol}</div>
                                </div>
                            </div>
                            <div className="tb-dropdown-body">
                                {currentUser?.rol === 'admin' && (
                                    <button className="tb-dropdown-item" onClick={() => { setActivePage('config'); setUserMenuOpen(false); }}>
                                        <Settings size={15} /> Configuración de negocio
                                    </button>
                                )}
                                <div className="tb-dropdown-separator" />
                                <button className="tb-dropdown-item danger" onClick={() => { setUserMenuOpen(false); logout(); }}>
                                    <LogOut size={15} /> Cerrar sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Menú Hamburguesa */}
                <button className="tb-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="tb-mobile-drawer">
                    <div className="tb-mobile-nav">
                        {btns.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                className={`tb-mobile-item ${activePage === id ? 'active' : ''}`}
                                onClick={() => { setActivePage(id); setMobileMenuOpen(false); }}
                            >
                                <Icon size={18} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                /* TOPBAR SAAS STYLES */
                .tb-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 60px;
                    padding: 0 24px;
                    background: #09090b; /* Muy oscuro premium */
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    position: relative;
                    z-index: 100;
                    flex-shrink: 0;
                    color: #fff;
                    font-family: 'Inter', sans-serif;
                }

                .tb-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    margin-right: 32px;
                }

                .tb-logo-cube {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: #18181b;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .tb-logo-text {
                    font-size: 16px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    color: #fafafa;
                }

                /* Navegación Desktop */
                .tb-nav {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex: 1;
                    height: 100%;
                }

                .tb-nav-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 14px;
                    border: none;
                    background: transparent;
                    color: #a1a1aa; /* Zinc 400 */
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .tb-nav-item:hover {
                    color: #fafafa;
                    background: rgba(255, 255, 255, 0.05);
                }

                .tb-nav-item.active {
                    color: #fafafa;
                    font-weight: 600;
                    background: transparent;
                }

                .tb-nav-icon {
                    transition: all 0.2s;
                }

                .tb-nav-indicator {
                    position: absolute;
                    bottom: -15px; /* Adjust based on parent height padding */
                    left: 20%;
                    right: 20%;
                    height: 2px;
                    background: #FAFAFA;
                    border-radius: 2px 2px 0 0;
                    box-shadow: 0 -2px 10px rgba(255,255,255,0.4);
                }

                .tb-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                /* Icon Buttons */
                .tb-icon-btn {
                    background: transparent;
                    border: none;
                    color: #a1a1aa;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s;
                }
                .tb-icon-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fafafa;
                }
                .tb-badge-dot {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #ef4444;
                    border: 2px solid #09090b;
                }

                /* Suscripción Button */
                .tb-trial-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 6px 12px;
                    border-radius: 20px;
                    color: #fff;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
                    transition: transform 0.2s;
                }
                .tb-trial-btn:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }

                /* Caja Pills */
                .tb-caja-pill {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                    font-family: 'Inter', monospace;
                }
                .tb-caja-pill.open {
                    background: rgba(16, 185, 129, 0.1);
                    border-color: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                }
                .tb-caja-pill.closed {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }
                .tb-caja-pill:hover {
                    filter: brightness(1.2);
                }
                .tb-caja-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .open .tb-caja-dot { background: #10b981; box-shadow: 0 0 6px #10b981; }
                .closed .tb-caja-dot { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
                .tb-caja-val { margin-left: 2px; }

                .tb-divider {
                    width: 1px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.1);
                }

                /* User Menu */
                .tb-user-wrap {
                    position: relative;
                }
                .tb-user-toggle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .tb-user-toggle:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                .tb-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                }
                .tb-avatar.large {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                }
                .tb-user-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: #e4e4e7;
                }
                .tb-user-chevron {
                    color: #a1a1aa;
                    transition: transform 0.2s;
                }
                .tb-user-chevron.open {
                    transform: rotate(180deg);
                }

                /* Dropdown Superior */
                .tb-dropdown {
                    position: absolute;
                    top: calc(100% + 12px);
                    right: 0;
                    width: 240px;
                    background: #18181b; /* Zinc 900 */
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    overflow: hidden;
                    animation: dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes dropdownFadeIn {
                    from { opacity: 0; transform: translateY(-8px) scale(0.95); }
                    to { opacity: 1; transform: none; }
                }

                .tb-dropdown-header {
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .tb-dropdown-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #fafafa;
                }
                .tb-dropdown-role {
                    font-size: 12px;
                    font-weight: 600;
                    color: #60a5fa;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-top: 2px;
                }

                .tb-dropdown-body {
                    padding: 8px;
                }
                .tb-dropdown-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    color: #a1a1aa;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tb-dropdown-item:hover {
                    background: rgba(255,255,255,0.05);
                    color: #fafafa;
                }
                .tb-dropdown-item.danger:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }
                .tb-dropdown-separator {
                    height: 1px;
                    background: rgba(255,255,255,0.05);
                    margin: 4px 0;
                }

                /* Hamburguesa */
                .tb-hamburger {
                    display: none;
                    background: transparent;
                    border: none;
                    color: #fafafa;
                    cursor: pointer;
                    padding: 4px;
                }

                /* Mobile Drawer */
                .tb-mobile-drawer {
                    display: none;
                }

                @media (max-width: 900px) {
                    .tb-nav { display: none; }
                    .d-none-mobile { display: none !important; }
                    .tb-hamburger { display: block; }
                    .tb-logo-text { display: none; }
                    .tb-brand { margin-right: 12px; }

                    .tb-mobile-drawer {
                        display: block;
                        position: absolute;
                        top: 60px;
                        left: 0;
                        right: 0;
                        background: #09090b;
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        padding: 16px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                        z-index: 99;
                        animation: slideDown 0.2s ease-out;
                    }

                    .tb-mobile-nav {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .tb-mobile-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 16px;
                        background: rgba(255,255,255,0.02);
                        border: 1px solid rgba(255,255,255,0.05);
                        border-radius: 8px;
                        color: #a1a1aa;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                    }
                    .tb-mobile-item.active {
                        background: rgba(255,255,255,0.05);
                        color: #fafafa;
                        border-color: rgba(255,255,255,0.1);
                        font-weight: 600;
                    }
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </header>
    );
}
