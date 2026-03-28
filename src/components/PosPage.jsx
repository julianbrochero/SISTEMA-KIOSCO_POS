import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import {
    ShoppingCart, CreditCard, Banknote, Smartphone, CheckCircle,
    Search, Percent, Printer, Plus, X, Minus, Trash2,
    Zap, DollarSign, AlertTriangle, Tag, Hash
} from 'lucide-react';

export default function PosPage() {
    const activePage      = useStore((s) => s.activePage);
    const products        = useStore((s) => s.products);
    const cart            = useStore((s) => s.cart);
    const addToCart       = useStore((s) => s.addToCart);
    const addVarios       = useStore((s) => s.addVarios);
    const removeFromCart  = useStore((s) => s.removeFromCart);
    const changeCartQty   = useStore((s) => s.changeCartQty);
    const changeCartItemPrice = useStore((s) => s.changeCartItemPrice);
    const removeLastCartItem  = useStore((s) => s.removeLastCartItem);
    const clearCart       = useStore((s) => s.clearCart);
    const addSale         = useStore((s) => s.addSale);
    const reduceStock     = useStore((s) => s.reduceStock);
    const showToastAction = useStore((s) => s.showToastAction);
    const setActivePage   = useStore((s) => s.setActivePage);
    const setPendingScanCode = useStore((s) => s.setPendingScanCode);
    const descuento       = useStore((s) => s.descuento);
    const setDescuento    = useStore((s) => s.setDescuento);
    const cajaAbierta     = useStore((s) => s.cajaAbierta);
    const configuracion   = useStore((s) => s.configuracion);
    const currentUser     = useStore((s) => s.currentUser);

    const [filterQuery,      setFilterQuery]      = useState('');
    const [payModalOpen,     setPayModalOpen]      = useState(false);
    const [successModalOpen, setSuccessModalOpen]  = useState(false);
    const [successData,      setSuccessData]       = useState({ id: 0, method: '', total: 0, vuelto: 0, items: [] });
    const [payMethod,        setPayMethod]         = useState('Efectivo');
    const [montoRecibido,    setMontoRecibido]     = useState('');
    const [customDate,       setCustomDate]        = useState('');
    const [descuentoOpen,    setDescuentoOpen]     = useState(false);
    const [descuentoInput,   setDescuentoInput]    = useState('');
    const [variosOpen,       setVariosOpen]        = useState(false);
    const [variosInput,      setVariosInput]       = useState('');
    const [searchIndex,      setSearchIndex]       = useState(-1);

    const scannerRef   = useRef(null);
    const montoRef     = useRef(null);
    const descInputRef = useRef(null);
    const variosRef    = useRef(null);

    const subtotal       = cart.reduce((s, i) => s + (Number(i.precio) || 0) * i.qty, 0);
    const descuentoMonto = descuento > 0 ? Math.round(subtotal * descuento / 100) : 0;
    const total          = subtotal - descuentoMonto;
    const itemCount      = cart.reduce((s, i) => s + i.qty, 0);

    const quickAmounts = [500, 1000, 2000, 5000, 10000];

    useEffect(() => { if (activePage === 'pos') setTimeout(() => scannerRef.current?.focus(), 50); }, [activePage]);
    useEffect(() => { if (descuentoOpen) setTimeout(() => descInputRef.current?.focus(), 50); }, [descuentoOpen]);
    useEffect(() => { if (variosOpen) setTimeout(() => variosRef.current?.focus(), 50); }, [variosOpen]);

    useEffect(() => {
        if (activePage !== 'pos') return;
        let keys = '', lastTime = Date.now();
        const handleKeyDown = (e) => {
            if (successModalOpen) return;
            const now = Date.now();
            if (now - lastTime > 50) keys = '';
            lastTime = now;
            if (!payModalOpen && e.key.length === 1) keys += e.key;
            if (!payModalOpen && e.key === 'Enter' && keys.length > 4 && /^\d+$/.test(keys)) {
                e.preventDefault(); addByBarcode(keys.trim()); keys = ''; return;
            }
            if (payModalOpen) {
                if (e.key === 'Escape') { e.preventDefault(); setPayModalOpen(false); return; }
                if (document.activeElement.tagName === 'INPUT') return;
                const methods = ['Efectivo','Débito','Crédito','QR','Transferencia','Fiado'];
                if (['1','2','3','4','5','6'].includes(e.key)) { e.preventDefault(); setPayMethod(methods[parseInt(e.key)-1]); }
                if (e.key === 'Enter') { e.preventDefault(); if (payMethod === 'Efectivo' && !montoRecibido) { setMontoRecibido(String(total)); confirmSale(true); } else confirmSale(); }
                return;
            }
            if (e.key === 'F3') { e.preventDefault(); setVariosOpen(o => !o); setDescuentoOpen(false); return; }
            if (descuentoOpen || variosOpen) return;
            if (e.key === 'F1') { e.preventDefault(); directPay('Efectivo'); }
            if (e.key === 'F2') { e.preventDefault(); openPayModal(); }
            if (e.key === 'Delete') { e.preventDefault(); removeLastCartItem(); }
            if (e.key === '+') { e.preventDefault(); if (cart.length > 0) { const l = cart[cart.length-1]; const p = products.find(x => x.id === l.id); changeCartQty(l.id, 1, p ? p.stock : 999); } }
            if (e.key === '-') { e.preventDefault(); if (cart.length > 0) { const l = cart[cart.length-1]; const p = products.find(x => x.id === l.id); changeCartQty(l.id, -1, p ? p.stock : 999); } }
            if (e.key === 'Escape') { e.preventDefault(); if (cart.length > 0 && window.confirm('¿Cancelar venta?')) cancelSale(); else { cancelSale(); scannerRef.current?.focus(); } }
            if (e.key === 'Enter' && document.activeElement !== scannerRef.current && cart.length > 0) { e.preventDefault(); openPayModal(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePage, cart, payModalOpen, successModalOpen, total, payMethod, montoRecibido, descuentoOpen, variosOpen]);

    const openPayModal = () => {
        if (cart.length === 0) return;
        if (!cajaAbierta) { showToastAction('!', 'Abrí la caja primero', 'warn'); return; }
        setPayMethod('Efectivo'); setMontoRecibido(''); setCustomDate(''); setPayModalOpen(true);
        setTimeout(() => montoRef.current?.focus(), 100);
    };
    const directPay = (method) => {
        if (cart.length === 0) return;
        if (!cajaAbierta) { showToastAction('!', 'Abrí la caja primero', 'warn'); return; }
        confirmSale(true, method);
    };
    const filteredProducts = filterQuery.trim().length > 1
        ? products.filter(p =>
            p.nombre.toLowerCase().includes(filterQuery.toLowerCase()) ||
            (p.codigo && p.codigo.toLowerCase().includes(filterQuery.toLowerCase()))
          ).slice(0, 8)
        : [];

    const addProductToCart = (p) => {
        if (p.stock <= 0) { showToastAction('!', `${p.nombre} sin stock`, 'error'); return; }
        const ex = cart.find(i => i.id === p.id);
        if (ex && ex.qty >= p.stock) { showToastAction('!', 'Stock insuficiente', 'warn'); return; }
        addToCart(p); setFilterQuery(''); setSearchIndex(-1);
    };

    const addByBarcode = (code) => {
        code = code.trim(); if (!code) return;
        const p = products.find(x => x.codigo === code || x.nombre.toLowerCase().includes(code.toLowerCase()));
        if (!p) {
            if (/^\d+$/.test(code)) { showToastAction('!', 'Código nuevo, agregá el producto', 'warn'); setPendingScanCode(code); setActivePage('productos'); }
            else showToastAction('!', 'Producto no encontrado', 'warn');
            return;
        }
        addProductToCart(p);
    };
    const handleScannerKey = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(i => Math.min(i + 1, filteredProducts.length - 1)); return; }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setSearchIndex(i => Math.max(i - 1, -1)); return; }
        if (e.key === 'Escape')    { e.preventDefault(); setFilterQuery(''); setSearchIndex(-1); return; }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchIndex >= 0 && filteredProducts[searchIndex]) { addProductToCart(filteredProducts[searchIndex]); }
            else if (filterQuery.trim()) { addByBarcode(filterQuery); }
            else if (cart.length > 0) { openPayModal(); }
            setSearchIndex(-1);
        }
    };
    const cancelSale = () => { clearCart(); setFilterQuery(''); setSearchIndex(-1); setDescuento(0); setDescuentoOpen(false); setVariosOpen(false); scannerRef.current?.focus(); };
    const applyDescuento = () => { const v = Math.max(0, Math.min(100, parseInt(descuentoInput) || 0)); setDescuento(v); setDescuentoOpen(false); setDescuentoInput(''); };
    const handleVarios = () => {
        const monto = parseFloat(variosInput) || 0;
        if (monto <= 0) { showToastAction('!', 'Ingresá un monto válido', 'warn'); return; }
        addVarios(monto); setVariosOpen(false); setVariosInput('');
        showToastAction('✓', `Cobro $${monto.toLocaleString()} agregado`, 'success');
    };
    const confirmSale = (exactPayment = false, overrideMethod = null) => {
        const method   = overrideMethod || payMethod;
        const noChange = method !== 'Efectivo';
        const isExact  = exactPayment === true || overrideMethod != null;
        const recibido = noChange || isExact ? total : parseFloat(montoRecibido) || 0;
        if (!noChange && !isExact && recibido < total) { showToastAction('!', 'Monto insuficiente', 'error'); return; }
        const vuelto = noChange || isExact ? 0 : recibido - total;
        reduceStock(cart);
        addSale(cart, total, method, descuento, customDate ? new Date(customDate) : null);
        const { saleCounter } = useStore.getState();
        const saleId = saleCounter - 1;
        const saleItems = [...cart];
        setSuccessData({ id: saleId, method, total, vuelto, items: saleItems });
        setPayModalOpen(false); setSuccessModalOpen(true); clearCart(); setDescuento(0);
        if (configuracion.imprimirTicket) setTimeout(() => printTicket({ id: saleId, method, total, vuelto, items: saleItems }), 400);
        setTimeout(() => {
            setSuccessModalOpen(false); scannerRef.current?.focus();
            const state = useStore.getState();
            const out = state.products.filter(p => p.stock <= 0);
            const low = state.products.filter(p => p.stock <= p.stockMin && p.stock > 0);
            if (out.length) showToastAction('!', out.map(p => p.nombre).join(', ') + ' sin stock', 'error');
            else if (low.length) showToastAction('!', low.map(p => p.nombre).join(', ') + ': stock bajo', 'warn');
        }, 2000);
    };
    const printTicket = (data = successData) => {
        const cfg = useStore.getState().configuracion;
        const items = data.items || [];
        const html = `<html><head><style>
            @page{size:80mm auto;margin:4mm}body{font-family:'Courier New',monospace;font-size:12px;width:72mm;margin:0}
            .c{text-align:center}.b{font-weight:bold}.d{border-top:1px dashed #000;margin:4px 0}
            .r{display:flex;justify-content:space-between}.t{font-size:16px;font-weight:bold;margin-top:4px}.s{font-size:10px;color:#555}
        </style></head><body>
            <div class=c b style=font-size:16px;margin-bottom:4px>${cfg.nombreKiosco}</div>
            ${cfg.direccion ? `<div class=c s>${cfg.direccion}</div>` : ''}
            ${cfg.telefono  ? `<div class=c s>${cfg.telefono}</div>`  : ''}
            <div class=d></div>
            <div class=r><span>Ticket #${data.id}</span><span>${new Date().toLocaleString('es-AR')}</span></div>
            <div class=r s><span>Cajero: ${currentUser?.nombre || '-'}</span><span>Pago: ${data.method}</span></div>
            <div class=d></div>
            ${items.map(i => `<div class=r><span>${i.nombre}</span><span>${i.qty > 1 ? `${i.qty}x$${Number(i.precio).toLocaleString('es-AR')} ` : ''}$${(Number(i.precio)*i.qty).toLocaleString('es-AR')}</span></div>`).join('')}
            <div class=d></div>
            <div class=r t><span>TOTAL</span><span>$${data.total.toLocaleString('es-AR')}</span></div>
            ${data.vuelto > 0 ? `<div class=r><span>Vuelto</span><span>$${data.vuelto.toLocaleString('es-AR')}</span></div>` : ''}
            <div class=d></div><div class=c s style=margin-top:8px>¡Gracias!</div><br/><br/>
        </body></html>`;
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:1px;border:0;';
        document.body.appendChild(iframe);
        iframe.contentDocument.open(); iframe.contentDocument.write(html); iframe.contentDocument.close();
        iframe.contentWindow.onafterprint = () => document.body.removeChild(iframe);
        setTimeout(() => iframe.contentWindow.print(), 300);
    };

    if (activePage !== 'pos') return null;

    const payMethods = [
        { label: 'Efectivo',      icon: <Banknote size={16} />,    key: '1' },
        { label: 'Débito',        icon: <CreditCard size={16} />,  key: '2' },
        { label: 'Crédito',       icon: <CreditCard size={16} />,  key: '3' },
        { label: 'QR',            icon: <Smartphone size={16} />,  key: '4' },
        { label: 'Transferencia', icon: <Banknote size={16} />,    key: '5' },
        { label: 'Fiado',         icon: <CheckCircle size={16} />, key: '6' },
    ];

    return (
        <div className="page active" id="page-pos" style={{ background: '#f4f4f6', overflow: 'hidden', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* ”€”€ Caja cerrada aviso ”€”€ */}
            {!cajaAbierta && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#b91c1c', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13} /> Caja cerrada — no podés cobrar hasta abrirla</div>
                    <button className="pos-open-caja-btn" onClick={() => setActivePage('caja')}>Abrir caja</button>
                </div>
            )}

            {/* •• Panel único: Carrito full-width •••••••••••••••••••••• */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 20, border: '1px solid #ebebeb', boxShadow: '0 4px 20px rgba(36,40,52,0.08)', overflow: 'hidden' }}>

                {/* Header: título + buscador a lo largo */}
                <div style={{ padding: '14px 22px 12px', borderBottom: '1px solid #f0f0f2', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShoppingCart size={15} color="#2D2D2A" />
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#242834' }}>Orden actual</span>
                            {cart.length > 0 && (
                                <span style={{ background: 'rgba(45,45,42,0.1)', color: '#2D2D2A', borderRadius: 20, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>
                                    {itemCount} ítem{itemCount !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {cart.length > 0 && (
                            <button className="pos-cancel-btn" onClick={cancelSale}><X size={12} /> Cancelar</button>
                        )}
                    </div>
                    {/* Buscador / escáner full-width */}
                    <div className="pos-scanner-wrap" style={{ maxWidth: 'none' }}>
                        <Search size={13} className="pos-scanner-icon" />
                        <input
                            ref={scannerRef}
                            type="text"
                            className="pos-scanner-input"
                            placeholder="Buscar o escanear producto..."
                            value={filterQuery}
                            onChange={e => {
                                setFilterQuery(e.target.value);
                                setSearchIndex(-1);
                                if (e.target.value.length > 5 && /^\d+$/.test(e.target.value))
                                    setTimeout(() => addByBarcode(e.target.value), 200);
                            }}
                            onKeyDown={handleScannerKey}
                            autoComplete="off"
                        />
                        {filterQuery && (
                            <button className="pos-scanner-clear" onClick={() => { setFilterQuery(''); setSearchIndex(-1); scannerRef.current?.focus(); }}><X size={13} /></button>
                        )}
                        {filteredProducts.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden' }}>
                                {filteredProducts.map((p, i) => (
                                    <div key={p.id}
                                        onMouseDown={e => { e.preventDefault(); addProductToCart(p); }}
                                        onMouseEnter={() => setSearchIndex(i)}
                                        style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', cursor: 'pointer', gap: 10, background: i === searchIndex ? '#f0edff' : '#fff', borderBottom: i < filteredProducts.length - 1 ? '1px solid #f5f5f7' : 'none', transition: 'background 0.1s' }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#242834', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                                            {p.codigo && <div style={{ fontSize: 10, color: '#bbb' }}>{p.codigo}</div>}
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#2D2D2A', flexShrink: 0 }}>${Number(p.precio).toLocaleString()}</div>
                                        {p.stock <= 3 && <div style={{ fontSize: 10, color: p.stock <= 0 ? '#ef4444' : '#f59e0b', flexShrink: 0 }}>stock {p.stock}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filas del carrito */}
                <div style={{ flex: 1, overflowY: 'auto', padding: cart.length > 0 ? '10px 14px' : 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cart.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 30 }}>
                            <ShoppingCart size={48} strokeWidth={1} style={{ opacity: 0.07, color: '#242834' }} />
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#bbb' }}>Sin productos en la orden</span>
                            <span style={{ fontSize: 12, color: '#ccc' }}>Buscá o escaneá un producto arriba</span>
                        </div>
                    ) : (
                        cart.map((item, idx) => {
                            const p = products.find(x => x.id === item.id);
                            return (
                                <div key={item.id}
                                    style={{ background: '#fff', border: '1.5px solid #edf0f5', borderRadius: 14, padding: '12px 14px', boxShadow: '0 1px 4px rgba(15,17,23,0.05)', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d9e8'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(15,17,23,0.09)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#edf0f5'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,17,23,0.05)'; }}>

                                    {/* Fila superior: número + nombre + código + eliminar */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                                        <span style={{ fontSize: 11, color: '#d1d5db', fontWeight: 700, marginTop: 3, flexShrink: 0, minWidth: 16 }}>{idx + 1}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.nombre}
                                            </div>
                                            {p?.codigo && (
                                                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Hash size={10} /> {p.codigo}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)}
                                            style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4c8d2', transition: 'all 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#c4c8d2'; e.currentTarget.style.background = '#f3f4f6'; }}>
                                            <X size={13} />
                                        </button>
                                    </div>

                                    {/* Fila inferior: precio + cantidad + subtotal */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                                        {/* Label precio */}
                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>Precio</span>

                                        {/* Input precio */}
                                        <div style={{ position: 'relative', width: 110, flexShrink: 0 }}>
                                            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af', fontWeight: 700, pointerEvents: 'none' }}>$</span>
                                            <input
                                                type="number"
                                                value={item.precio}
                                                onChange={e => changeCartItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                                onWheel={e => e.currentTarget.blur()}
                                                style={{ width: '100%', paddingLeft: 20, paddingRight: 8, height: 36, border: '1.5px solid #e5e7eb', borderRadius: 9, background: '#f8fafc', color: '#111827', fontSize: 16, fontWeight: 800, textAlign: 'right', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', MozAppearance: 'textfield', transition: 'all 0.15s', fontVariantNumeric: 'tabular-nums' }}
                                                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                                                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>

                                        {/* Cantidad */}
                                        <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: 10, border: '1.5px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                                            <button
                                                onClick={() => changeCartQty(item.id, -1, p ? p.stock : 999)}
                                                style={{ width: 34, height: 34, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'background 0.1s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <Minus size={14} />
                                            </button>
                                            <span style={{ minWidth: 36, textAlign: 'center', fontSize: 17, fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{item.qty}</span>
                                            <button
                                                onClick={() => changeCartQty(item.id, 1, p ? p.stock : 999)}
                                                disabled={item.qty >= (p ? p.stock : 999)}
                                                style={{ width: 34, height: 34, border: 'none', background: 'transparent', cursor: item.qty >= (p ? p.stock : 999) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.qty >= (p ? p.stock : 999) ? '#d1d5db' : '#6b7280', transition: 'background 0.1s' }}
                                                onMouseEnter={e => { if (item.qty < (p ? p.stock : 999)) e.currentTarget.style.background = '#e5e7eb'; }}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        {/* Subtotal */}
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 1 }}>Total</div>
                                            <div style={{ fontSize: 19, fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                                                ${(Number(item.precio) * item.qty).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer: widgets + totales + cobrar */}
                <div style={{ borderTop: '1px solid #f0f0f2', padding: '16px 22px', background: '#fafafa', flexShrink: 0 }}>

                    {descuentoOpen && (
                        <div className="pos-widget warn" style={{ marginBottom: 12 }}>
                            <div className="pos-widget-title">Descuento (%)</div>
                            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                                {[5, 10, 15, 20].map(v => (
                                    <button key={v} className={`pos-preset-btn ${descuentoInput === String(v) ? 'active' : ''}`}
                                        onClick={() => setDescuentoInput(String(v))}>{v}%</button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <input ref={descInputRef} type="number" min={0} max={100} value={descuentoInput}
                                    onChange={e => setDescuentoInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') applyDescuento(); if (e.key === 'Escape') setDescuentoOpen(false); }}
                                    placeholder="%" className="pos-widget-input" />
                                <button onClick={applyDescuento} className="pos-widget-ok">OK</button>
                                <button onClick={() => { setDescuentoOpen(false); setDescuentoInput(''); }} className="pos-widget-x"><X size={13} /></button>
                            </div>
                        </div>
                    )}

                    {variosOpen && (
                        <div className="pos-widget info" style={{ marginBottom: 12 }}>
                            <div className="pos-widget-title">Cobro general / Varios</div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#9ca3af', fontSize: 14 }}>$</span>
                                    <input ref={variosRef} type="number" min={1} value={variosInput}
                                        onChange={e => setVariosInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); handleVarios(); } if (e.key === 'Escape') { e.stopPropagation(); setVariosOpen(false); } }}
                                        placeholder="0" className="pos-widget-input" style={{ paddingLeft: 24 }} />
                                </div>
                                <button onClick={handleVarios} className="pos-widget-ok info-ok">+ Agregar</button>
                                <button onClick={() => { setVariosOpen(false); setVariosInput(''); }} className="pos-widget-x"><X size={13} /></button>
                            </div>
                        </div>
                    )}

                    {cart.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb', marginBottom: 6 }}>
                                <span>{cart.length} prod · {itemCount} unidades</span>
                                <span>Subtotal ${subtotal.toLocaleString()}</span>
                            </div>
                            {descuento > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 6, padding: '5px 0', borderBottom: '1px dashed #e8e8e8' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Percent size={10} /> Descuento {descuento}%
                                        <button onClick={() => setDescuento(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 0 }}><X size={10} /></button>
                                    </span>
                                    <span style={{ color: '#ef4444', fontWeight: 600 }}>-${descuentoMonto.toLocaleString()}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTop: '1.5px solid #ebebeb' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
                                <span style={{ fontSize: 30, fontWeight: 800, color: '#242834', letterSpacing: '-1.5px', lineHeight: 1 }}>${total.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    <button className="pos-pay-btn" disabled={cart.length === 0} onClick={openPayModal}>
                        <CreditCard size={16} />
                        {cart.length === 0 ? 'Cobrar' : `Cobrar $${total.toLocaleString()}`}
                    </button>

                    <div className="pos-sec-btns" style={{ marginTop: 8 }}>
                        <button className="pos-sec-btn" disabled={cart.length === 0} onClick={() => directPay('Efectivo')}>
                            <Banknote size={12} /> F1 Efectivo
                        </button>
                        <button className={`pos-sec-btn ${descuentoOpen ? 'warn-active' : ''}`} disabled={cart.length === 0}
                            onClick={() => { if (cart.length === 0) return; setDescuentoOpen(o => !o); setVariosOpen(false); }}>
                            <Percent size={12} /> {descuento > 0 ? `${descuento}%` : 'Descuento'}
                        </button>
                        <button className={`pos-sec-btn ${variosOpen ? 'info-active' : ''}`}
                            onClick={() => { setVariosOpen(o => !o); setDescuentoOpen(false); }}>
                            <DollarSign size={12} /> F3 Varios
                        </button>
                    </div>

                    <div className="pos-kbd-hints" style={{ marginTop: 8 }}>
                        {[['F1','Efectivo'],['F2','Cobrar'],['F3','Varios'],['DEL','Quitar'],['ESC','Cancelar']].map(([k, v]) => (
                            <span key={k} className="pos-kbd-hint"><kbd>{k}</kbd>{v}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ”€”€ MODAL COBRAR ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
            <div className={`modal-overlay ${payModalOpen ? 'open' : ''}`}>
                <div className="modal" style={{ width: 'min(430px, 96vw)' }}>
                    <div className="modal-title"><CreditCard size={20} /> Cobrar Orden</div>

                    <div className="pos-modal-total">
                        <div className="pos-modal-total-label">Total a cobrar</div>
                        <div className="pos-modal-total-amount">${total.toLocaleString()}</div>
                        <div className="pos-modal-total-sub">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}{descuento > 0 ? ` · ${descuento}% desc.` : ''}</div>
                    </div>

                    <div className="pos-pay-methods">
                        {payMethods.map(({ label, icon, key }) => (
                            <button key={label} className={`pos-pay-method-btn ${payMethod === label ? 'active' : ''}`}
                                onClick={() => setPayMethod(label)}>
                                {icon}<span>{label}</span>
                                <span className="pos-pay-method-key">{key}</span>
                            </button>
                        ))}
                    </div>

                    {payMethod === 'Efectivo' && (
                        <div className="pos-cash-section">
                            <div className="pos-quick-amounts">
                                {quickAmounts.map(amt => (
                                    <button key={amt} className={`pos-quick-amt ${montoRecibido === String(amt) ? 'active' : ''}`}
                                        onClick={() => setMontoRecibido(String(amt))}>
                                        ${amt >= 1000 ? `${amt/1000}k` : amt}
                                    </button>
                                ))}
                                <button className="pos-quick-exact" onClick={() => setMontoRecibido(String(total))}>
                                    <Zap size={11} /> Exacto
                                </button>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Monto recibido</label>
                                <input ref={montoRef} type="number" className="form-control"
                                    value={montoRecibido}
                                    onChange={e => setMontoRecibido(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { if (!montoRecibido) { setMontoRecibido(String(total)); confirmSale(true); } else confirmSale(); } }}
                                    style={{ fontSize: 22, fontWeight: 700, textAlign: 'right' }} />
                            </div>
                            {parseFloat(montoRecibido) >= total && (
                                <div className="pos-vuelto">
                                    <span>Vuelto</span>
                                    <span className="pos-vuelto-num">${(parseFloat(montoRecibido) - total).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pos-date-row">
                        <span className="pos-date-label">Fecha</span>
                        <input type="datetime-local" value={customDate} onChange={e => setCustomDate(e.target.value)} className="pos-date-input" />
                    </div>

                    <div className="modal-actions">
                        <button className="btn-modal-cancel" onClick={() => setPayModalOpen(false)}>Cancelar</button>
                        <button className="btn-modal-confirm" onClick={() => confirmSale()}>œ“ Confirmar Cobro</button>
                    </div>
                </div>
            </div>

            {/* ”€”€ MODAL é‰XITO ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€ */}
            <div className={`modal-overlay ${successModalOpen ? 'open' : ''}`}>
                <div className="modal" style={{ width: 'min(360px, 96vw)', textAlign: 'center', position: 'relative' }}>
                    <button onClick={() => setSuccessModalOpen(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', lineHeight: 0 }}>
                        <X size={18} />
                    </button>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <CheckCircle size={28} style={{ color: 'var(--success)' }} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>¡Cobro Exitoso!</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Orden #{successData.id} · {successData.method}</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent2)', marginBottom: 10, lineHeight: 1 }}>${successData.total?.toLocaleString()}</div>
                    {successData.vuelto > 0 && (
                        <div style={{ background: 'var(--success-dim)', border: '1px solid #86efac', borderRadius: 8, padding: '8px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--success-text)', fontWeight: 600 }}>Vuelto</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--success-text)' }}>${successData.vuelto?.toLocaleString()}</span>
                        </div>
                    )}
                    {successData.items?.length > 0 && (
                        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12, textAlign: 'left', maxHeight: 130, overflowY: 'auto' }}>
                            {successData.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: i < successData.items.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12 }}>
                                    <span style={{ color: 'var(--text2)' }}>{item.qty > 1 ? `${item.qty}é— ` : ''}{item.nombre}</span>
                                    <span style={{ fontWeight: 700 }}>${(item.precio * item.qty).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <button onClick={() => printTicket()} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text2)', fontFamily: 'var(--body)' }}>
                        <Printer size={15} /> Imprimir Comprobante
                    </button>
                </div>
            </div>
        </div>
    );
}


