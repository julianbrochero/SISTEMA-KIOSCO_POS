import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import {
    Lock, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
    DollarSign, Trash2, TrendingDown, CheckCircle2
} from 'lucide-react';

export default function CajaPage() {
    const activePage          = useStore((s) => s.activePage);
    const sales               = useStore((s) => s.sales);
    const cajaMovs            = useStore((s) => s.cajaMovs);
    const cajaTotal           = useStore((s) => s.cajaTotal);
    const cajaApertura        = useStore((s) => s.cajaApertura);
    const cajaAbierta         = useStore((s) => s.cajaAbierta);
    const registrarMovimiento = useStore((s) => s.registrarMovimiento);
    const eliminarMovimiento  = useStore((s) => s.eliminarMovimiento);
    const resetCaja           = useStore((s) => s.resetCaja);
    const abrirCaja           = useStore((s) => s.abrirCaja);
    const showToastAction     = useStore((s) => s.showToastAction);

    const [egresoDesc,        setEgresoDesc]        = useState('');
    const [egresoMonto,       setEgresoMonto]       = useState('');
    const [ingresoDesc,       setIngresoDesc]       = useState('');
    const [ingresoMonto,      setIngresoMonto]      = useState('');
    const [cierreModalOpen,   setCierreModalOpen]   = useState(false);
    const [aperturaModalOpen, setAperturaModalOpen] = useState(false);
    const [efectivoReal,      setEfectivoReal]      = useState('');
    const [montoApertura,     setMontoApertura]     = useState('10000');

    const egresoMontoRef  = useRef(null);
    const ingresoMontoRef = useRef(null);
    const egresoDescRef   = useRef(null);
    const ingresoDescRef  = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (!cajaAbierta) return;
            if (e.key === 'F4') { e.preventDefault(); setEgresoDesc(d => d.trim() || 'Egreso'); setTimeout(() => egresoMontoRef.current?.focus(), 0); }
            if (e.key === 'F5') { e.preventDefault(); setIngresoDesc(d => d.trim() || 'Cobro'); setTimeout(() => ingresoMontoRef.current?.focus(), 0); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [cajaAbierta]);

    if (activePage !== 'caja') return null;

    const ventasHoy   = sales.filter(s => !s.anulada);
    const totalVentas = ventasHoy.reduce((s, v) => s + v.total, 0);
    const totalCosto  = ventasHoy.reduce((s, v) => s + (v.costo || 0), 0);
    const ganancia    = totalVentas - totalCosto;
    const egresos     = cajaMovs.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);
    const esperado    = cajaApertura + totalVentas - egresos;
    const diff        = (parseFloat(efectivoReal) || 0) - esperado;

    const handleRegistrarEgreso = () => {
        const monto = parseFloat(egresoMonto);
        if (!egresoDesc.trim() || !monto || monto <= 0) { showToastAction('!', 'Completá descripción y monto', 'warn'); return; }
        registrarMovimiento('egreso', egresoDesc, monto);
        showToastAction('✓', 'Egreso registrado: ' + fmt(monto), 'success');
        setEgresoDesc(''); setEgresoMonto('');
    };
    const handleRegistrarEgreso_quick = (monto) => {
        if (!egresoDesc.trim()) return;
        registrarMovimiento('egreso', egresoDesc, monto);
        showToastAction('✓', 'Egreso registrado: ' + fmt(monto), 'success');
        setEgresoDesc(''); setEgresoMonto('');
    };
    const handleRegistrarIngreso = () => {
        const monto = parseFloat(ingresoMonto);
        if (!ingresoDesc.trim() || !monto || monto <= 0) { showToastAction('!', 'Completá descripción y monto', 'warn'); return; }
        registrarMovimiento('ingreso', ingresoDesc, monto);
        showToastAction('✓', 'Ingreso registrado: ' + fmt(monto), 'success');
        setIngresoDesc(''); setIngresoMonto('');
    };
    const handleRegistrarIngreso_quick = (monto) => {
        if (!ingresoDesc.trim()) return;
        registrarMovimiento('ingreso', ingresoDesc, monto);
        showToastAction('✓', 'Ingreso registrado: ' + fmt(monto), 'success');
        setIngresoDesc(''); setIngresoMonto('');
    };
    const confirmCierre = () => { resetCaja(parseFloat(efectivoReal) || 0); setCierreModalOpen(false); showToastAction('✓', 'Caja cerrada', 'success'); };
    const confirmApertura = () => {
        const monto = parseFloat(montoApertura) || 0;
        if (monto <= 0) { showToastAction('!', 'Ingresá un monto válido', 'warn'); return; }
        abrirCaja(monto); setAperturaModalOpen(false); showToastAction('✓', `Caja abierta con ${fmt(monto)}`, 'success');
    };

    const egresoPresets   = ['Compra mercadería', 'Gastos varios', 'Servicio', 'Retiro', 'Proveedor'];
    const ingresoPresets  = ['Cobro deuda', 'Ingreso extra', 'Fondo'];
    const montosRapidos   = [100, 500, 1000, 2000, 5000];

    /* ─── tokens ──────────────────────────────────────────────────── */
    const BG      = '#f1f4f9';
    const WHITE   = '#ffffff';
    const BORDER  = '#e4e7ef';
    const TEXT1   = '#0f1117';
    const TEXT2   = '#4b5563';
    const TEXT3   = '#9ca3af';
    const GREEN   = '#16a34a';
    const GREEN_L = '#dcfce7';
    const RED     = '#dc2626';
    const RED_L   = '#fee2e2';
    const BLUE    = '#2563eb';
    const BLUE_L  = '#dbeafe';
    const SHADOW  = '0 1px 2px rgba(15,17,23,0.04), 0 4px 20px rgba(15,17,23,0.07)';
    const SHADOW_H= '0 2px 8px rgba(15,17,23,0.06), 0 8px 32px rgba(15,17,23,0.11)';

    const inp = {
        width: '100%', boxSizing: 'border-box',
        padding: '13px 16px',
        border: `1.5px solid ${BORDER}`,
        borderRadius: 12, fontSize: 14, color: TEXT1,
        background: '#f8fafc', outline: 'none',
        fontFamily: 'inherit', minHeight: 48,
        transition: 'all 0.18s',
    };
    const onFocus = e => { e.target.style.borderColor = BLUE; e.target.style.background = WHITE; e.target.style.boxShadow = `0 0 0 3px ${BLUE_L}`; };
    const onBlur  = e => { e.target.style.borderColor = BORDER; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; };

    /* ─── render ──────────────────────────────────────────────────── */
    return (
        <div className="page active" id="page-caja"
            style={{ background: BG, padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* ══ TOPBAR (sticky) ══════════════════════════════════════ */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, height: 64, padding: '0 32px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, boxShadow: '0 1px 0 rgba(15,17,23,0.05)' }}>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: TEXT1, letterSpacing: '-0.4px', lineHeight: 1.2 }}>Caja</span>
                    <span style={{ fontSize: 11, color: TEXT3, fontWeight: 500, marginTop: 1 }}>Gestión de efectivo</span>
                </div>

                {cajaAbierta && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: GREEN_L, color: GREEN, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, border: `1px solid #bbf7d0` }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, boxShadow: `0 0 0 2px ${GREEN_L}` }} />
                        Abierta
                    </div>
                )}

                <div style={{ flex: 1 }} />

                {!cajaAbierta ? (
                    <button
                        onClick={() => { setMontoApertura('10000'); setAperturaModalOpen(true); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: '#0f1117', color: WHITE, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.1px', boxShadow: '0 2px 8px rgba(15,17,23,0.22)', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1e2432'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,17,23,0.28)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#0f1117'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,17,23,0.22)'; }}>
                        <DollarSign size={15} /> Abrir Caja
                    </button>
                ) : (
                    <button
                        onClick={() => { setEfectivoReal(''); setCierreModalOpen(true); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: WHITE, color: TEXT2, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = TEXT1; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = SHADOW; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <Lock size={15} /> Cierre de Caja
                    </button>
                )}
            </div>

            {/* ══ CONTENIDO ════════════════════════════════════════════ */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── CERRADA ───────────────────────────────────────── */}
                {!cajaAbierta ? (
                    <div style={{ minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 60, background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: SHADOW }}>
                        <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 8px rgba(15,17,23,0.06)' }}>
                            <Lock size={42} style={{ color: '#c1c8d4' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 22, fontWeight: 800, color: TEXT1, margin: 0, letterSpacing: '-0.5px' }}>Caja cerrada</p>
                            <p style={{ fontSize: 14, color: TEXT3, margin: '8px 0 0', fontWeight: 400 }}>Abrí la caja para comenzar a operar</p>
                        </div>
                        <button
                            onClick={() => { setMontoApertura('10000'); setAperturaModalOpen(true); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 36px', background: '#0f1117', color: WHITE, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(15,17,23,0.22)', transition: 'all 0.18s', letterSpacing: '-0.1px' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,17,23,0.28)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,17,23,0.22)'; }}>
                            <DollarSign size={18} /> Abrir Caja
                        </button>
                    </div>

                ) : (<>

                    {/* ── MÉTRICAS ──────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>

                        {/* Efectivo — verde */}
                        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: 18, border: '1.5px solid #86efac', boxShadow: '0 2px 8px rgba(22,163,74,0.1), 0 6px 24px rgba(22,163,74,0.08)', overflow: 'hidden', transition: 'all 0.2s', cursor: 'default' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.18), 0 12px 32px rgba(22,163,74,0.12)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,163,74,0.1), 0 6px 24px rgba(22,163,74,0.08)'; }}>
                            <div style={{ padding: '22px 24px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Efectivo en caja</span>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Wallet size={19} style={{ color: '#15803d' }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: 42, fontWeight: 900, color: '#14532d', letterSpacing: '-2px', lineHeight: 1, marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
                                    {fmt(cajaTotal)}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: 'rgba(22,163,74,0.12)', padding: '3px 10px', borderRadius: 8 }}>
                                    Apertura {fmt(cajaApertura)}
                                </span>
                            </div>
                        </div>

                        {/* Ventas — azul */}
                        <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: 18, border: '1.5px solid #93c5fd', boxShadow: '0 2px 8px rgba(37,99,235,0.1), 0 6px 24px rgba(37,99,235,0.08)', overflow: 'hidden', transition: 'all 0.2s', cursor: 'default' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.18), 0 12px 32px rgba(37,99,235,0.12)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.1), 0 6px 24px rgba(37,99,235,0.08)'; }}>
                            <div style={{ padding: '22px 24px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Ventas del día</span>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <TrendingUp size={19} style={{ color: '#1d4ed8' }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: 42, fontWeight: 900, color: '#1e3a8a', letterSpacing: '-2px', lineHeight: 1, marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
                                    {fmt(totalVentas)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', background: 'rgba(37,99,235,0.12)', padding: '3px 10px', borderRadius: 8 }}>
                                        {ventasHoy.length} ventas
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d', background: 'rgba(22,163,74,0.12)', padding: '3px 10px', borderRadius: 8 }}>
                                        +{fmt(ganancia)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Egresos — rojo */}
                        <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', borderRadius: 18, border: '1.5px solid #fca5a5', boxShadow: '0 2px 8px rgba(220,38,38,0.1), 0 6px 24px rgba(220,38,38,0.08)', overflow: 'hidden', transition: 'all 0.2s', cursor: 'default' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(220,38,38,0.18), 0 12px 32px rgba(220,38,38,0.12)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(220,38,38,0.1), 0 6px 24px rgba(220,38,38,0.08)'; }}>
                            <div style={{ padding: '22px 24px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Egresos del día</span>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <TrendingDown size={19} style={{ color: '#b91c1c' }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: 42, fontWeight: 900, color: '#7f1d1d', letterSpacing: '-2px', lineHeight: 1, marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
                                    {fmt(egresos)}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', background: 'rgba(220,38,38,0.1)', padding: '3px 10px', borderRadius: 8 }}>
                                    Esperado {fmt(esperado)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── FORMULARIOS ───────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>

                        {/* EGRESO */}
                        <div style={{ background: WHITE, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                            {/* Header */}
                            <div style={{ padding: '18px 24px', borderBottom: `1px solid #f3f4f6`, display: 'flex', alignItems: 'center', gap: 12, background: '#fafafa' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: RED_L, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ArrowDownCircle size={18} style={{ color: RED }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1, lineHeight: 1.3 }}>Registrar Egreso</div>
                                    <div style={{ fontSize: 11, color: TEXT3, fontWeight: 500 }}>Salida de dinero de caja</div>
                                </div>
                                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: TEXT3, background: '#eef0f5', padding: '3px 8px', borderRadius: 7, letterSpacing: '0.3px', border: `1px solid ${BORDER}` }}>F4</span>
                            </div>
                            {/* Body */}
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {/* Presets */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                    {egresoPresets.map(p => (
                                        <button key={p}
                                            onClick={() => { setEgresoDesc(p); egresoMontoRef.current?.focus(); }}
                                            style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', borderColor: egresoDesc === p ? RED : BORDER, background: egresoDesc === p ? RED_L : '#f8fafc', color: egresoDesc === p ? RED : TEXT2 }}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                {/* Descripción */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Descripción</label>
                                    <input type="text" placeholder="¿A qué corresponde este egreso?"
                                        ref={egresoDescRef}
                                        value={egresoDesc} onChange={e => setEgresoDesc(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') egresoMontoRef.current?.focus(); }}
                                        style={inp} onFocus={onFocus} onBlur={onBlur} />
                                </div>
                                {/* Monto + botón */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Monto</label>
                                    {/* Montos rápidos */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        {montosRapidos.map(m => (
                                            <button key={m}
                                                onClick={() => { setEgresoMonto(String(m)); if (egresoDesc.trim()) handleRegistrarEgreso_quick(m); else egresoMontoRef.current?.focus(); }}
                                                style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.13s', background: String(egresoMonto) === String(m) ? RED_L : '#f8fafc', color: String(egresoMonto) === String(m) ? RED : TEXT2, borderColor: String(egresoMonto) === String(m) ? RED : BORDER }}
                                                onMouseEnter={e => { if (String(egresoMonto) !== String(m)) { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED; e.currentTarget.style.background = RED_L; } }}
                                                onMouseLeave={e => { if (String(egresoMonto) !== String(m)) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; e.currentTarget.style.background = '#f8fafc'; } }}>
                                                ${m.toLocaleString('es-AR')}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TEXT3, fontWeight: 700, fontSize: 16, pointerEvents: 'none', userSelect: 'none' }}>$</span>
                                            <input ref={egresoMontoRef} type="number" min={0} placeholder="0"
                                                value={egresoMonto} onChange={e => setEgresoMonto(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleRegistrarEgreso(); }}
                                                style={{ ...inp, paddingLeft: 30, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', MozAppearance: 'textfield' }}
                                                onFocus={onFocus} onBlur={onBlur} />
                                        </div>
                                        <button onClick={handleRegistrarEgreso}
                                            style={{ padding: '0 22px', background: RED, color: WHITE, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 48, transition: 'all 0.18s', whiteSpace: 'nowrap', boxShadow: `0 2px 8px rgba(220,38,38,0.2)` }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#b91c1c'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px rgba(220,38,38,0.35)`; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = RED; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 2px 8px rgba(220,38,38,0.2)`; }}>
                                            Registrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* INGRESO */}
                        <div style={{ background: WHITE, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                            <div style={{ padding: '18px 24px', borderBottom: `1px solid #f3f4f6`, display: 'flex', alignItems: 'center', gap: 12, background: '#fafafa' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: GREEN_L, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ArrowUpCircle size={18} style={{ color: GREEN }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1, lineHeight: 1.3 }}>Registrar Ingreso</div>
                                    <div style={{ fontSize: 11, color: TEXT3, fontWeight: 500 }}>Entrada de dinero a caja</div>
                                </div>
                                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: TEXT3, background: '#eef0f5', padding: '3px 8px', borderRadius: 7, letterSpacing: '0.3px', border: `1px solid ${BORDER}` }}>F5</span>
                            </div>
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                    {ingresoPresets.map(p => (
                                        <button key={p}
                                            onClick={() => { setIngresoDesc(p); ingresoMontoRef.current?.focus(); }}
                                            style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', borderColor: ingresoDesc === p ? GREEN : BORDER, background: ingresoDesc === p ? GREEN_L : '#f8fafc', color: ingresoDesc === p ? GREEN : TEXT2 }}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Descripción</label>
                                    <input type="text" placeholder="¿De dónde proviene este ingreso?"
                                        ref={ingresoDescRef}
                                        value={ingresoDesc} onChange={e => setIngresoDesc(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') ingresoMontoRef.current?.focus(); }}
                                        style={inp} onFocus={onFocus} onBlur={onBlur} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Monto</label>
                                    {/* Montos rápidos */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        {montosRapidos.map(m => (
                                            <button key={m}
                                                onClick={() => { setIngresoMonto(String(m)); if (ingresoDesc.trim()) handleRegistrarIngreso_quick(m); else ingresoMontoRef.current?.focus(); }}
                                                style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.13s', background: String(ingresoMonto) === String(m) ? GREEN_L : '#f8fafc', color: String(ingresoMonto) === String(m) ? GREEN : TEXT2, borderColor: String(ingresoMonto) === String(m) ? GREEN : BORDER }}
                                                onMouseEnter={e => { if (String(ingresoMonto) !== String(m)) { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; e.currentTarget.style.background = GREEN_L; } }}
                                                onMouseLeave={e => { if (String(ingresoMonto) !== String(m)) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; e.currentTarget.style.background = '#f8fafc'; } }}>
                                                ${m.toLocaleString('es-AR')}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TEXT3, fontWeight: 700, fontSize: 16, pointerEvents: 'none', userSelect: 'none' }}>$</span>
                                            <input ref={ingresoMontoRef} type="number" min={0} placeholder="0"
                                                value={ingresoMonto} onChange={e => setIngresoMonto(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleRegistrarIngreso(); }}
                                                style={{ ...inp, paddingLeft: 30, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', MozAppearance: 'textfield' }}
                                                onFocus={onFocus} onBlur={onBlur} />
                                        </div>
                                        <button onClick={handleRegistrarIngreso}
                                            style={{ padding: '0 22px', background: GREEN, color: WHITE, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 48, transition: 'all 0.18s', whiteSpace: 'nowrap', boxShadow: `0 2px 8px rgba(22,163,74,0.2)` }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px rgba(22,163,74,0.35)`; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = GREEN; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 2px 8px rgba(22,163,74,0.2)`; }}>
                                            Registrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── MOVIMIENTOS ───────────────────────────────── */}
                    <div style={{ background: WHITE, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                        {/* Header tabla */}
                        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT1 }}>Movimientos de hoy</span>
                            {cajaMovs.length > 0 && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, background: BLUE_L, padding: '3px 10px', borderRadius: 20, border: `1px solid #bfdbfe` }}>
                                    {cajaMovs.length} registros
                                </span>
                            )}
                        </div>

                        {/* Encabezado columnas */}
                        {cajaMovs.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto auto', padding: '8px 24px', borderBottom: `1px solid #f3f4f6`, background: '#fcfcfd' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px' }}></span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Descripción</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right', paddingRight: 40, minWidth: 120 }}>Monto</span>
                                <span style={{ width: 36 }} />
                            </div>
                        )}

                        <div>
                            {cajaMovs.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 20px', gap: 12 }}>
                                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <DollarSign size={24} style={{ color: '#d1d5db' }} />
                                    </div>
                                    <span style={{ fontSize: 14, color: TEXT3, fontWeight: 600 }}>Sin movimientos hoy</span>
                                    <span style={{ fontSize: 12, color: '#c4c9d4', fontWeight: 400 }}>Los registros de egreso e ingreso aparecerán aquí</span>
                                </div>
                            ) : (
                                [...cajaMovs].reverse().map((m, i, arr) => (
                                    <div key={m.id}
                                        style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto auto', alignItems: 'center', padding: '14px 24px', borderBottom: i < arr.length - 1 ? `1px solid #f7f8fc` : 'none', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fafbfd'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                                        {/* Icono */}
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: m.tipo === 'ingreso' ? GREEN_L : RED_L, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {m.tipo === 'ingreso'
                                                ? <ArrowUpCircle size={16} style={{ color: GREEN }} />
                                                : <ArrowDownCircle size={16} style={{ color: RED }} />}
                                        </div>

                                        {/* Descripción */}
                                        <div style={{ paddingRight: 16 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.desc}</div>
                                            <div style={{ fontSize: 11, color: TEXT3, marginTop: 2, fontWeight: 500 }}>{m.hora}{m.usuario ? ` · ${m.usuario}` : ''}</div>
                                        </div>

                                        {/* Monto */}
                                        <div style={{ textAlign: 'right', paddingRight: 12, minWidth: 120 }}>
                                            <span style={{ fontSize: 17, fontWeight: 800, color: m.tipo === 'ingreso' ? GREEN : RED, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                                                {m.tipo === 'ingreso' ? '+' : '−'}{fmt(m.monto)}
                                            </span>
                                        </div>

                                        {/* Eliminar */}
                                        {eliminarMovimiento && (
                                            <button onClick={() => eliminarMovimiento(m.id)}
                                                style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', transition: 'all 0.15s', flexShrink: 0 }}
                                                onMouseEnter={e => { e.currentTarget.style.color = RED; e.currentTarget.style.background = RED_L; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'transparent'; }}>
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </>)}
            </div>

            {/* ══ MODAL APERTURA ═══════════════════════════════════════ */}
            <div className={`modal-overlay ${aperturaModalOpen ? 'open' : ''}`}>
                <div className="modal" style={{ width: 'min(400px,96vw)' }}>
                    <div className="modal-title"><DollarSign size={20} /> Apertura de Caja</div>
                    <div className="monto-field">
                        <div className="field-label">Monto inicial en caja</div>
                        <input type="number" className="field-input" value={montoApertura}
                            onChange={e => setMontoApertura(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmApertura(); }} autoFocus />
                    </div>
                    <div className="quick-amounts" style={{ marginBottom: 16 }}>
                        {[5000, 10000, 20000, 50000].map(amt => (
                            <button key={amt} className="quick-amount-btn" onClick={() => setMontoApertura(String(amt))}>{fmt(amt)}</button>
                        ))}
                    </div>
                    <div className="modal-actions">
                        <button className="btn-modal-cancel" onClick={() => setAperturaModalOpen(false)}>Cancelar</button>
                        <button className="btn-modal-confirm" onClick={confirmApertura}>Abrir Caja</button>
                    </div>
                </div>
            </div>

            {/* ══ MODAL CIERRE ═════════════════════════════════════════ */}
            <div className={`modal-overlay ${cierreModalOpen ? 'open' : ''}`}>
                <div className="modal" style={{ width: 'min(440px,96vw)' }}>
                    <div className="modal-title"><Lock size={20} /> Cierre de Caja</div>
                    {[
                        ['Apertura',          fmt(cajaApertura), ''],
                        ['Ventas del día',    fmt(totalVentas),  'val-green'],
                        ['Ganancia neta',     fmt(ganancia),     'val-green'],
                        ['Egresos',           fmt(egresos),      'val-red'],
                        ['Efectivo esperado', fmt(esperado),     ''],
                    ].map(([l, v, c]) => (
                        <div className="stat-row" key={l}>
                            <span className="stat-row-label">{l}</span>
                            <span className={`stat-row-val ${c}`}>{v}</span>
                        </div>
                    ))}
                    <div className="monto-field" style={{ marginTop: 16 }}>
                        <div className="field-label">Efectivo contado en caja</div>
                        <input type="number" className="field-input" value={efectivoReal}
                            onChange={e => setEfectivoReal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmCierre(); }} autoFocus />
                    </div>
                    {efectivoReal && (
                        <div className="vuelto-display" style={{ margin: '12px 0' }}>
                            <span className="vuelto-label">Diferencia</span>
                            <span className="vuelto-val" style={{ color: diff === 0 ? GREEN : diff > 0 ? '#f59e0b' : RED }}>
                                {diff >= 0 ? '+' : ''}{fmt(diff)}
                            </span>
                        </div>
                    )}
                    <div className="modal-actions">
                        <button className="btn-modal-cancel" onClick={() => setCierreModalOpen(false)}>Cancelar</button>
                        <button className="btn-modal-confirm" onClick={confirmCierre}>CERRAR CAJA</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
