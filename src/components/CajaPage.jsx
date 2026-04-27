import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import {
    Lock, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
    DollarSign, Trash2, TrendingDown, Download, Upload, Clock
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

    const egresoPresets       = ['Gastos varios', 'Retiro de efectivo', 'Pago a proveedor', 'Compra mercadería', 'Servicios / Impuestos'];
    const ingresoPresets      = ['Cobro deuda', 'Ingreso extra', 'Fondo / Cambio'];

    const [egresoDesc,        setEgresoDesc]        = useState(egresoPresets[0]);
    const [egresoMonto,       setEgresoMonto]       = useState('');
    const [ingresoDesc,       setIngresoDesc]       = useState(ingresoPresets[0]);
    const [ingresoMonto,      setIngresoMonto]      = useState('');
    
    const [cierreModalOpen,   setCierreModalOpen]   = useState(false);
    const [aperturaModalOpen, setAperturaModalOpen] = useState(false);
    const [efectivoReal,      setEfectivoReal]      = useState('');
    const [montoApertura,     setMontoApertura]     = useState('10000');

    const egresoMontoRef  = useRef(null);
    const ingresoMontoRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (!cajaAbierta) return;
            if (e.key === 'F4') { e.preventDefault(); setTimeout(() => egresoMontoRef.current?.focus(), 0); }
            if (e.key === 'F5') { e.preventDefault(); setTimeout(() => ingresoMontoRef.current?.focus(), 0); }
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
        setEgresoDesc(egresoPresets[0]); setEgresoMonto('');
    };

    const handleRegistrarIngreso = () => {
        const monto = parseFloat(ingresoMonto);
        if (!ingresoDesc.trim() || !monto || monto <= 0) { showToastAction('!', 'Completá descripción y monto', 'warn'); return; }
        registrarMovimiento('ingreso', ingresoDesc, monto);
        showToastAction('✓', 'Ingreso registrado: ' + fmt(monto), 'success');
        setIngresoDesc(ingresoPresets[0]); setIngresoMonto('');
    };

    const confirmCierre = () => { resetCaja(parseFloat(efectivoReal) || 0); setCierreModalOpen(false); showToastAction('✓', 'Caja cerrada', 'success'); };
    const confirmApertura = () => {
        const monto = parseFloat(montoApertura) || 0;
        if (monto <= 0) { showToastAction('!', 'Ingresá un monto válido', 'warn'); return; }
        abrirCaja(monto); setAperturaModalOpen(false); showToastAction('✓', `Caja abierta con ${fmt(monto)}`, 'success');
    };

    const inputStyle = {
        width: '100%', height: 44, padding: '0 16px', fontSize: 15,
        color: '#111827', background: '#FFF', border: '1px solid #D1D5DB',
        borderRadius: 8, outline: 'none', transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02) inset'
    };

    const onFocus = e => { e.target.style.borderColor = '#111827'; e.target.style.boxShadow = '0 0 0 1px #111827'; };
    const onBlur  = e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02) inset'; };

    return (
        <div className="page active" id="page-caja" style={{ background: '#FAFAFA', padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* ══ TOPBAR ═════════════════════════════════════════════════ */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, height: 68, padding: '0 32px', background: '#FFF', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Caja y Movimientos</span>
                    <span style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Gestión rápida de efectivo</span>
                </div>
                {cajaAbierta && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ECFDF5', color: '#059669', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, border: `1px solid #A7F3D0` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} /> Abierta
                    </div>
                )}
                <div style={{ flex: 1 }} />
                {!cajaAbierta ? (
                    <button
                        onClick={() => { setMontoApertura('10000'); setAperturaModalOpen(true); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', height: 38, background: '#111827', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
                        <DollarSign size={16} /> Abrir Caja
                    </button>
                ) : (
                    <button
                        onClick={() => { setEfectivoReal(''); setCierreModalOpen(true); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 38, background: '#FFF', color: '#374151', border: `1px solid #D1D5DB`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Lock size={15} /> Cerrar Caja
                    </button>
                )}
            </div>

            {/* ══ CONTENIDO ════════════════════════════════════════════ */}
            <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

                {!cajaAbierta ? (
                    <div style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#FFF', borderRadius: 16, border: `1px solid #E5E7EB`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={32} style={{ color: '#9CA3AF' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Caja actualmente cerrada</p>
                            <p style={{ fontSize: 14, color: '#6B7280', margin: '8px 0 0' }}>Es necesario abrir la caja para registrar ventas y movimientos</p>
                        </div>
                        <button
                            onClick={() => { setMontoApertura('10000'); setAperturaModalOpen(true); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 24px', height: 44, background: '#111827', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s', marginTop: 10 }}>
                            <DollarSign size={18} /> Abrir Caja Ahora
                        </button>
                    </div>

                ) : (<>

                    {/* ── MÉTRICAS (KPIs) ────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                        
                        {/* Efectivo en caja */}
                        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Efectivo en Caja</span>
                                <Wallet size={20} color="#059669" />
                            </div>
                            <div style={{ fontSize: 36, fontWeight: 700, color: '#111827', letterSpacing: '-1px', lineHeight: 1, marginBottom: 12 }}>
                                {fmt(cajaTotal)}
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#6B7280' }}>
                                Apertura inicial: <span style={{ color: '#374151', fontWeight: 600 }}>{fmt(cajaApertura)}</span>
                            </div>
                        </div>

                        {/* Ventas del día */}
                        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ventas del Día</span>
                                <TrendingUp size={20} color="#2563EB" />
                            </div>
                            <div style={{ fontSize: 36, fontWeight: 700, color: '#111827', letterSpacing: '-1px', lineHeight: 1, marginBottom: 12 }}>
                                {fmt(totalVentas)}
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 500, color: '#6B7280' }}>
                                <span><span style={{ color: '#374151', fontWeight: 600 }}>{ventasHoy.length}</span> tickets</span>
                                <span style={{ color: '#D1D5DB' }}>|</span>
                                <span style={{ color: '#059669', fontWeight: 600 }}>+{fmt(ganancia)} ganancia</span>
                            </div>
                        </div>

                        {/* Egresos */}
                        <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Egresos Totales</span>
                                <TrendingDown size={20} color="#DC2626" />
                            </div>
                            <div style={{ fontSize: 36, fontWeight: 700, color: '#111827', letterSpacing: '-1px', lineHeight: 1, marginBottom: 12 }}>
                                {fmt(egresos)}
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#6B7280' }}>
                                Efectivo teórico esperado: <span style={{ color: '#374151', fontWeight: 600 }}>{fmt(esperado)}</span>
                            </div>
                        </div>

                    </div>

                    {/* ── FORMULARIOS DE REGISTRO ──────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

                        {/* EGRESO */}
                        <div style={{ background: '#FFF', borderRadius: 16, border: `1px solid #E5E7EB`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '20px 24px', borderBottom: `1px solid #F3F4F6`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <ArrowDownCircle size={18} color="#DC2626" />
                                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Registrar Egreso</span>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '4px 8px', borderRadius: 6 }}>F4</span>
                            </div>
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Categoría / Motivo</label>
                                    <select 
                                        value={egresoDesc} 
                                        onChange={e => setEgresoDesc(e.target.value)}
                                        style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', background: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") right 12px center/14px no-repeat #FFF` }}
                                        onFocus={onFocus} onBlur={onBlur}
                                    >
                                        {egresoPresets.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Monto a retirar</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 18, fontWeight: 500 }}>$</span>
                                        <input 
                                            ref={egresoMontoRef} type="number" min={0} placeholder="0.00"
                                            value={egresoMonto} onChange={e => setEgresoMonto(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleRegistrarEgreso(); }}
                                            style={{ ...inputStyle, paddingLeft: 36, fontSize: 24, fontWeight: 600, height: 56 }}
                                            onFocus={onFocus} onBlur={onBlur}
                                        />
                                    </div>
                                </div>
                                <button onClick={handleRegistrarEgreso}
                                    style={{ width: '100%', height: 44, background: '#111827', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: 4 }}>
                                    Registrar Egreso
                                </button>
                            </div>
                        </div>

                        {/* INGRESO */}
                        <div style={{ background: '#FFF', borderRadius: 16, border: `1px solid #E5E7EB`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '20px 24px', borderBottom: `1px solid #F3F4F6`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <ArrowUpCircle size={18} color="#059669" />
                                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Registrar Ingreso</span>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '4px 8px', borderRadius: 6 }}>F5</span>
                            </div>
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Categoría / Motivo</label>
                                    <select 
                                        value={ingresoDesc} 
                                        onChange={e => setIngresoDesc(e.target.value)}
                                        style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', background: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") right 12px center/14px no-repeat #FFF` }}
                                        onFocus={onFocus} onBlur={onBlur}
                                    >
                                        {ingresoPresets.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Monto a ingresar</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 18, fontWeight: 500 }}>$</span>
                                        <input 
                                            ref={ingresoMontoRef} type="number" min={0} placeholder="0.00"
                                            value={ingresoMonto} onChange={e => setIngresoMonto(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleRegistrarIngreso(); }}
                                            style={{ ...inputStyle, paddingLeft: 36, fontSize: 24, fontWeight: 600, height: 56 }}
                                            onFocus={onFocus} onBlur={onBlur}
                                        />
                                    </div>
                                </div>
                                <button onClick={handleRegistrarIngreso}
                                    style={{ width: '100%', height: 44, background: '#FFF', color: '#111827', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: 4 }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.background = '#F9FAFB'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#FFF'; }}
                                >
                                    Registrar Ingreso
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── MOVIMIENTOS HISTÓRICOS ─────────────────────── */}
                    <div style={{ background: '#FFF', borderRadius: 16, border: `1px solid #E5E7EB`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Clock size={16} color="#4B5563" />
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Historial de Movimientos</span>
                            {cajaMovs.length > 0 && (
                                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#4B5563', background: '#F3F4F6', padding: '2px 8px', borderRadius: 12 }}>
                                    {cajaMovs.length} registros hoy
                                </span>
                            )}
                        </div>

                        <div>
                            {cajaMovs.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 16 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F3F4F6' }}>
                                        <Clock size={20} color="#D1D5DB" />
                                    </div>
                                    <span style={{ fontSize: 14, color: '#4B5563', fontWeight: 500 }}>No hay movimientos registrados hoy</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {[...cajaMovs].reverse().map((m, i, arr) => (
                                        <div key={m.id} style={{ 
                                            display: 'flex', alignItems: 'center', padding: '16px 24px', 
                                            borderBottom: i < arr.length - 1 ? `1px solid #F3F4F6` : 'none',
                                            transition: 'background 0.2s', gap: 16
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: m.tipo === 'ingreso' ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {m.tipo === 'ingreso' ? <Upload size={14} color="#059669" /> : <Download size={14} color="#DC2626" />}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.desc}</div>
                                                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{m.hora} {m.usuario ? `· ${m.usuario}` : ''}</div>
                                            </div>

                                            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                                {m.tipo === 'ingreso' ? '+' : '−'} {fmt(m.monto)}
                                            </div>

                                            {eliminarMovimiento && (
                                                <button onClick={() => eliminarMovimiento(m.id)}
                                                    style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', transition: 'all 0.2s', flexShrink: 0 }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEE2E2'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent'; }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </>)}
            </div>

            {/* ══ MODAL APERTURA ═══════════════════════════════════════ */}
            <div className={`modal-overlay ${aperturaModalOpen ? 'open' : ''}`}>
                <div className="modal" style={{ width: 'min(400px, 92vw)', borderRadius: 16, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F3F4F6' }}>
                        <DollarSign size={20} color="#111827" /> 
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Apertura de Caja</span>
                    </div>
                    <div style={{ padding: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Monto inicial en efectivo</label>
                        <div style={{ position: 'relative', marginBottom: 20 }}>
                            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 18, fontWeight: 500 }}>$</span>
                            <input type="number" value={montoApertura}
                                onChange={e => setMontoApertura(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') confirmApertura(); }} autoFocus
                                style={{ ...inputStyle, paddingLeft: 36, fontSize: 20, fontWeight: 600, height: 48 }}
                                onFocus={onFocus} onBlur={onBlur} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
                            {[5000, 10000, 20000, 50000].map(amt => (
                                <button key={amt} onClick={() => setMontoApertura(String(amt))}
                                    style={{ padding: '10px 0', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: 13, fontWeight: 500, color: '#4B5563', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#F3F4F6'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; }}>
                                    {fmt(amt)}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setAperturaModalOpen(false)} style={{ flex: 1, height: 44, background: '#FFF', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={confirmApertura} style={{ flex: 1, height: 44, background: '#111827', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#FFF', cursor: 'pointer' }}>Abrir Caja</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ MODAL CIERRE ═════════════════════════════════════════ */}
            <div className={`modal-overlay ${cierreModalOpen ? 'open' : ''}`}>
                <div className="modal" style={{ width: 'min(440px, 92vw)', borderRadius: 16, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F3F4F6' }}>
                        <Lock size={20} color="#111827" /> 
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Cierre de Caja</span>
                    </div>
                    <div style={{ padding: 24 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, background: '#F9FAFB', padding: 16, borderRadius: 12, border: '1px solid #F3F4F6' }}>
                            {[
                                ['Fondo de Apertura', fmt(cajaApertura), '#6B7280'],
                                ['Ventas del día',    fmt(totalVentas),  '#059669'],
                                ['Egresos',           fmt(egresos),      '#DC2626'],
                                ['Total Esperado',   fmt(esperado),     '#111827', true],
                            ].map(([l, v, c, isBold]) => (
                                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: isBold ? '1px solid #E5E7EB' : 'none', paddingTop: isBold ? 12 : 0, marginTop: isBold ? 4 : 0 }}>
                                    <span style={{ color: isBold ? '#111827' : '#4B5563', fontWeight: isBold ? 600 : 400 }}>{l}</span>
                                    <span style={{ color: c, fontWeight: isBold ? 700 : 500 }}>{v}</span>
                                </div>
                            ))}
                        </div>
                        
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Efectivo real contado en caja</label>
                        <div style={{ position: 'relative', marginBottom: 12 }}>
                            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 18, fontWeight: 500 }}>$</span>
                            <input type="number" value={efectivoReal}
                                onChange={e => setEfectivoReal(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') confirmCierre(); }} autoFocus
                                style={{ ...inputStyle, paddingLeft: 36, fontSize: 20, fontWeight: 600, height: 48 }}
                                onFocus={onFocus} onBlur={onBlur} />
                        </div>

                        {efectivoReal && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0 4px' }}>
                                <span style={{ fontSize: 13, color: '#4B5563' }}>Diferencia (Sobrante / Faltante):</span>
                                <span style={{ fontSize: 15, fontWeight: 600, color: diff === 0 ? '#059669' : diff > 0 ? '#D97706' : '#DC2626' }}>
                                    {diff >= 0 ? '+' : ''}{fmt(diff)}
                                </span>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: efectivoReal ? 0 : 24 }}>
                            <button onClick={() => setCierreModalOpen(false)} style={{ flex: 1, height: 44, background: '#FFF', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={confirmCierre} style={{ flex: 1, height: 44, background: '#111827', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#FFF', cursor: 'pointer' }}>Confirmar Cierre</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
