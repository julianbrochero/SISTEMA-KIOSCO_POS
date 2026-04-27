import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import { TrendingUp, DollarSign, ShoppingBag, Receipt, BarChart3, Calendar, Activity } from 'lucide-react';

export default function ReportesPage() {
    const activePage = useStore((state) => state.activePage);
    const sales = useStore((state) => state.sales);

    const [period, setPeriod] = useState('hoy');
    const [dateDesde, setDateDesde] = useState('');
    const [dateHasta, setDateHasta] = useState('');

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
            if (dateDesde) dStart = new Date(dateDesde + 'T00:00:00');
            if (dateHasta) dEnd = new Date(dateHasta + 'T23:59:59');
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
                if (hour >= 8 && hour <= 22) cValsObj[`${hour}h`] += s.total;
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

        return { filteredSales: fSales, labels: cLabels, vals: cLabels.map(l => cValsObj[l]), periodLabel: pLabel };
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

    // Tokens SaaS
    const BG     = '#FAFAFA';
    const WHITE  = '#FFFFFF';
    const BORDER = '#E5E7EB';
    const TEXT1  = '#111827';
    const TEXT2  = '#4B5563';
    const TEXT3  = '#6B7280';
    const ACCENT = '#111827';
    const GREEN  = '#059669';

    return (
        <div className="page active" id="page-reportes" style={{ background: BG, padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* ── TOPBAR ── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '0 32px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, height: 68 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: TEXT1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Analytics</span>
                    <span style={{ fontSize: 13, color: TEXT3, fontWeight: 500 }}>Dashboard de métricas</span>
                </div>
                
                <div style={{ flex: 1 }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Period Label */}
                    <div style={{ fontSize: 13, fontWeight: 500, color: TEXT2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Activity size={14} color={TEXT3}/> 
                        {periodLabel}
                    </div>

                    {/* Segmented Control */}
                    <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 10, border: `1px solid #E5E7EB` }}>
                        {[
                            { id: 'hoy',    l: 'Hoy' },
                            { id: 'semana', l: 'Semana' },
                            { id: 'mes',    l: 'Mes' },
                            { id: 'anio',   l: 'Año' },
                            { id: 'todo',   l: 'Histórico' },
                            { id: 'custom', l: 'Rango' }
                        ].map(p => {
                            const active = period === p.id;
                            return (
                                <button key={p.id} onClick={() => setPeriod(p.id)}
                                    style={{ 
                                        padding: '6px 14px', borderRadius: 6, border: 'none', 
                                        fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer', 
                                        transition: 'all 0.2s ease', 
                                        background: active ? WHITE : 'transparent', 
                                        color: active ? TEXT1 : TEXT3, 
                                        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' 
                                    }}>
                                    {p.l}
                                </button>
                            );
                        })}
                    </div>

                    {/* Date Pickers for Custom */}
                    {period === 'custom' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: WHITE, padding: '4px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, boxShadow: '0 1px 2px rgba(0,0,0,0.02) inset' }}>
                            <Calendar size={14} style={{ color: TEXT3 }} />
                            <input type="date" value={dateDesde} onChange={e => setDateDesde(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: TEXT1, outline: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }} />
                            <span style={{ color: BORDER }}>|</span>
                            <input type="date" value={dateHasta} onChange={e => setDateHasta(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: TEXT1, outline: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }} />
                        </div>
                    )}
                </div>
            </div>

            {/* ── CONTENIDO ── */}
            <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* KPI CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                    
                    {/* Ganancia (Destacada) */}
                    <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ganancia Neta</span>
                            <TrendingUp size={18} color={GREEN} />
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 700, color: TEXT1, letterSpacing: '-1px', lineHeight: 1, marginBottom: 8 }}>{fmt(ganancia)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: GREEN, background: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>Margen {margen}%</span>
                        </div>
                    </div>

                    {/* Ventas */}
                    <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ventas Totales</span>
                            <DollarSign size={18} color={TEXT3} />
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 700, color: TEXT1, letterSpacing: '-1px', lineHeight: 1, marginBottom: 8 }}>{fmt(baseTotal)}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT3 }}>Bruto facturado</span>
                        </div>
                    </div>

                    {/* Transacciones */}
                    <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transacciones</span>
                            <Receipt size={18} color={TEXT3} />
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 700, color: TEXT1, letterSpacing: '-1px', lineHeight: 1, marginBottom: 8 }}>{cantTransacciones}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT3 }}>Ventas concretadas</span>
                        </div>
                    </div>

                    {/* Ticket Promedio */}
                    <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket Promedio</span>
                            <ShoppingBag size={18} color={TEXT3} />
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 700, color: TEXT1, letterSpacing: '-1px', lineHeight: 1, marginBottom: 8 }}>{fmt(ticketPromedio)}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT3 }}>Por cliente</span>
                        </div>
                    </div>

                </div>

                {/* GRÁFICO PRINCIPAL */}
                <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT1, margin: 0 }}>Evolución de Ingresos</h3>
                            <p style={{ fontSize: 13, color: TEXT3, margin: '4px 0 0' }}>Volumen de ventas a lo largo del tiempo</p>
                        </div>
                        {baseTotal > 0 && (
                            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT1, background: BG, padding: '6px 12px', borderRadius: 8, border: `1px solid ${BORDER}` }}>
                                Total: {fmt(baseTotal)}
                            </div>
                        )}
                    </div>
                    
                    {baseTotal === 0 ? (
                        <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', borderRadius: 12, border: '1px dashed #D1D5DB' }}>
                            <BarChart3 size={32} color="#D1D5DB" style={{ marginBottom: 12 }} />
                            <span style={{ fontSize: 15, fontWeight: 600, color: TEXT2 }}>Aún no hay datos</span>
                            <span style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>Registra ventas para visualizar el gráfico</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 260, paddingBottom: 24, borderBottom: `1px solid #F3F4F6`, position: 'relative' }}>
                            {vals.map((v, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, height: '100%', justifyContent: 'flex-end', group: 'bar' }}>
                                    
                                    <div title={fmt(v)} style={{ 
                                        width: '100%', 
                                        maxWidth: 48,
                                        height: `${(v / maxChartVal) * 100}%`, 
                                        background: v > 0 ? ACCENT : 'transparent', 
                                        borderRadius: '4px 4px 0 0', 
                                        transition: 'all 0.3s ease',
                                        minHeight: v > 0 ? 4 : 0,
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 1}
                                    />
                                    
                                    <span style={{ 
                                        position: 'absolute', bottom: -10,
                                        fontSize: 11, color: TEXT3, fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        transform: labels.length > 15 ? 'translateY(16px) rotate(-45deg)' : 'translateY(16px)',
                                        transformOrigin: labels.length > 15 ? 'top right' : 'center'
                                    }}>
                                        {labels[i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* LISTAS SECUNDARIAS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

                    {/* Top Productos */}
                    <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid #F3F4F6`, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ShoppingBag size={18} color={TEXT2} />
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT1 }}>Productos más vendidos</div>
                                <div style={{ fontSize: 13, color: TEXT3 }}>Por cantidad de unidades</div>
                            </div>
                        </div>
                        <div style={{ padding: '12px 24px 24px' }}>
                            {topList.length === 0 ? (
                                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT3, fontSize: 14 }}>Sin información de productos</div>
                            ) : topList.map(([name, data], i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < topList.length - 1 ? `1px solid #F3F4F6` : 'none' }}>
                                    <span style={{ width: 24, fontSize: 14, fontWeight: 600, color: TEXT3, textAlign: 'center' }}>{i + 1}</span>
                                    <span style={{ fontSize: 14, fontWeight: 500, color: TEXT1, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT1 }}>{data.qty} u.</span>
                                        <span style={{ fontSize: 12, color: TEXT3 }}>{fmt(data.rev)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mayor Ganancia */}
                    <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid #F3F4F6`, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TrendingUp size={18} color={GREEN} />
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT1 }}>Mayor rentabilidad</div>
                                <div style={{ fontSize: 13, color: TEXT3 }}>Top 5 por margen de ganancia</div>
                            </div>
                        </div>
                        <div style={{ padding: '12px 24px 24px' }}>
                            {profitList.length === 0 ? (
                                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT3, fontSize: 14 }}>Sin información de rentabilidad</div>
                            ) : profitList.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < profitList.length - 1 ? `1px solid #F3F4F6` : 'none' }}>
                                    <span style={{ width: 24, fontSize: 14, fontWeight: 600, color: TEXT3, textAlign: 'center' }}>{i + 1}</span>
                                    <span style={{ fontSize: 14, fontWeight: 500, color: TEXT1, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: GREEN }}>+{fmt(item.profit)}</span>
                                        <span style={{ fontSize: 12, color: TEXT3 }}>Venta brute: {fmt(item.rev)}</span>
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
