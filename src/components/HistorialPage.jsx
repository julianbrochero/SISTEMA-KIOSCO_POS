import { useState } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import { ChevronDown, ChevronUp, Search, XCircle, Download, Banknote, CreditCard, Smartphone, Clock, Receipt, TrendingUp, AlertTriangle, User, Calendar, Filter, FileText } from 'lucide-react';
import React from 'react';

export default function HistorialPage() {
    const activePage = useStore((state) => state.activePage);
    const sales = useStore((state) => state.sales);
    const anularVenta = useStore((state) => state.anularVenta);
    const showToastAction = useStore((state) => state.showToastAction);

    const [filterQuery, setFilterQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [confirmAnularId, setConfirmAnularId] = useState(null);
    const [motivoAnulacion, setMotivoAnulacion] = useState('');
    const [filterPago, setFilterPago] = useState('Todos');
    const [dateChip, setDateChip] = useState('todos'); // 'todos'|'hoy'|'ayer'|'semana'|'rango'
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    if (activePage !== 'historial') return null;

    // Parsear fecha "dd/mm/yyyy" → Date sin hora
    const parseDate = (str) => {
        if (!str) return null;
        const p = str.split('/');
        if (p.length === 3) return new Date(+p[2], +p[1] - 1, +p[0]);
        return null;
    };

    const today    = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() || 7);

    const matchDate = (s) => {
        const d = parseDate(s.fecha);
        if (!d) return true;
        if (dateChip === 'hoy')    return d.getTime() === today.getTime();
        if (dateChip === 'ayer')   return d.getTime() === yesterday.getTime();
        if (dateChip === 'semana') return d >= weekStart && d <= today;
        if (dateChip === 'rango') {
            const desde = fechaDesde ? new Date(fechaDesde) : null;
            const hasta = fechaHasta ? new Date(fechaHasta) : null;
            if (desde) desde.setHours(0,0,0,0);
            if (hasta) hasta.setHours(23,59,59,999);
            if (desde && d < desde) return false;
            if (hasta && d > hasta) return false;
            return true;
        }
        return true;
    };

    const f = filterQuery.toLowerCase();
    const list = sales.filter((s) => {
        const matchText = !f || String(s.id).includes(f) || s.items.some((i) => i.nombre.toLowerCase().includes(f)) || s.pago.toLowerCase().includes(f);
        const matchPago = filterPago === 'Todos' || s.pago === filterPago;
        return matchText && matchPago && matchDate(s);
    });

    const handleAnular = (s) => {
        if (s.anulada) {
            showToastAction('!', 'Venta ya anulada', 'warn');
            return;
        }
        setConfirmAnularId(s.id);
    };

    const confirmAnular = () => {
        anularVenta(confirmAnularId, motivoAnulacion.trim());
        showToastAction('✓', `Venta #${confirmAnularId} anulada`, 'success');
        setConfirmAnularId(null);
        setMotivoAnulacion('');
    };

    const exportCSV = () => {
        const headers = 'ID,Hora,Fecha,Productos,Método,Total,Estado\n';
        const rows = list.map(s =>
            `${s.id},${s.hora},${s.fecha},"${s.items.map(i => `${i.nombre}x${i.qty}`).join('; ')}",${s.pago},${s.total},${s.anulada ? 'ANULADA' : 'OK'}`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToastAction('✓', 'Archivo CSV descargado', 'success');
    };

    const BG     = '#FAFAFA';
    const WHITE  = '#FFFFFF';
    const BORDER = '#E5E7EB';
    const TEXT1  = '#111827';
    const TEXT2  = '#4B5563';
    const TEXT3  = '#6B7280';
    const GREEN  = '#059669';
    const RED    = '#DC2626';
    const BLUE   = '#2563EB';

    const payMeta = {
        Efectivo:          { icon: <Banknote size={14} />,   color: '#059669', bg: '#D1FAE5',  label: 'Efectivo' },
        Transferencia:     { icon: <Smartphone size={14} />, color: '#2563EB', bg: '#DBEAFE',  label: 'Transferencia' },
        Tarjeta:           { icon: <CreditCard size={14} />, color: '#7C3AED', bg: '#EDE9FE',  label: 'Tarjeta' },
        'Billetera Digital':{ icon: <Smartphone size={14} />,color: '#0F766E', bg: '#CCFBF1',  label: 'Billetera' },
    };

    const ventasValidas = list.filter(s => !s.anulada);
    const ventasAnuladas = list.filter(s => s.anulada);
    const totalValidas = ventasValidas.reduce((s, v) => s + v.total, 0);

    return (
        <div className="page active" id="page-historial" style={{ background: BG, padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* ── TOPBAR SÍMIL SAAS ── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '0 32px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, height: 68 }}>
                <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 24, borderRight: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: TEXT1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Historial</span>
                    <span style={{ fontSize: 13, color: TEXT3, fontWeight: 500 }}>Registro de ventas</span>
                </div>
                
                {/* Search Header */}
                <div style={{ flex: 1, position: 'relative', maxWidth: 460 }}>
                    <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: TEXT3 }} />
                    <input type="text" placeholder="Buscar por ID, producto o método..." value={filterQuery} onChange={e => setFilterQuery(e.target.value)}
                        style={{ width: '100%', height: 40, padding: '0 36px 0 42px', background: BG, border: 'none', borderRadius: 8, fontSize: 13, color: TEXT1, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                        onFocus={e => e.target.style.boxShadow = `0 0 0 2px #E0E7FF, inset 0 1px 2px rgba(0,0,0,0.02)`}
                        onBlur={e => e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'} />
                    {filterQuery && (
                        <button onClick={() => setFilterQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: TEXT3, display: 'flex' }}>
                            <XCircle size={14} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={exportCSV}
                        style={{ padding: '0 16px', height: 40, borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT1, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <Download size={16} color={TEXT3}/> Exportar CSV
                    </button>
                </div>
            </div>

            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>

                {/* ── KPIs RESUMEN ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <TrendingUp size={20} color="#059669" />
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#065F46', lineHeight: 1 }}>{fmt(totalValidas)}</div>
                            <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginTop: 4 }}>Total Recaudado</div>
                        </div>
                    </div>

                    <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Receipt size={20} color="#2563EB" />
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: TEXT1, lineHeight: 1 }}>{ventasValidas.length}</div>
                            <div style={{ fontSize: 13, color: TEXT2, fontWeight: 600, marginTop: 4 }}>Ventas Válidas</div>
                        </div>
                    </div>

                    {ventasAnuladas.length > 0 && (
                        <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={20} color="#DC2626" />
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#991B1B', lineHeight: 1 }}>{ventasAnuladas.length}</div>
                                <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, marginTop: 4 }}>Ventas Anuladas</div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* ── STRIP DE FILTROS ── */}
                    <div style={{ padding: '16px 24px', borderBottom: `1px solid #F3F4F6`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: '#FAFAFA' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Calendar size={14} color={TEXT3} style={{ marginRight: 4 }} />
                            {[
                                { key: 'todos', label: 'Cualquier fecha' },
                                { key: 'hoy',   label: 'Hoy' },
                                { key: 'ayer',  label: 'Ayer' },
                                { key: 'semana',label: 'Esta Semana' },
                                { key: 'rango', label: 'Elegir rango' },
                            ].map(({ key, label }) => {
                                const active = dateChip === key;
                                return (
                                    <button key={key} onClick={() => { setDateChip(key); if (key !== 'rango') { setFechaDesde(''); setFechaHasta(''); } }}
                                        style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${active ? '#E5E7EB' : 'transparent'}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s', background: active ? WHITE : 'transparent', color: active ? TEXT1 : TEXT3, boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                                        {label}
                                    </button>
                                );
                            })}
                            {dateChip === 'rango' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, background: '#F3F4F6', padding: '4px 8px', borderRadius: 8 }}>
                                    <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                                        style={{ border: 'none', background: 'transparent', fontSize: 12, outline: 'none', color: TEXT1 }} />
                                    <span style={{ color: TEXT3, fontSize: 12 }}>—</span>
                                    <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                                        style={{ border: 'none', background: 'transparent', fontSize: 12, outline: 'none', color: TEXT1 }} />
                                </div>
                            )}
                        </div>

                        <div style={{ width: 1, height: 20, background: BORDER, margin: '0 8px' }} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Filter size={14} color={TEXT3} style={{ marginRight: 4 }} />
                            {['Todos', 'Efectivo', 'Transferencia', 'Tarjeta', 'Billetera Digital'].map(p => {
                                const active = filterPago === p;
                                return (
                                    <button key={p} onClick={() => setFilterPago(p)}
                                        style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${active ? '#E5E7EB' : 'transparent'}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s', background: active ? WHITE : 'transparent', color: active ? TEXT1 : TEXT3, boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                                        {p === 'Billetera Digital' ? 'Billetera' : p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── TABLA ── */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                                <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Venta</th>
                                <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</th>
                                <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Artículos</th>
                                <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Método de Pago</th>
                                <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: TEXT3 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BORDER}` }}>
                                                <FileText size={28} color="#D1D5DB" />
                                            </div>
                                            <span style={{ fontSize: 16, fontWeight: 600, color: TEXT1 }}>No hay ventas registradas</span>
                                            <span style={{ fontSize: 14, color: TEXT2 }}>
                                                {filterQuery || filterPago !== 'Todos' || dateChip !== 'todos' ? 'Intenta ajustando los filtros seleccionados' : 'Aún no se han generado ventas en el sistema'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : list.map((s, idx) => {
                                const isOpen = expandedId === s.id;
                                const pm = payMeta[s.pago] || { icon: <Banknote size={14} />, color: TEXT2, bg: '#F3F4F6', label: s.pago };
                                
                                return (
                                    <React.Fragment key={s.id}>
                                        <tr onClick={() => setExpandedId(isOpen ? null : s.id)}
                                            style={{ borderBottom: idx < list.length - 1 ? `1px solid #F3F4F6` : 'none', background: isOpen ? '#F9FAFB' : 'transparent', cursor: 'pointer', transition: 'background 0.15s', opacity: s.anulada ? 0.6 : 1 }}
                                            onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#F9FAFB'; }}
                                            onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}>
                                            
                                            <td style={{ padding: '14px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: s.anulada ? '#F3F4F6' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.anulada ? TEXT3 : BLUE }}>
                                                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: 14, fontWeight: 700, color: TEXT1 }}>#{s.id}</span>
                                                        <div style={{ fontSize: 12, color: TEXT3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <User size={10} /> {s.usuarioNombre || 'Sistema'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontSize: 13, fontWeight: 500, color: TEXT1 }}>{s.fecha}</div>
                                                <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{s.hora} hs</div>
                                            </td>

                                            <td style={{ padding: '14px 16px', maxWidth: 280 }}>
                                                <div style={{ fontSize: 13, color: TEXT2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {s.items.map((i, idxItem) => (
                                                        <span key={idxItem}>
                                                            {idxItem > 0 && <span style={{ color: '#D1D5DB', margin: '0 6px' }}>•</span>}
                                                            <span style={{ fontWeight: 500, color: TEXT1 }}>{i.qty}x</span> {i.nombre}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: pm.bg, color: pm.color }}>
                                                    {pm.icon} {pm.label}
                                                </span>
                                            </td>

                                            <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                                                {s.anulada ? (
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: RED, background: '#FEF2F2', padding: '4px 10px', borderRadius: 8, border: '1px solid #FECACA' }}>ANULADA</span>
                                                ) : (
                                                    <span style={{ fontSize: 16, fontWeight: 800, color: TEXT1 }}>{fmt(s.total)}</span>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Detalle Expandido */}
                                        {isOpen && (
                                            <tr>
                                                <td colSpan={5} style={{ padding: 0 }}>
                                                    <div style={{ padding: '24px 32px', background: '#F9FAFB', borderTop: `1px solid ${BORDER}`, borderBottom: `1px dashed ${BORDER}` }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) auto auto', gap: '12px 32px' }}>
                                                            {/* Encabezados */}
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase' }}>Producto</div>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', textAlign: 'right' }}>Cant.</div>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', textAlign: 'right' }}>Subtotal</div>
                                                            
                                                            <div style={{ gridColumn: '1 / -1', height: 1, background: '#E5E7EB', marginBottom: 4 }}></div>

                                                            {/* Filas */}
                                                            {s.items.map((i, idxItem) => (
                                                                <React.Fragment key={idxItem}>
                                                                    <div style={{ fontSize: 14, color: TEXT1, fontWeight: 500 }}>{i.nombre} <span style={{ fontSize: 12, color: TEXT3, fontWeight: 400 }}>(PU: {fmt(i.precio)})</span></div>
                                                                    <div style={{ fontSize: 14, color: TEXT2, textAlign: 'right', fontWeight: 500 }}>{i.qty}</div>
                                                                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1, textAlign: 'right' }}>{fmt(i.precio * i.qty)}</div>
                                                                </React.Fragment>
                                                            ))}
                                                        </div>

                                                        {/* Descuentos & Total */}
                                                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                                            {s.descuento > 0 && (
                                                                <div style={{ fontSize: 13, color: RED, fontWeight: 600, padding: '4px 12px', background: '#FEF2F2', borderRadius: 8 }}>
                                                                    Descuento {s.descuento}% (−{fmt(s.subtotal - s.total)})
                                                                </div>
                                                            )}
                                                            <div style={{ fontSize: 18, fontWeight: 800, color: s.anulada ? TEXT3 : '#065F46', background: s.anulada ? '#F3F4F6' : '#D1FAE5', border: s.anulada ? `1px solid ${BORDER}` : `1px solid #34D399`, padding: '8px 24px', borderRadius: 12 }}>
                                                                Total: {fmt(s.total)}
                                                            </div>
                                                        </div>

                                                        {/* Información y Acciones */}
                                                        <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                                                            {s.anulada ? (
                                                                <div style={{ display: 'flex', gap: 12, background: '#FFF7ED', border: '1px solid #FDBA74', padding: '16px', borderRadius: 12, flex: 1, maxWidth: 500 }}>
                                                                    <AlertTriangle size={20} color="#C2410C" style={{ flexShrink: 0 }} />
                                                                    <div>
                                                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#9A3412', marginBottom: 4 }}>Venta anulada por {s.anuladaPor || 'Sistema'}</div>
                                                                        <div style={{ fontSize: 13, color: '#9A3412' }}>Motivo: {s.motivoAnulacion || 'Sin especificar'}</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div style={{ flex: 1 }}></div>
                                                            )}

                                                            {!s.anulada && (
                                                                <button onClick={e => { e.stopPropagation(); handleAnular(s); }}
                                                                    style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid #FECACA`, background: '#FEF2F2', color: RED, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                                                                    <XCircle size={16} /> Anular esta venta
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODAL ANULACIÓN ── */}
            {confirmAnularId && (
                <div onClick={e => { if (e.target === e.currentTarget) { setConfirmAnularId(null); setMotivoAnulacion(''); } }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 20 }}>
                    <div style={{ background: WHITE, borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={24} color={RED} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT1 }}>Anular Venta #{confirmAnularId}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: 14, color: TEXT3 }}>Esta acción es irreversible y descontará el monto de los reportes correspondientes de caja.</p>
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 8 }}>Motivo de la anulación *</label>
                            <textarea value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)}
                                placeholder="Ej: Error de carga, el cliente devolvió el producto..."
                                style={{ width: '100%', height: 100, padding: '12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', resize: 'none', background: BG }}
                                onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = BORDER} />
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BORDER}`, background: '#FAFAFA', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button onClick={() => { setConfirmAnularId(null); setMotivoAnulacion(''); }}
                                style={{ padding: '0 16px', height: 40, borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT1, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button onClick={confirmAnular} disabled={!motivoAnulacion.trim()}
                                style={{ padding: '0 24px', height: 40, borderRadius: 8, border: 'none', background: motivoAnulacion.trim() ? RED : '#FCA5A5', color: WHITE, fontSize: 14, fontWeight: 600, cursor: motivoAnulacion.trim() ? 'pointer' : 'not-allowed', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                Confirmar Anulación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
