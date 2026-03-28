import { useState } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import { ChevronDown, ChevronUp, Search, XCircle, Download, Banknote, CreditCard, Smartphone, Clock, Receipt, TrendingUp, AlertTriangle, User } from 'lucide-react';

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

    if (activePage !== 'historial') return null;

    const f = filterQuery.toLowerCase();
    const list = sales.filter((s) => {
        const matchText = !f || String(s.id).includes(f) || s.items.some((i) => i.nombre.toLowerCase().includes(f)) || s.pago.toLowerCase().includes(f);
        const matchPago = filterPago === 'Todos' || s.pago === filterPago;
        return matchText && matchPago;
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

    const total = list.reduce((s, v) => s + (v.anulada ? 0 : v.total), 0);

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

    const BG     = '#f1f4f9';
    const WHITE  = '#ffffff';
    const BORDER = '#e4e7ef';
    const TEXT1  = '#0f1117';
    const TEXT2  = '#4b5563';
    const TEXT3  = '#9ca3af';
    const SHADOW = '0 1px 2px rgba(15,17,23,0.04), 0 4px 20px rgba(15,17,23,0.07)';
    const GREEN  = '#16a34a';
    const GREEN_L= '#dcfce7';
    const RED    = '#dc2626';
    const RED_L  = '#fee2e2';
    const BLUE   = '#2563eb';
    const BLUE_L = '#dbeafe';

    const payMeta = {
        Efectivo:          { icon: <Banknote size={13} />,   color: '#15803d', bg: '#dcfce7',  label: 'Efectivo' },
        Transferencia:     { icon: <Smartphone size={13} />, color: '#1d4ed8', bg: '#dbeafe',  label: 'Transferencia' },
        Tarjeta:           { icon: <CreditCard size={13} />, color: '#7c3aed', bg: '#ede9fe',  label: 'Tarjeta' },
        'Billetera Digital':{ icon: <Smartphone size={13} />,color: '#0369a1', bg: '#e0f2fe',  label: 'Billetera' },
    };

    const ventasValidas = list.filter(s => !s.anulada);
    const ventasAnuladas = list.filter(s => s.anulada);
    const totalValidas = ventasValidas.reduce((s, v) => s + v.total, 0);

    const inp = {
        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
        border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14,
        color: TEXT1, background: '#f8fafc', outline: 'none',
        fontFamily: 'inherit', transition: 'all 0.18s',
    };
    const onFocusInp = e => { e.target.style.borderColor = BLUE; e.target.style.background = WHITE; e.target.style.boxShadow = `0 0 0 3px ${BLUE_L}`; };
    const onBlurInp  = e => { e.target.style.borderColor = BORDER; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; };

    return (
        <div className="page active" id="page-historial" style={{ background: BG, padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* ── TOPBAR ── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '0 24px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, height: 64, boxShadow: '0 1px 0 rgba(15,17,23,0.05)', flexWrap: 'wrap' }}>
                <div>
                    <span style={{ fontSize: 17, fontWeight: 700, color: TEXT1, letterSpacing: '-0.4px' }}>Historial de Ventas</span>
                    <span style={{ fontSize: 12, color: TEXT3, fontWeight: 500, marginLeft: 8 }}>· {list.length} registros</span>
                </div>
                <div style={{ flex: 1 }} />
                {/* Buscador */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, color: TEXT3, pointerEvents: 'none' }} />
                    <input type="text" placeholder="Buscar por producto, método..." value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        style={{ paddingLeft: 34, paddingRight: filterQuery ? 32 : 14, paddingTop: 9, paddingBottom: 9, border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT1, background: '#f8fafc', outline: 'none', fontFamily: 'inherit', width: 240, transition: 'all 0.18s' }}
                        onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.background = WHITE; e.target.style.boxShadow = `0 0 0 3px ${BLUE_L}`; }}
                        onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }} />
                    {filterQuery && (
                        <button onClick={() => setFilterQuery('')}
                            style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: TEXT3, display: 'flex', padding: 0 }}>
                            <XCircle size={15} />
                        </button>
                    )}
                </div>
                {/* Filtro método de pago */}
                <div style={{ display: 'flex', gap: 4 }}>
                    {['Todos', 'Efectivo', 'Transferencia', 'Tarjeta'].map(p => {
                        const active = filterPago === p;
                        return (
                            <button key={p} onClick={() => setFilterPago(p)}
                                style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${active ? BLUE : BORDER}`, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', background: active ? BLUE_L : '#f8fafc', color: active ? BLUE : TEXT2, fontFamily: 'inherit' }}>
                                {p}
                            </button>
                        );
                    })}
                </div>
                <button onClick={exportCSV}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: '#f8fafc', color: TEXT2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = TEXT1; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; }}>
                    <Download size={14} /> Exportar CSV
                </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── RESUMEN ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <div style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', borderRadius: 16, border: '1.5px solid #93c5fd', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Receipt size={20} style={{ color: '#1d4ed8' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: '#1e3a8a', lineHeight: 1 }}>{ventasValidas.length}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginTop: 3 }}>Ventas válidas</div>
                        </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)', borderRadius: 16, border: '1.5px solid #86efac', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <TrendingUp size={20} style={{ color: '#15803d' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#14532d', lineHeight: 1, letterSpacing: '-0.5px' }}>{fmt(totalValidas)}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginTop: 3 }}>Total recaudado</div>
                        </div>
                    </div>
                    {ventasAnuladas.length > 0 && (
                        <div style={{ background: 'linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%)', borderRadius: 16, border: '1.5px solid #fca5a5', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={20} style={{ color: '#b91c1c' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 26, fontWeight: 900, color: '#7f1d1d', lineHeight: 1 }}>{ventasAnuladas.length}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginTop: 3 }}>Anuladas</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── LISTA ── */}
                <div style={{ background: WHITE, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>

                    {/* Cabecera tabla */}
                    <div style={{ display: 'grid', gridTemplateColumns: '64px 90px 1fr 150px 110px 40px', padding: '10px 20px', borderBottom: `2px solid #f3f4f6`, background: '#fafafa' }}>
                        {['#', 'Hora', 'Productos', 'Método de pago', 'Total', ''].map((h, i) => (
                            <div key={i} style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>
                        ))}
                    </div>

                    {list.length === 0 ? (
                        <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Search size={28} style={{ color: TEXT3 }} />
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT2 }}>Sin resultados</div>
                            <div style={{ fontSize: 13, color: TEXT3 }}>{filterQuery || filterPago !== 'Todos' ? 'Probá con otros filtros' : 'Todavía no hay ventas registradas'}</div>
                        </div>
                    ) : list.map((s, idx) => {
                        const isOpen = expandedId === s.id;
                        const pm = payMeta[s.pago] || { icon: <Banknote size={13} />, color: TEXT2, bg: '#f3f4f6', label: s.pago };
                        return (
                            <div key={s.id} style={{ borderBottom: idx < list.length - 1 ? `1px solid #f3f4f6` : 'none' }}>
                                {/* Fila principal */}
                                <div onClick={() => setExpandedId(isOpen ? null : s.id)}
                                    style={{ display: 'grid', gridTemplateColumns: '64px 90px 1fr 150px 110px 40px', alignItems: 'center', padding: '13px 20px', cursor: 'pointer', transition: 'background 0.15s', background: isOpen ? '#f8fafc' : 'transparent', opacity: s.anulada ? 0.65 : 1 }}
                                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#fafafa'; }}
                                    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}>

                                    {/* ID */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: s.anulada ? TEXT3 : BLUE }}>#{s.id}</span>
                                    </div>

                                    {/* Hora + usuario */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: TEXT1 }}>
                                            <Clock size={11} style={{ color: TEXT3 }} /> {s.hora}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: TEXT3 }}>
                                            <User size={10} /> {s.usuarioNombre || 'Sistema'}
                                        </span>
                                    </div>

                                    {/* Productos */}
                                    <div style={{ fontSize: 13, color: TEXT2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                                        {s.items.map((i, idx) => (
                                            <span key={idx}>
                                                {idx > 0 && <span style={{ color: TEXT3, margin: '0 4px' }}>·</span>}
                                                <span style={{ fontWeight: 500 }}>{i.nombre}</span>
                                                <span style={{ color: TEXT3, fontSize: 12 }}> ×{i.qty}</span>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Método pago */}
                                    <div>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: pm.bg, color: pm.color }}>
                                            {pm.icon} {pm.label}
                                        </span>
                                    </div>

                                    {/* Total */}
                                    <div style={{ textAlign: 'right' }}>
                                        {s.anulada
                                            ? <span style={{ fontSize: 12, fontWeight: 700, color: RED, background: RED_L, padding: '3px 10px', borderRadius: 20 }}>ANULADA</span>
                                            : <span style={{ fontSize: 15, fontWeight: 800, color: TEXT1 }}>{fmt(s.total)}</span>
                                        }
                                    </div>

                                    {/* Chevron */}
                                    <div style={{ display: 'flex', justifyContent: 'center', color: TEXT3 }}>
                                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {/* Detalle expandido */}
                                {isOpen && (
                                    <div style={{ padding: '0 20px 18px', background: '#f8fafc', borderTop: `1px dashed ${BORDER}` }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px 20px', marginTop: 16 }}>
                                            {/* Encabezados */}
                                            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Producto</div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right' }}>Cant.</div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right' }}>Subtotal</div>
                                            {/* Filas de items */}
                                            {s.items.map((i, idx) => (
                                                <>
                                                    <div key={`n${idx}`} style={{ fontSize: 13, color: TEXT1, fontWeight: 500, padding: '4px 0', borderTop: `1px solid ${BORDER}` }}>{i.nombre}</div>
                                                    <div key={`q${idx}`} style={{ fontSize: 13, color: TEXT2, textAlign: 'right', padding: '4px 0', borderTop: `1px solid ${BORDER}` }}>×{i.qty}</div>
                                                    <div key={`s${idx}`} style={{ fontSize: 13, fontWeight: 700, color: TEXT1, textAlign: 'right', padding: '4px 0', borderTop: `1px solid ${BORDER}` }}>{fmt(i.precio * i.qty)}</div>
                                                </>
                                            ))}
                                        </div>

                                        {/* Total + descuento */}
                                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
                                            {s.descuento > 0 && (
                                                <span style={{ fontSize: 12, color: RED, fontWeight: 600, background: RED_L, padding: '4px 12px', borderRadius: 8 }}>
                                                    Descuento {s.descuento}% (−{fmt(s.subtotal - s.total)})
                                                </span>
                                            )}
                                            <span style={{ fontSize: 15, fontWeight: 800, color: s.anulada ? TEXT3 : GREEN, background: s.anulada ? '#f3f4f6' : GREEN_L, padding: '6px 16px', borderRadius: 10 }}>
                                                Total: {fmt(s.total)}
                                            </span>
                                        </div>

                                        {/* Info de anulación */}
                                        {s.anulada && (
                                            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
                                                <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Venta anulada</div>
                                                <div><b>Anulada por:</b> {s.anuladaPor || 'Sistema'}</div>
                                                <div><b>Motivo:</b> {s.motivoAnulacion || 'Sin especificar'}</div>
                                            </div>
                                        )}

                                        {/* Botón anular */}
                                        {!s.anulada && (
                                            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                                                <button onClick={e => { e.stopPropagation(); handleAnular(s); }}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, border: `1.5px solid #fca5a5`, background: RED_L, color: RED, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = RED; e.currentTarget.style.color = WHITE; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = RED_L; e.currentTarget.style.color = RED; }}>
                                                    <XCircle size={14} /> Anular esta venta
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── MODAL ANULACIÓN ── */}
            {confirmAnularId && (
                <div onClick={e => { if (e.target === e.currentTarget) { setConfirmAnularId(null); setMotivoAnulacion(''); } }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: WHITE, borderRadius: 20, width: 420, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 8px 40px rgba(15,17,23,0.22)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid #f3f4f6`, background: '#fafafa', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: RED_L, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <XCircle size={18} style={{ color: RED }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT1 }}>Anular venta #{confirmAnularId}</div>
                                <div style={{ fontSize: 12, color: TEXT3 }}>Esta acción no se puede deshacer</div>
                            </div>
                        </div>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ padding: '12px 14px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, fontSize: 13, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                El monto se restará del total de caja y la venta quedará marcada como anulada en el historial.
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Motivo de anulación *</label>
                                <textarea value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)}
                                    placeholder="Ej: Error de carga, cliente canceló, producto sin stock..."
                                    style={{ ...inp, height: 72, resize: 'none', padding: '10px 14px' }}
                                    onFocus={onFocusInp} onBlur={onBlurInp} />
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid #f3f4f6`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => { setConfirmAnularId(null); setMotivoAnulacion(''); }}
                                style={{ padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: '#f8fafc', color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancelar
                            </button>
                            <button onClick={confirmAnular} disabled={!motivoAnulacion.trim()}
                                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: motivoAnulacion.trim() ? RED : '#d1d5db', color: WHITE, fontSize: 13, fontWeight: 700, cursor: motivoAnulacion.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: motivoAnulacion.trim() ? '0 2px 8px rgba(220,38,38,0.3)' : 'none', transition: 'all 0.15s' }}>
                                Confirmar anulación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
