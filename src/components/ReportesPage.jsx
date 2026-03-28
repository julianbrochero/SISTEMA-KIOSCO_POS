import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import { TrendingUp, DollarSign, ShoppingBag, Receipt, BarChart3, Calendar } from 'lucide-react';

export default function ReportesPage() {
    const activePage = useStore((state) => state.activePage);
    const sales = useStore((state) => state.sales);

    const [period, setPeriod] = useState('hoy');
    // Para filtro personalizado
    const [dateDesde, setDateDesde] = useState('');
    const [dateHasta, setDateHasta] = useState('');

    // Helpers
    const parseDbDate = (dStr) => {
        if (!dStr) return new Date();
        const parts = dStr.split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return new Date(dStr);
    };

    const { filteredSales, labels, vals, periodLabel } = useMemo(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        let dStart = new Date(0);
        let dEnd = new Date(now);
        let pLabel = 'Histórico';
        let chartType = 'diario';

        if (period === 'hoy') {
            dStart = startOfToday;
            pLabel = 'Hoy';
            chartType = 'horario';
        } else if (period === 'semana') {
            const day = now.getDay() || 7;
            dStart = new Date(startOfToday);
            dStart.setDate(now.getDate() - day + 1);
            pLabel = 'Esta Semana';
            chartType = 'semanal';
        } else if (period === 'mes') {
            dStart = new Date(now.getFullYear(), now.getMonth(), 1);
            pLabel = 'Este Mes';
            chartType = 'mensual_dias';
        } else if (period === 'anio') {
            dStart = new Date(now.getFullYear(), 0, 1);
            pLabel = 'Este Año';
            chartType = 'mensual';
        } else if (period === 'todo') {
            pLabel = 'Histórico Total';
            chartType = 'mensual';
        } else if (period === 'custom') {
            if (dateDesde) {
                dStart = new Date(dateDesde + 'T00:00:00');
            }
            if (dateHasta) {
                dEnd = new Date(dateHasta + 'T23:59:59');
            }
            pLabel = 'Rango Personalizado';
            const diffDays = (dEnd - dStart) / (1000 * 60 * 60 * 24);
            if (diffDays <= 2) chartType = 'horario';
            else if (diffDays <= 31) chartType = 'mensual_dias';
            else chartType = 'mensual';
        }

        const fSales = sales.filter(s => {
            if (s.anulada) return false;
            const sd = parseDbDate(s.fecha);
            return sd >= dStart && sd <= dEnd;
        });

        let cLabels = [];
        let cValsObj = {};

        if (chartType === 'horario') {
            cLabels = Array.from({ length: 15 }, (_, i) => `${i + 8}h`);
            cLabels.forEach(l => cValsObj[l] = 0);
            fSales.forEach(s => {
                if (!s.hora) return;
                const hour = parseInt(s.hora.split(':')[0]);
                if (hour >= 8 && hour <= 22) {
                    cValsObj[`${hour}h`] += s.total;
                }
            });
        } else if (chartType === 'semanal') {
            cLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            cLabels.forEach(l => cValsObj[l] = 0);
            fSales.forEach(s => {
                const day = parseDbDate(s.fecha).getDay();
                const idx = day === 0 ? 6 : day - 1;
                cValsObj[cLabels[idx]] += s.total;
            });
        } else if (chartType === 'mensual_dias') {
            const endDay = (period === 'mes') ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() : 31;
            cLabels = Array.from({ length: endDay }, (_, i) => String(i + 1));
            cLabels.forEach(l => cValsObj[l] = 0);
            fSales.forEach(s => {
                const d = parseDbDate(s.fecha).getDate();
                if (cValsObj[String(d)] !== undefined) cValsObj[String(d)] += s.total;
            });
        } else if (chartType === 'mensual') {
            cLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            cLabels.forEach(l => cValsObj[l] = 0);
            fSales.forEach(s => {
                const m = parseDbDate(s.fecha).getMonth();
                cValsObj[cLabels[m]] += s.total;
            });
        }

        return {
            filteredSales: fSales,
            labels: cLabels,
            vals: cLabels.map(l => cValsObj[l]),
            periodLabel: pLabel
        };
    }, [sales, period, dateDesde, dateHasta]);

    if (activePage !== 'reportes') return null;

    const baseTotal = filteredSales.reduce((s, v) => s + v.total, 0);
    const baseCosto = filteredSales.reduce((s, v) => s + (v.costo || 0), 0);
    const cantTransacciones = filteredSales.length;

    const ticketPromedio = cantTransacciones > 0 ? Math.floor(baseTotal / cantTransacciones) : 0;
    const ganancia = baseTotal - baseCosto;
    const margen = baseTotal > 0 ? Math.round((ganancia / baseTotal) * 100) : 0;

    const maxChartVal = Math.max(...vals, 1);

    const topMap = {};
    filteredSales.forEach((sale) => {
        sale.items.forEach((item) => {
            if (!topMap[item.nombre]) topMap[item.nombre] = { qty: 0, rev: 0, costo: 0 };
            topMap[item.nombre].qty += item.qty;
            topMap[item.nombre].rev += item.precio * item.qty;
            topMap[item.nombre].costo += (item.pc || 0) * item.qty;
        });
    });

    const topList = Object.entries(topMap)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 8);
    const maxQ = topList[0]?.[1].qty || 1;

    const profitList = Object.entries(topMap)
        .map(([name, data]) => ({ name, profit: data.rev - data.costo, rev: data.rev }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

    const BG     = '#f1f4f9';
    const WHITE  = '#ffffff';
    const BORDER = '#e4e7ef';
    const TEXT1  = '#0f1117';
    const TEXT2  = '#4b5563';
    const TEXT3  = '#9ca3af';
    const GREEN  = '#16a34a';
    const GREEN_L= '#dcfce7';
    const BLUE   = '#2563eb';
    const BLUE_L = '#dbeafe';
    const SHADOW = '0 1px 2px rgba(15,17,23,0.04), 0 4px 20px rgba(15,17,23,0.07)';

    return (
        <div className="page active" id="page-reportes" style={{ background: BG, padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* ── TOPBAR ── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '0 24px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, height: 64, boxShadow: '0 1px 0 rgba(15,17,23,0.05)', flexWrap: 'wrap' }}>
                <div>
                    <span style={{ fontSize: 17, fontWeight: 700, color: TEXT1, letterSpacing: '-0.4px' }}>Reportes</span>
                    <span style={{ fontSize: 12, color: TEXT3, fontWeight: 500, marginLeft: 8 }}>· {periodLabel}</span>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['hoy','semana','mes','anio','todo','custom'].map(p => {
                        const labelsMap = { hoy:'Hoy', semana:'Semana', mes:'Mes', anio:'Año', todo:'Todo', custom:'Rango' };
                        const active = period === p;
                        return (
                            <button key={p} onClick={() => setPeriod(p)}
                                style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${active ? BLUE : BORDER}`, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', background: active ? BLUE_L : '#f8fafc', color: active ? BLUE : TEXT2, fontFamily: 'inherit' }}>
                                {labelsMap[p]}
                            </button>
                        );
                    })}
                </div>
                {period === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${BORDER}` }}>
                        <Calendar size={14} style={{ color: TEXT3 }} />
                        <input type="date" value={dateDesde} onChange={e => setDateDesde(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: TEXT2, outline: 'none', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }} />
                        <span style={{ color: TEXT3 }}>–</span>
                        <input type="date" value={dateHasta} onChange={e => setDateHasta(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: TEXT2, outline: 'none', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }} />
                    </div>
                )}
            </div>

            {/* ── CONTENIDO ── */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* KPI CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>

                    {/* Ventas — azul */}
                    <div style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', borderRadius: 18, border: '1.5px solid #93c5fd', boxShadow: '0 2px 8px rgba(37,99,235,0.1),0 6px 24px rgba(37,99,235,0.08)', padding: '20px 22px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(37,99,235,0.18),0 12px 32px rgba(37,99,235,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 8px rgba(37,99,235,0.1),0 6px 24px rgba(37,99,235,0.08)'; }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'0.8px' }}>Ventas Totales</span>
                            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(37,99,235,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <DollarSign size={17} style={{ color:'#1d4ed8' }} />
                            </div>
                        </div>
                        <div style={{ fontSize:36, fontWeight:900, color:'#1e3a8a', letterSpacing:'-1.5px', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{fmt(baseTotal)}</div>
                        <div style={{ marginTop:10, fontSize:12, fontWeight:600, color:'#2563eb', background:'rgba(37,99,235,0.1)', padding:'3px 10px', borderRadius:8, display:'inline-block' }}>{cantTransacciones} ventas</div>
                    </div>

                    {/* Ganancia — verde */}
                    <div style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)', borderRadius: 18, border: '1.5px solid #86efac', boxShadow: '0 2px 8px rgba(22,163,74,0.1),0 6px 24px rgba(22,163,74,0.08)', padding: '20px 22px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(22,163,74,0.18),0 12px 32px rgba(22,163,74,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 8px rgba(22,163,74,0.1),0 6px 24px rgba(22,163,74,0.08)'; }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'#15803d', textTransform:'uppercase', letterSpacing:'0.8px' }}>Ganancia Neta</span>
                            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(22,163,74,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <TrendingUp size={17} style={{ color:'#15803d' }} />
                            </div>
                        </div>
                        <div style={{ fontSize:36, fontWeight:900, color:'#14532d', letterSpacing:'-1.5px', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{fmt(ganancia)}</div>
                        <div style={{ marginTop:10, fontSize:12, fontWeight:600, color:'#16a34a', background:'rgba(22,163,74,0.12)', padding:'3px 10px', borderRadius:8, display:'inline-block' }}>Margen {margen}%</div>
                    </div>

                    {/* Transacciones — púrpura */}
                    <div style={{ background: 'linear-gradient(135deg,#faf5ff 0%,#ede9fe 100%)', borderRadius: 18, border: '1.5px solid #c4b5fd', boxShadow: '0 2px 8px rgba(124,58,237,0.1),0 6px 24px rgba(124,58,237,0.08)', padding: '20px 22px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(124,58,237,0.18),0 12px 32px rgba(124,58,237,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 8px rgba(124,58,237,0.1),0 6px 24px rgba(124,58,237,0.08)'; }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.8px' }}>Transacciones</span>
                            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Receipt size={17} style={{ color:'#6d28d9' }} />
                            </div>
                        </div>
                        <div style={{ fontSize:36, fontWeight:900, color:'#4c1d95', letterSpacing:'-1.5px', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{cantTransacciones}</div>
                        <div style={{ marginTop:10, fontSize:12, fontWeight:600, color:'#7c3aed', background:'rgba(124,58,237,0.1)', padding:'3px 10px', borderRadius:8, display:'inline-block' }}>Ticket prom: {fmt(ticketPromedio)}</div>
                    </div>

                    {/* Ticket promedio — ámbar */}
                    <div style={{ background: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)', borderRadius: 18, border: '1.5px solid #fcd34d', boxShadow: '0 2px 8px rgba(217,119,6,0.1),0 6px 24px rgba(217,119,6,0.08)', padding: '20px 22px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(217,119,6,0.18),0 12px 32px rgba(217,119,6,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 8px rgba(217,119,6,0.1),0 6px 24px rgba(217,119,6,0.08)'; }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'#b45309', textTransform:'uppercase', letterSpacing:'0.8px' }}>Ticket Promedio</span>
                            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(217,119,6,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <ShoppingBag size={17} style={{ color:'#b45309' }} />
                            </div>
                        </div>
                        <div style={{ fontSize:36, fontWeight:900, color:'#78350f', letterSpacing:'-1.5px', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{fmt(ticketPromedio)}</div>
                        <div style={{ marginTop:10, fontSize:12, fontWeight:600, color:'#d97706', background:'rgba(217,119,6,0.1)', padding:'3px 10px', borderRadius:8, display:'inline-block' }}>Por venta</div>
                    </div>
                </div>

                {/* GRÁFICO */}
                <div style={{ background: WHITE, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px', borderBottom: `1px solid #f3f4f6`, background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: BLUE_L, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BarChart3 size={16} style={{ color: BLUE }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1 }}>Evolución de Ventas</div>
                            <div style={{ fontSize: 11, color: TEXT3, fontWeight: 500 }}>{periodLabel}</div>
                        </div>
                        {baseTotal > 0 && (
                            <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: BLUE, background: BLUE_L, padding: '4px 12px', borderRadius: 8 }}>
                                Total: {fmt(baseTotal)}
                            </div>
                        )}
                    </div>
                    <div style={{ padding: '24px 24px 16px' }}>
                        {baseTotal === 0 ? (
                            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT3, fontSize: 14 }}>Sin ventas en este período</div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 160 }}>
                                {vals.map((v, i) => (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <div title={fmt(v)} style={{ width: '100%', height: `${(v / maxChartVal) * 130}px`, background: v > 0 ? 'linear-gradient(180deg,#3b82f6 0%,#1d4ed8 100%)' : '#e5e7eb', borderRadius: '4px 4px 2px 2px', transition: 'height 0.3s ease', minHeight: v > 0 ? 4 : 0 }} />
                                        <span style={{ fontSize: 10, color: TEXT3, transform: labels.length > 15 ? 'rotate(-45deg)' : 'none', marginTop: labels.length > 15 ? 4 : 0 }}>{labels[i]}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* TABLAS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

                    {/* Top productos */}
                    <div style={{ background: WHITE, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                        <div style={{ padding: '18px 24px', borderBottom: `1px solid #f3f4f6`, background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShoppingBag size={16} style={{ color: '#7c3aed' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1 }}>Más Vendidos</div>
                                <div style={{ fontSize: 11, color: TEXT3, fontWeight: 500 }}>Por cantidad de unidades</div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {topList.length === 0 ? (
                                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT3, fontSize: 14 }}>No hay datos</div>
                            ) : topList.map(([name, data], i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 5 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 20, height: 20, borderRadius: 6, background: i === 0 ? '#fef3c7' : i === 1 ? '#f3f4f6' : '#f8fafc', color: i === 0 ? '#d97706' : i === 1 ? '#6b7280' : TEXT3, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                                            <span style={{ fontWeight: 600, color: TEXT1 }}>{name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 6 }}>{data.qty}u</span>
                                            <span style={{ fontSize: 12, color: TEXT3 }}>{fmt(data.rev)}</span>
                                        </div>
                                    </div>
                                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${(data.qty / maxQ) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#7c3aed 0%,#4f46e5 100%)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mayor ganancia */}
                    <div style={{ background: WHITE, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                        <div style={{ padding: '18px 24px', borderBottom: `1px solid #f3f4f6`, background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: GREEN_L, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={16} style={{ color: GREEN }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1 }}>Mayor Ganancia</div>
                                <div style={{ fontSize: 11, color: TEXT3, fontWeight: 500 }}>Top 5 por ganancia neta</div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {profitList.length === 0 ? (
                                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT3, fontSize: 14 }}>No hay datos</div>
                            ) : profitList.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: i === 0 ? '#f0fdf4' : '#fafafa', borderRadius: 10, border: `1px solid ${i === 0 ? '#86efac' : BORDER}` }}>
                                    <span style={{ width: 24, height: 24, borderRadius: 7, background: i === 0 ? GREEN_L : '#f3f4f6', color: i === 0 ? GREEN : TEXT3, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                                    <span style={{ fontWeight: 600, color: TEXT1, flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: GREEN }}>{fmt(item.profit)}</div>
                                        <div style={{ fontSize: 11, color: TEXT3 }}>ventas: {fmt(item.rev)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
