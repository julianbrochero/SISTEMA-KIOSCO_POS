import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Package, Trash2, PlusCircle, Check, X } from 'lucide-react';
import { fmt } from '../utils';

export default function StockPage() {
    const activePage      = useStore(s => s.activePage);
    const products        = useStore(s => s.products);
    const addProduct      = useStore(s => s.addProduct);
    const updateProduct   = useStore(s => s.updateProduct);
    const addStock        = useStore(s => s.addStock);
    const registrarMovimiento = useStore(s => s.registrarMovimiento);
    const showToastAction = useStore(s => s.showToastAction);

    const [scanValue,      setScanValue]      = useState('');
    const [pending,        setPending]        = useState(null);
    const [ingresoItems,   setIngresoItems]   = useState([]);
    const [confirmStep,    setConfirmStep]    = useState(false); // false | 'ask' | 'egreso'
    const [egresoImporte,  setEgresoImporte]  = useState('');
    const [mobileTab,      setMobileTab]      = useState('ingreso');

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

    // Keyboard confirm step
    useEffect(() => {
        if (!confirmStep) return;
        const handler = (e) => {
            if (confirmStep === 'ask') {
                if (e.key === 'c' || e.key === 'C') { e.preventDefault(); guardarConCostoItems(); }
                if (e.key === 't' || e.key === 'T') { e.preventDefault(); setConfirmStep('egreso'); }
                if (e.key === 'n' || e.key === 'N') { e.preventDefault(); guardarSinCosto(); }
                if (e.key === 'Escape')             { e.preventDefault(); setConfirmStep(false); setTimeout(() => scannerRef.current?.focus(), 50); }
            }
            if (confirmStep === 'egreso' && e.key === 'Escape') {
                e.preventDefault();
                setConfirmStep('ask');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [confirmStep, ingresoItems]);

    const scannerRef  = useRef(null);
    const qtyRef      = useRef(null);
    const pvPendRef   = useRef(null);
    const pcPendRef   = useRef(null);
    const egresoRef   = useRef(null);

    useEffect(() => {
        if (confirmStep === 'egreso') setTimeout(() => egresoRef.current?.focus(), 50);
    }, [confirmStep]);

    // Focus automático al entrar a la página
    useEffect(() => {
        if (activePage === 'stock') {
            setTimeout(() => scannerRef.current?.focus(), 150);
        }
    }, [activePage]);

    if (activePage !== 'stock') return null;

    const lowProds  = products.filter(p => p.stock <= p.stockMin);

    // ── Lógica de escaneo / búsqueda ──────────────────────────────────────
    const handleScan = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const val = scanValue.trim();
        // Enter vacío con ítems → iniciar flujo de guardado
        if (!val && ingresoItems.length > 0 && !pending) { setConfirmStep('ask'); return; }
        if (!val) return;

        // Busca por código exacto primero, después por nombre
        const found = products.find(x => x.codigo === val)
            || products.find(x => x.nombre.toLowerCase().includes(val.toLowerCase()));

        if (found) {
            setPending({ product: found, qty: '', pv: String(found.pv), pc: String(found.pc) });
            setScanValue('');
            // Focus en qty tras render
            setTimeout(() => qtyRef.current?.focus(), 80);
        } else {
            // Producto nuevo
            setIngresoItems(prev => [...prev, {
                uid: Date.now() + Math.random(),
                id: null, isNew: true,
                codigo: val, nombre: '', pv: '', pc: '', qty: '', stockActual: 0,
            }]);
            setScanValue('');
            showToastAction('ℹ️', 'Producto nuevo – completá nombre y precios', 'info');
        }
    };

    // ── Confirmar producto pendiente ───────────────────────────────────────
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

    const updateItem = (uid, field, value) =>
        setIngresoItems(prev => prev.map(i => i.uid === uid ? { ...i, [field]: value } : i));

    const removeItem = (uid) =>
        setIngresoItems(prev => prev.filter(i => i.uid !== uid));

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
        setTimeout(() => scannerRef.current?.focus(), 100);
    };

    const guardarIngreso = () => { setConfirmStep('ask'); };

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="page active" id="page-stock">

            {/* Toolbar */}
            <div className="page-toolbar">
                <span className="page-title">Control de Stock</span>
                <div className="stock-mobile-tabs">
                    <button
                        className={`stock-mobile-tab ${mobileTab === 'ingreso' ? 'active' : ''}`}
                        onClick={() => setMobileTab('ingreso')}
                    >
                        Ingreso {ingresoItems.length > 0 && <span className="stock-tab-badge">{ingresoItems.length}</span>}
                    </button>
                    <button
                        className={`stock-mobile-tab ${mobileTab === 'alertas' ? 'active' : ''}`}
                        onClick={() => setMobileTab('alertas')}
                    >
                        Alertas {lowProds.length > 0 && <span className="stock-tab-badge stock-tab-badge-warn">{lowProds.length}</span>}
                    </button>
                </div>
            </div>

            <div className="stock-panels">

                {/* ══ PANEL IZQUIERDO – Alertas ══════════════════════════════ */}
                <div className={`stock-panel-wrap stock-panel-alertas ${mobileTab !== 'alertas' ? 'stock-panel-mobile-hidden' : ''}`}>
                    <div className="stock-left">
                        <div className="section-header">
                            Alertas de Stock
                            {lowProds.length > 0 && <div className="alert-count">{lowProds.length}</div>}
                        </div>
                        <div className="alerts-list">
                            {lowProds.length === 0
                                ? <div className="stock-empty">✅ Sin alertas de stock</div>
                                : lowProds.map(p => {
                                    const isOut = p.stock <= 0;
                                    return (
                                        <div className={`alert-card ${isOut ? 'alert-out' : 'alert-low'}`} key={p.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                <div className="alert-title">
                                                    <Package size={14} style={{ flexShrink: 0 }} />
                                                    {p.nombre}
                                                </div>
                                                <span className={`alert-badge ${isOut ? 'badge-danger' : 'badge-warn'}`}>
                                                    {isOut ? 'SIN STOCK' : 'BAJO'}
                                                </span>
                                            </div>
                                            <div className="alert-meta">
                                                Stock: <b>{p.stock}</b> u · Mín: {p.stockMin} u · {p.proveedor}
                                            </div>
                                        </div>
                                    );
                            })}
                        </div>
                    </div>
                </div>

                {/* ══ PANEL DERECHO – Ingreso ════════════════════════════════ */}
                <div className={`stock-panel-wrap stock-panel-ingreso ${mobileTab !== 'ingreso' ? 'stock-panel-mobile-hidden' : ''}`}>
                    <div className="stock-right">
                        <div className="section-header">⬆ Ingreso de Mercadería</div>

                        {/* Scanner */}
                        <div className="stock-scanner-wrap">
                            <input
                                ref={scannerRef}
                                type="text"
                                className="stock-scanner-input"
                                placeholder="📷  Escanear código o escribir nombre del producto..."
                                value={scanValue}
                                onChange={e => setScanValue(e.target.value)}
                                onKeyDown={handleScan}
                                autoComplete="off"
                            />
                        </div>

                        {/* ── Panel producto encontrado ── */}
                        {pending && (
                            <div className="pending-card">
                                <div className="pending-card-info">
                                    <div className="pending-card-name">{pending.product.nombre}</div>
                                    <div className="pending-card-meta">
                                        <span>Código: <code>{pending.product.codigo}</code></span>
                                        <span>Precio actual: <b style={{ color: 'var(--accent2)' }}>{fmt(pending.product.pv)}</b></span>
                                        <span>Stock: <b style={{
                                            color: pending.product.stock <= 0 ? 'var(--danger)'
                                                : pending.product.stock <= pending.product.stockMin ? 'var(--warn)'
                                                    : 'var(--text)'
                                        }}>{pending.product.stock} u</b></span>
                                    </div>
                                </div>
                                <div className="pending-card-fields">
                                    <div className="pending-field">
                                        <label>Agregar stock</label>
                                        <input
                                            ref={qtyRef}
                                            type="number"
                                            min="1"
                                            className="pending-input pending-input-qty"
                                            placeholder="Cantidad"
                                            value={pending.qty}
                                            onChange={e => setPending(p => ({ ...p, qty: e.target.value }))}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') { e.preventDefault(); confirmPending(); }
                                                if (e.key === 'p' || e.key === 'P') { e.preventDefault(); pvPendRef.current?.focus(); }
                                                if (e.key === 'c' || e.key === 'C') { e.preventDefault(); pcPendRef.current?.focus(); }
                                                if (e.key === 'Escape') cancelPending();
                                            }}
                                        />
                                    </div>
                                    <div className="pending-field">
                                        <label>Precio venta <span style={{ fontWeight: 400, opacity: 0.6 }}>(P)</span></label>
                                        <input
                                            ref={pvPendRef}
                                            type="number"
                                            min="0"
                                            className="pending-input"
                                            placeholder={`Actual: ${fmt(pending.product.pv)}`}
                                            value={pending.pv}
                                            onChange={e => setPending(p => ({ ...p, pv: e.target.value }))}
                                            onKeyDown={e => {
                                                if (e.key === 'c' || e.key === 'C') { e.preventDefault(); pcPendRef.current?.focus(); }
                                                if (e.key === 'Enter') { e.preventDefault(); confirmPending(); }
                                                if (e.key === 'Escape') cancelPending();
                                            }}
                                        />
                                    </div>
                                    <div className="pending-field">
                                        <label>Costo compra <span style={{ fontWeight: 400, opacity: 0.6 }}>(C)</span></label>
                                        <input
                                            ref={pcPendRef}
                                            type="number"
                                            min="0"
                                            className="pending-input"
                                            placeholder={`Actual: ${fmt(pending.product.pc || 0)}`}
                                            value={pending.pc}
                                            onChange={e => setPending(p => ({ ...p, pc: e.target.value }))}
                                            onKeyDown={e => {
                                                if (e.key === 'p' || e.key === 'P') { e.preventDefault(); pvPendRef.current?.focus(); }
                                                if (e.key === 'Enter') { e.preventDefault(); confirmPending(); }
                                                if (e.key === 'Escape') cancelPending();
                                            }}
                                        />
                                    </div>
                                    <div className="pending-card-actions">
                                        <button className="pending-btn-confirm" onClick={confirmPending}>
                                            <Check size={16} /> Agregar
                                        </button>
                                        <button className="pending-btn-cancel" onClick={cancelPending} title="Cancelar (Esc)">
                                            <X size={15} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
                                    Enter agrega directo · P cambia precio · C cambia costo · Esc cancela
                                </div>
                            </div>
                        )}

                        {/* ── Lista de items confirmados ── */}
                        <div className="ingreso-list">
                            {ingresoItems.length === 0 && !pending
                                ? <div className="stock-empty" style={{ paddingTop: 40 }}>
                                    Escanea o buscá un producto para comenzar el ingreso.
                                  </div>
                                : ingresoItems.map(i => (
                                    <div key={i.uid} className={`sitem-card ${i.isNew ? 'sitem-new' : ''}`}>
                                        <button className="sitem-remove" onClick={() => removeItem(i.uid)}>
                                            <Trash2 size={14} />
                                        </button>

                                        {i.isNew ? (
                                            /* Producto nuevo – completar datos */
                                            <>
                                                <div className="sitem-new-label">
                                                    <PlusCircle size={13} /> NUEVO · <code style={{ fontSize: 11 }}>{i.codigo}</code>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre del producto *"
                                                    value={i.nombre}
                                                    onChange={e => updateItem(i.uid, 'nombre', e.target.value)}
                                                    className="sitem-input sitem-input-nombre"
                                                />
                                                <div className="sitem-fields">
                                                    <div className="sitem-field">
                                                        <label>Precio venta</label>
                                                        <input type="number" value={i.pv} onChange={e => updateItem(i.uid, 'pv', e.target.value)} className="sitem-input" />
                                                    </div>
                                                    <div className="sitem-field">
                                                        <label>Precio costo</label>
                                                        <input type="number" value={i.pc} onChange={e => updateItem(i.uid, 'pc', e.target.value)} className="sitem-input" />
                                                    </div>
                                                    <div className="sitem-field">
                                                        <label>Cantidad *</label>
                                                        <input type="number" value={i.qty} onChange={e => updateItem(i.uid, 'qty', e.target.value)} className="sitem-input sitem-input-qty" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            /* Producto existente – resumen */
                                            <div className="sitem-existing">
                                                <div className="sitem-existing-info">
                                                    <span className="sitem-existing-name">{i.nombre}</span>
                                                    <span className="sitem-existing-meta">
                                                        Stock actual: {i.stockActual} u · Precio: {fmt(parseFloat(i.pv) || 0)} · Costo: {fmt(parseFloat(i.pc) || 0)}
                                                    </span>
                                                </div>
                                                <div className="sitem-existing-right">
                                                    <span className="sitem-existing-qty">+{i.qty} u</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                        </div>

                        {/* ── Footer guardar ── */}
                        {ingresoItems.length > 0 && (
                            <div className="ingreso-footer">
                                {confirmStep ? (
                                    <div style={{ background: '#f0edff', border: '1.5px solid #c4b5fd', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Guardar {ingresoItems.length} producto{ingresoItems.length !== 1 ? 's' : ''}</span>
                                            <span style={{ fontWeight: 400, color: '#7c3aed' }}>{fmt(totalCosto)}</span>
                                        </div>

                                        {confirmStep === 'ask' && (
                                            <>
                                                <div style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>¿Cómo querés registrar el costo?</div>
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    <button onClick={guardarConCostoItems}
                                                        style={{ flex: '1 1 180px', padding: '10px 0', borderRadius: 8, border: '1.5px solid #7c3aed', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: totalCosto > 0 ? 1 : 0.55 }}>
                                                        <kbd style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>C</kbd> Por producto
                                                    </button>
                                                    <button onClick={() => { setEgresoImporte(''); setConfirmStep('egreso'); }}
                                                        style={{ flex: '1 1 180px', padding: '10px 0', borderRadius: 8, border: '1.5px solid #c4b5fd', background: '#ede9fe', color: '#5b21b6', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                        <kbd style={{ background: 'rgba(124,58,237,0.12)', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>T</kbd> Total manual
                                                    </button>
                                                    <button onClick={guardarSinCosto}
                                                        style={{ flex: '1 1 180px', padding: '10px 0', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                        <kbd style={{ background: '#f3f4f6', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>N</kbd> No
                                                    </button>
                                                    <button onClick={() => { setConfirmStep(false); setTimeout(() => scannerRef.current?.focus(), 50); }}
                                                        style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#9ca3af', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                                        ESC
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                                    C usa la suma de los costos por producto · T carga un total manual · N guarda sin egreso
                                                </div>
                                            </>
                                        )}

                                        {confirmStep === 'egreso' && (
                                            <>
                                                <div style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>Importe del egreso</div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <div style={{ position: 'relative', flex: 1 }}>
                                                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#9ca3af', fontSize: 14 }}>$</span>
                                                        <input
                                                            ref={egresoRef}
                                                            type="number" min={0}
                                                            value={egresoImporte}
                                                            onChange={e => setEgresoImporte(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter')  { e.preventDefault(); ejecutarGuardado(egresoImporte); }
                                                                if (e.key === 'Escape') { e.preventDefault(); setConfirmStep('ask'); }
                                                            }}
                                                            placeholder={String(totalCosto)}
                                                            style={{ width: '100%', padding: '10px 10px 10px 24px', borderRadius: 8, border: '1.5px solid #7c3aed', fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'var(--body)' }}
                                                        />
                                                    </div>
                                                    <button onClick={() => ejecutarGuardado(egresoImporte || totalCosto)}
                                                        style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #7c3aed', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                                        Guardar
                                                    </button>
                                                    <button onClick={() => setConfirmStep('ask')}
                                                        style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#9ca3af', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                                        ESC
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: 11, color: '#9ca3af' }}>Enter para guardar · ESC para volver</div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    /* ── Resumen normal ── */
                                    <>
                                        <div className="ingreso-footer-row">
                                            <span style={{ color: 'var(--text3)', fontSize: 13 }}>Costo total:</span>
                                            <span style={{ fontSize: 18, fontWeight: 800 }}>{fmt(totalCosto)}</span>
                                        </div>
                                        <button className="btn-full btn-success" onClick={guardarIngreso}>
                                            ✓ GUARDAR {ingresoItems.length} REGISTRO{ingresoItems.length !== 1 ? 'S' : ''}
                                        </button>
                                        <div style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 2 }}>
                                            o presioná <kbd style={{ background: '#f3f4f6', borderRadius: 3, padding: '1px 5px', fontSize: 10, color: '#555' }}>Enter</kbd> con el buscador vacío
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
