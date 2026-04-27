import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { Package, Trash2, PlusCircle, Check, X, Search, Download, TrendingUp, AlertTriangle, Box, Plus, Minus, Edit2, Info, FileSpreadsheet, List, Layers, FileBox } from 'lucide-react';
import { fmt } from '../utils';

export default function StockPage() {
    const activePage      = useStore(s => s.activePage);
    const products        = useStore(s => s.products);
    const addProduct      = useStore(s => s.addProduct);
    const updateProduct   = useStore(s => s.updateProduct);
    const addStock        = useStore(s => s.addStock);
    const registrarMovimiento = useStore(s => s.registrarMovimiento);
    const showToastAction = useStore(s => s.showToastAction);

    // ── NEW STATES FOR DESIGN ──
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos'); // todos | bajo | sin | con
    const [showAdjust, setShowAdjust] = useState(false);

    // ── ORIGINAL STATES FOR INGRESO FLOW ──
    const [scanValue,      setScanValue]      = useState('');
    const [pending,        setPending]        = useState(null);
    const [ingresoItems,   setIngresoItems]   = useState([]);
    const [confirmStep,    setConfirmStep]    = useState(false); // false | 'ask' | 'egreso'
    const [egresoImporte,  setEgresoImporte]  = useState('');

    const totalCosto = ingresoItems.reduce(
        (a, i) => a + (parseFloat(i.pc) || 0) * (parseInt(i.qty) || 0), 0
    );

    const guardarSinCosto = () => ejecutarGuardado(0);
    const guardarConCostoItems = () => {
        if (totalCosto <= 0) {
            showToastAction('⚠️', 'No hay costos cargados por producto', 'warn');
            return;
        }
        ejecutarGuardado(totalCosto);
    };

    // Keyboard confirm step for Ingreso
    useEffect(() => {
        if (!showAdjust) return;
        const handler = (e) => {
            if (confirmStep === 'ask') {
                if (e.key === 'Enter')              { e.preventDefault(); if (totalCosto > 0) guardarConCostoItems(); else guardarSinCosto(); }
                if (e.key === 'c' || e.key === 'C') { e.preventDefault(); guardarConCostoItems(); }
                if (e.key === 't' || e.key === 'T') { e.preventDefault(); setConfirmStep('egreso'); }
                if (e.key === 'n' || e.key === 'N') { e.preventDefault(); guardarSinCosto(); }
                if (e.key === 'Escape')             { e.preventDefault(); setConfirmStep(false); setTimeout(() => scannerRef.current?.focus(), 50); }
            } else if (confirmStep === 'egreso') {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setConfirmStep('ask');
                }
            } else if (pending) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setPending(null);
                    setTimeout(() => scannerRef.current?.focus(), 80);
                }
            } else if (!confirmStep && !pending) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowAdjust(false);
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [confirmStep, ingresoItems, showAdjust, pending, totalCosto]);

    const searchRef   = useRef(null);
    const scannerRef  = useRef(null);
    const qtyRef      = useRef(null);
    const pvPendRef   = useRef(null);
    const pcPendRef   = useRef(null);
    const egresoRef   = useRef(null);

    useEffect(() => {
        if (confirmStep === 'egreso') setTimeout(() => egresoRef.current?.focus(), 50);
    }, [confirmStep]);

    useEffect(() => {
        if (showAdjust) {
            setTimeout(() => scannerRef.current?.focus(), 150);
        } else {
            setTimeout(() => searchRef.current?.focus(), 150);
        }
    }, [showAdjust]);

    useEffect(() => {
        if (activePage === 'stock' && !showAdjust) {
            setTimeout(() => searchRef.current?.focus(), 150);
        }
    }, [activePage, showAdjust]);

    if (activePage !== 'stock') return null;

    // ── ORIGINAL SCAN LOGIC ──
    const handleScan = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const val = scanValue.trim();
        const lowerVal = val.toLowerCase();

        if (ingresoItems.length > 0 && !pending) {
            if (lowerVal === 'm') { setScanValue(''); setConfirmStep('egreso'); return; }
            if (lowerVal === 'n') { setScanValue(''); guardarSinCosto(); return; }
            if (!val) {
                if (totalCosto > 0) guardarConCostoItems();
                else guardarSinCosto();
                return;
            }
        }
        if (!val) return;

        const found = products.find(x => x.codigo === val)
            || products.find(x => x.nombre.toLowerCase().includes(val.toLowerCase()));

        if (found) {
            setPending({ product: found, qty: '', pv: String(found.pv), pc: String(found.pc) });
            setScanValue('');
            setTimeout(() => qtyRef.current?.focus(), 80);
        } else {
            setIngresoItems(prev => [...prev, {
                uid: Date.now() + Math.random(),
                id: null, isNew: true,
                codigo: val, nombre: '', pv: '', pc: '', qty: '', stockActual: 0,
            }]);
            setScanValue('');
            showToastAction('ℹ️', 'Producto nuevo – completá nombre y precios', 'info');
        }
    };

    const confirmPending = () => {
        if (!pending) return;
        const qty = Math.max(1, parseInt(pending.qty) || 1);
        const pv  = parseFloat(pending.pv) || pending.product.pv;
        const pc  = parseFloat(pending.pc) || pending.product.pc || 0;
        const { product } = pending;

        setIngresoItems(prev => {
            const copy = [...prev];
            const ex   = copy.find(i => i.id === product.id);
            if (ex) {
                ex.qty = String(parseInt(ex.qty) + qty);
                ex.pv  = String(pv);
                ex.pc  = String(pc);
            } else {
                copy.push({
                    uid: Date.now() + Math.random(),
                    id: product.id, isNew: false,
                    codigo: product.codigo, nombre: product.nombre,
                    pv: String(pv), pc: String(pc),
                    qty: String(qty), stockActual: product.stock,
                });
            }
            return copy;
        });

        setPending(null);
        setTimeout(() => { scannerRef.current?.focus(); }, 80);
    };

    const cancelPending = () => {
        setPending(null);
        setTimeout(() => scannerRef.current?.focus(), 80);
    };

    const updateItem = (uid, field, value) => setIngresoItems(prev => prev.map(i => i.uid === uid ? { ...i, [field]: value } : i));
    const removeItem = (uid) => setIngresoItems(prev => prev.filter(i => i.uid !== uid));

    const ejecutarGuardado = (importeEgreso) => {
        for (const i of ingresoItems) {
            if (i.isNew && !i.nombre.trim()) { showToastAction('⚠️', 'Completá el nombre de los productos nuevos', 'warn'); setConfirmStep(false); return; }
            if (!(parseInt(i.qty) > 0))      { showToastAction('⚠️', 'La cantidad debe ser mayor a 0', 'warn'); setConfirmStep(false); return; }
        }
        const toAddStock = [];
        let created = 0, updated = 0;
        for (const item of ingresoItems) {
            const qty = parseInt(item.qty);
            const pv  = parseFloat(item.pv) || 0;
            const pc  = parseFloat(item.pc) || 0;
            if (item.isNew) {
                addProduct({ codigo: item.codigo, nombre: item.nombre, pv, pc, stock: qty, stockMin: 5, cat: 'General', proveedor: 'Desconocido' });
                created++;
            } else {
                updateProduct(item.id, { pv, pc });
                toAddStock.push({ id: item.id, nombre: item.nombre, qty });
                updated++;
            }
        }
        if (toAddStock.length) addStock(toAddStock);
        const monto = parseFloat(importeEgreso) || 0;
        if (monto > 0)
            registrarMovimiento('egreso', `Ingreso mercadería (${ingresoItems.length} prod)`, monto);
        showToastAction('✅', `Guardado: ${created} nuevos, ${updated} actualizados.`, 'success');
        setIngresoItems([]);
        setConfirmStep(false);
        setEgresoImporte('');
        setShowAdjust(false);
    };

    const guardarIngreso = () => { 
        if (totalCosto > 0) guardarConCostoItems();
        else guardarSinCosto(); 
    };

    // ── NEW UI LOGIC ──
    const filterAndSearch = () => {
        let list = products;
        if (filterStatus === 'bajo') list = list.filter(p => !p.sinStock && p.stock <= p.stockMin && p.stock > 0);
        else if (filterStatus === 'sin') list = list.filter(p => !p.sinStock && p.stock <= 0);
        else if (filterStatus === 'con') list = list.filter(p => p.stock > 0 && !p.sinStock);
        
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            list = list.filter(p => p.nombre.toLowerCase().includes(q) || (p.codigo && p.codigo.includes(q)) || (p.cat && p.cat.toLowerCase().includes(q)));
        }
        return list;
    };
    
    const filteredProducts = filterAndSearch();

    const lowProds = products.filter(p => !p.sinStock && p.stock <= p.stockMin && p.stock > 0);
    const outProds = products.filter(p => !p.sinStock && p.stock <= 0);
    const allStockValue = products.reduce((acc, p) => acc + (parseFloat(p.pc) * Math.max(0, p.stock) || 0), 0);

    const exportCSV = () => {
        const headers = ["Codigo", "Nombre", "Categoria", "Precio Venta", "Costo", "Stock Actual", "Stock Minimo"];
        const rows = products.map(p => [(p.codigo || '').replace(/,/g, ''), (p.nombre || '').replace(/,/g, ''), (p.cat || '').replace(/,/g, ''), p.pv || 0, p.pc || 0, p.stock || 0, p.stockMin || 0]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventario_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToastAction('✓', 'Archivo CSV exportado', 'success');
    };

    const quickAdjust = (p, qty) => {
        addStock([{ id: p.id, nombre: p.nombre, qty }]);
        showToastAction('✓', `Stock actualizado: ${p.nombre} (${qty > 0 ? '+' : ''}${qty})`, 'success');
    };

    // Styles Variables to match SaaS Prompt
    const BG = '#F8FAFC';
    const WHITE = '#FFFFFF';
    const BORDER = '#E2E8F0';
    const TEXT1 = '#0F172A';
    const TEXT2 = '#475569';
    const TEXT3 = '#64748B';
    const ACCENT = '#0F172A'; // Black/Slate
    const RED = '#EF4444';
    const GREEN = '#10B981';
    const YELLOW = '#F59E0B';

    return (
        <div className="page active" id="page-new-stock" style={{ background: BG, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            
            {/* TOOLBAR */}
            <div style={{ padding: '0 32px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, height: 68, position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 24, borderRight: `1px solid ${BORDER}` }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: TEXT1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Control de Stock</span>
                        <span style={{ fontSize: 13, color: TEXT3, fontWeight: 500 }}>Gestión de inventario</span>
                    </div>
                    {/* Search Component */}
                    <div style={{ position: 'relative', width: 320 }}>
                        <Search size={16} color={TEXT3} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" ref={searchRef} placeholder="Escanear producto o buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = searchTerm.trim();
                                    if (!val) return;
                                    const found = products.find(x => x.codigo === val)
                                        || products.find(x => x.nombre.toLowerCase().includes(val.toLowerCase()));
                                    
                                    setShowAdjust(true);
                                    if (found) {
                                        setPending({ product: found, qty: '', pv: String(found.pv), pc: String(found.pc) });
                                        setTimeout(() => qtyRef.current?.focus(), 250);
                                    } else {
                                        setIngresoItems(prev => [...prev, {
                                            uid: Date.now() + Math.random(),
                                            id: null, isNew: true,
                                            codigo: val, nombre: '', pv: '', pc: '', qty: '', stockActual: 0,
                                        }]);
                                        showToastAction('ℹ️', 'Producto nuevo – completá nombre y precios', 'info');
                                    }
                                    setSearchTerm('');
                                    setScanValue('');
                                }
                            }}
                            style={{ width: '100%', height: 40, padding: '0 16px 0 42px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#F1F5F9', fontSize: 13, color: TEXT1, outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                            onFocus={e => { e.target.style.background = WHITE; e.target.style.borderColor = ACCENT; e.target.style.boxShadow = '0 0 0 3px #E2E8F0'; }}
                            onBlur={e => { e.target.style.background = '#F1F5F9'; e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'; }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={exportCSV} style={{ padding: '0 16px', height: 40, borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT2, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                        onMouseEnter={e => e.target.style.background = '#F8FAFC'} onMouseLeave={e => e.target.style.background = WHITE}>
                        <Download size={16} /> Exportar CSV
                    </button>
                    <button onClick={() => setShowAdjust(true)} style={{ padding: '0 16px', height: 40, borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT1, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                        onMouseEnter={e => e.target.style.background = '#F8FAFC'} onMouseLeave={e => e.target.style.background = WHITE}>
                        <Box size={16} /> Ajustar stock
                    </button>
                    <button onClick={() => { setShowAdjust(true); setTimeout(() => { setScanValue(''); }, 200); }} style={{ padding: '0 20px', height: 40, borderRadius: 8, border: 'none', background: ACCENT, color: WHITE, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        onMouseEnter={e => e.target.style.filter = 'brightness(1.2)'} onMouseLeave={e => e.target.style.filter = 'none'}>
                        <PlusCircle size={16} /> Nuevo producto
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={22} color={TEXT2} />
                        </div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: TEXT1, lineHeight: 1 }}>{products.length}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT3, marginTop: 4 }}>Total de Productos</div>
                        </div>
                    </div>
                    <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${outProds.length > 0 ? '#FECACA' : BORDER}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                        {outProds.length > 0 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: RED }}></div>}
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: outProds.length > 0 ? '#FEF2F2' : '#F1F5F9', border: outProds.length > 0 ? '1px solid #FECACA' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={22} color={outProds.length > 0 ? RED : TEXT2} />
                        </div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: outProds.length > 0 ? '#991B1B' : TEXT1, lineHeight: 1 }}>{outProds.length}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: outProds.length > 0 ? RED : TEXT3, marginTop: 4 }}>Productos sin Stock</div>
                        </div>
                    </div>
                    <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${lowProds.length > 0 ? '#FDE68A' : BORDER}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                        {lowProds.length > 0 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: YELLOW }}></div>}
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: lowProds.length > 0 ? '#FFFBEB' : '#F1F5F9', border: lowProds.length > 0 ? '1px solid #FDE68A' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={22} color={lowProds.length > 0 ? '#D97706' : TEXT2} />
                        </div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: lowProds.length > 0 ? '#92400E' : TEXT1, lineHeight: 1 }}>{lowProds.length}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: lowProds.length > 0 ? '#D97706' : TEXT3, marginTop: 4 }}>Bajo Stock</div>
                        </div>
                    </div>
                    <div style={{ background: WHITE, borderRadius: 16, padding: '20px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={22} color={GREEN} />
                        </div>
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: '#065F46', lineHeight: 1 }}>{fmt(allStockValue)}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: GREEN, marginTop: 4 }}>Costo Total Inventario</div>
                        </div>
                    </div>
                </div>

                {/* TABLE CONTAINER */}
                <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 400, overflow: 'hidden' }}>
                    
                    {/* Filters Row */}
                    <div style={{ padding: '16px 24px', borderBottom: `1px solid #F1F5F9`, display: 'flex', alignItems: 'center', gap: 12, background: '#FAFAFA' }}>
                        {[
                            { key: 'todos', label: 'Todos los productos' },
                            { key: 'bajo', label: 'Bajo stock (Crítico)', count: lowProds.length, color: '#D97706', bg: '#FFFBEB' },
                            { key: 'sin', label: 'Sin stock', count: outProds.length, color: RED, bg: '#FEF2F2' },
                            { key: 'con', label: 'Con stock' },
                        ].map(f => {
                            const isActive = filterStatus === f.key;
                            return (
                                <button key={f.key} onClick={() => setFilterStatus(f.key)}
                                    style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${isActive ? '#CBD5E1' : 'transparent'}`, background: isActive ? WHITE : 'transparent', color: isActive ? TEXT1 : TEXT3, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {f.label}
                                    {f.count > 0 && (
                                        <span style={{ background: f.bg, color: f.color, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{f.count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                                <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BORDER}` }}>
                                    <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto</th>
                                    <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</th>
                                    <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio</th>
                                    <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 200 }}>Nivel de Stock</th>
                                    <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                    <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '80px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: TEXT3 }}>
                                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Package size={28} color="#CBD5E1" />
                                                </div>
                                                <span style={{ fontSize: 16, fontWeight: 600, color: TEXT1 }}>No hay productos para mostrar</span>
                                                <span style={{ fontSize: 14 }}>Prueba ajustando los filtros o <span onClick={() => {setShowAdjust(true); setScanValue('');}} style={{ color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}>crea un nuevo producto</span>.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProducts.map((p, idx) => {
                                    const isOut = !p.sinStock && p.stock <= 0;
                                    const isLow = !isOut && p.stock <= p.stockMin;
                                    
                                    const stateColor = isOut ? RED : isLow ? YELLOW : GREEN;
                                    const stateBg = isOut ? '#FEF2F2' : isLow ? '#FFFBEB' : '#ECFDF5';
                                    const stateText = isOut ? '#991B1B' : isLow ? '#92400E' : '#065F46';
                                    const stateLabel = isOut ? 'Crítico' : isLow ? 'Bajo' : 'Óptimo';
                                    const rowBg = isOut ? 'rgba(239, 68, 68, 0.03)' : isLow ? 'rgba(245, 158, 11, 0.03)' : 'transparent';
                                    
                                    const percent = isOut ? 0 : Math.min(100, (p.stock / Math.max(1, p.stockMin * 2)) * 100);

                                    return (
                                        <tr key={p.id} style={{ borderBottom: idx < filteredProducts.length - 1 ? `1px solid #F1F5F9` : 'none', background: rowBg, transition: 'background 0.2s', position: 'relative' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: WHITE, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Package size={16} color={TEXT3} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT1 }}>{p.nombre}</span>
                                                        <span style={{ fontSize: 11, color: TEXT3, fontFamily: 'monospace' }}>{p.codigo || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 16px', fontSize: 13, color: TEXT2, fontWeight: 500 }}>
                                                {p.cat || 'General'}
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1 }}>{fmt(p.pv)}</div>
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 800, color: stateColor, width: 36 }}>{p.stock}</span>
                                                    <div style={{ flex: 1, maxWidth: 120, height: 6, borderRadius: 4, background: '#E2E8F0', overflow: 'hidden' }}>
                                                        <div style={{ width: `${percent}%`, height: '100%', background: stateColor, borderRadius: 4, transition: 'width 0.5s ease' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: 11, color: TEXT3 }}>Mín: {p.stockMin}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: stateBg, color: stateText }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: stateColor }}></span>
                                                    {stateLabel}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                    {/* Inline Actions */}
                                                    <button onClick={() => quickAdjust(p, -1)} title="Restar 1" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2, transition: 'all 0.15s' }} onMouseEnter={e => {e.target.style.background = '#F1F5F9'; e.target.style.color = TEXT1}}>
                                                        <Minus size={14} />
                                                    </button>
                                                    <button onClick={() => quickAdjust(p, 1)} title="Sumar 1" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2, transition: 'all 0.15s' }} onMouseEnter={e => {e.target.style.background = '#F1F5F9'; e.target.style.color = TEXT1}}>
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── ADJUST/INGRESS DRAWER (The original Flow with SaaS UI) ── */}
            {showAdjust && (
                <>
                    <div onClick={() => !confirmStep && setShowAdjust(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 100, animation: 'fadeIn 0.2s ease-out' }}></div>
                    <div style={{ position: 'fixed', top: 0, bottom: 0, right: 0, width: '100%', maxWidth: 480, background: WHITE, zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 25px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#FAFAFA' }}>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT1, margin: 0 }}>Ingreso de Mercadería</h2>
                                <p style={{ fontSize: 13, color: TEXT3, margin: '4px 0 0' }}>Escanea productos para actualizar stock</p>
                            </div>
                            <button onClick={() => setShowAdjust(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: TEXT3, padding: 6, borderRadius: 8, transition: 'all 0.15s' }} onMouseEnter={e => {e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = TEXT1}} onMouseLeave={e => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT3}}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Scanner Input */}
                            <div style={{ position: 'relative' }}>
                                <input
                                    ref={scannerRef}
                                    type="text"
                                    placeholder="📷 Escanear código o escribir nombre..."
                                    value={scanValue}
                                    onChange={e => setScanValue(e.target.value)}
                                    onKeyDown={handleScan}
                                    style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, border: `2px solid ${BORDER}`, fontSize: 14, fontWeight: 500, outline: 'none', color: TEXT1, transition: 'border-color 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                                    onFocus={e => e.target.style.borderColor = '#3B82F6'}
                                    onBlur={e => e.target.style.borderColor = BORDER}
                                    autoComplete="off"
                                />
                                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, background: '#F1F5F9', padding: '2px 6px', borderRadius: 6, color: TEXT3, fontWeight: 600 }}>ENTER</div>
                            </div>

                            {/* Pending Card */}
                            {pending && (
                                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 16 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1D4ED8', marginBottom: 8 }}>{pending.product.nombre}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, color: '#3B82F6', fontWeight: 600, marginBottom: 4 }}>Agregar stock (Cant)</label>
                                            <input ref={qtyRef} type="number" min="1" value={pending.qty} onChange={e => setPending(p => ({ ...p, qty: e.target.value }))}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); confirmPending(); }
                                                    else if (e.key === 'Enter' || e.key === 'p' || e.key === 'P') { e.preventDefault(); pvPendRef.current?.focus(); }
                                                    if (e.key === 'c' || e.key === 'C') { e.preventDefault(); pcPendRef.current?.focus(); }
                                                    if (e.key === 'Escape') cancelPending();
                                                }}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #93C5FD', fontSize: 14, fontWeight: 700 }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, color: '#3B82F6', fontWeight: 600, marginBottom: 4 }}>Precio venta</label>
                                            <input ref={pvPendRef} type="number" min="0" value={pending.pv} onChange={e => setPending(p => ({ ...p, pv: e.target.value }))}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' || e.key === 'c' || e.key === 'C') { e.preventDefault(); pcPendRef.current?.focus(); }
                                                    if (e.key === 'Escape') cancelPending();
                                                }}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #93C5FD', fontSize: 14 }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, color: '#3B82F6', fontWeight: 600, marginBottom: 4 }}>Costo compra</label>
                                            <input ref={pcPendRef} type="number" min="0" value={pending.pc} onChange={e => setPending(p => ({ ...p, pc: e.target.value }))}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') { e.preventDefault(); confirmPending(); }
                                                    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); pvPendRef.current?.focus(); }
                                                    if (e.key === 'Escape') cancelPending();
                                                }}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #93C5FD', fontSize: 14 }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={confirmPending} style={{ flex: 1, padding: '8px', background: '#2563EB', color: WHITE, border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <Check size={16} /> Confirmar
                                        </button>
                                        <button onClick={cancelPending} style={{ padding: '8px 16px', background: WHITE, color: '#3B82F6', border: '1px solid #BFDBFE', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                                    </div>
                                </div>
                            )}

                            {/* Items List */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {ingresoItems.length === 0 && !pending ? (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: TEXT3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                        <Package size={32} color="#CBD5E1" />
                                        <div style={{ fontSize: 14 }}>Escanea o busca un producto para agregarlo a la lista de ingreso.</div>
                                    </div>
                                ) : ingresoItems.map(i => (
                                    <div key={i.uid} style={{ border: `1px solid ${i.isNew ? '#FDE68A' : BORDER}`, background: i.isNew ? '#FFFBEB' : WHITE, borderRadius: 12, padding: 16, position: 'relative' }}>
                                        <button onClick={() => removeItem(i.uid)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        {i.isNew ? (
                                            <>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}><PlusCircle size={14} /> PRODUCTO NUEVO ({i.codigo})</div>
                                                <input type="text" placeholder="Nombre completo del producto" value={i.nombre} onChange={e => updateItem(i.uid, 'nombre', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #FCD34D', marginBottom: 12, fontSize: 14 }} />
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                                    <div><label style={{ fontSize: 11, fontWeight: 600, color: TEXT2 }}>Cantidad</label><input type="number" value={i.qty} onChange={e => updateItem(i.uid, 'qty', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: 6, border: `1px solid ${BORDER}` }} /></div>
                                                    <div><label style={{ fontSize: 11, fontWeight: 600, color: TEXT2 }}>P. Venta</label><input type="number" value={i.pv} onChange={e => updateItem(i.uid, 'pv', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: 6, border: `1px solid ${BORDER}` }} /></div>
                                                    <div><label style={{ fontSize: 11, fontWeight: 600, color: TEXT2 }}>Costo</label><input type="number" value={i.pc} onChange={e => updateItem(i.uid, 'pc', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: 6, border: `1px solid ${BORDER}` }} /></div>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ paddingRight: 24 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT1, marginBottom: 4 }}>{i.nombre}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: TEXT3 }}>
                                                    <span style={{ fontWeight: 700, color: GREEN, padding: '2px 8px', background: '#ECFDF5', borderRadius: 6 }}>+{i.qty} unidades</span>
                                                    <span>PV: {fmt(parseFloat(i.pv))}</span>
                                                    <span>PC: {fmt(parseFloat(i.pc))}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Confirm */}
                        {ingresoItems.length > 0 && (
                            <div style={{ padding: 24, borderTop: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                                {confirmStep ? (
                                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: `1px solid ${BORDER}` }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT1, marginBottom: 12 }}>¿Cómo registrar el egreso de caja?</div>
                                        {confirmStep === 'ask' && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                <button onClick={guardarConCostoItems} style={{ flex: '1 1 140px', padding: '10px', background: ACCENT, color: WHITE, border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Por prod. <kbd style={{ background: 'rgba(255,255,255,0.2)', padding:'0 4px', borderRadius:4 }}>C</kbd></button>
                                                <button onClick={() => { setEgresoImporte(''); setConfirmStep('egreso'); }} style={{ flex: '1 1 140px', padding: '10px', background: WHITE, color: TEXT1, border: `1px solid ${BORDER}`, borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Manual <kbd style={{ background: '#E2E8F0', padding:'0 4px', borderRadius:4 }}>T</kbd></button>
                                                <button onClick={guardarSinCosto} style={{ flex: '1 1 140px', padding: '10px', background: WHITE, color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No registrar <kbd style={{ background: '#E2E8F0', padding:'0 4px', borderRadius:4 }}>N</kbd></button>
                                            </div>
                                        )}
                                        {confirmStep === 'egreso' && (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <input ref={egresoRef} type="number" value={egresoImporte} onChange={e => setEgresoImporte(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ejecutarGuardado(egresoImporte); if (e.key === 'Escape') setConfirmStep('ask'); }} placeholder={String(totalCosto)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700 }} />
                                                <button onClick={() => ejecutarGuardado(egresoImporte || totalCosto)} style={{ padding: '0 16px', background: ACCENT, color: WHITE, border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                                            </div>
                                        )}
                                        <div style={{ fontSize: 11, color: TEXT3, textAlign: 'center', marginTop: 12 }}>Presiona ESC para cancelar flujo actual</div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 14, fontWeight: 700, background: '#F8FAFC', padding: '12px 16px', borderRadius: 8, border: `1px solid ${BORDER}` }}>
                                            <span style={{ color: TEXT1 }}>Costo a restar de caja:</span>
                                            <span style={{ fontSize: 18, color: GREEN }}>{fmt(totalCosto)}</span>
                                        </div>
                                        <button onClick={guardarIngreso} style={{ width: '100%', padding: '14px', background: ACCENT, color: WHITE, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            Confirmar Ingreso de {ingresoItems.length} items <kbd style={{ background: 'rgba(255,255,255,0.2)', padding:'2px 6px', borderRadius:4, fontSize: 11 }}>Enter</kbd>
                                        </button>
                                        <div style={{ fontSize: 12, color: TEXT3, marginTop: 16, lineHeight: 1.5 }}>
                                            <div style={{ marginBottom: 4 }}>Con <strong>Enter</strong> en vacío se toma el costo total automático.</div>
                                            <div style={{ fontWeight: 600 }}>Si querés otra opción, tipeá una letra + Enter:</div>
                                            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontWeight: 700 }}>
                                                <span onClick={() => {setScanValue(''); setConfirmStep('egreso');}} style={{ cursor: 'pointer', color: '#10B981', background: '#ECFDF5', padding: '4px 8px', borderRadius: 6 }}>[ M ] Monto Manual</span>
                                                <span onClick={guardarSinCosto} style={{ cursor: 'pointer', color: '#EF4444', background: '#FEF2F2', padding: '4px 8px', borderRadius: 6 }}>[ N ] No restar caja</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            <style>{`
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
