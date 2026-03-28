import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import { Package, Pencil, Trash2 } from 'lucide-react';

export default function ProductosPage() {
    const activePage = useStore(s => s.activePage);
    const products = useStore(s => s.products);
    const addProduct = useStore(s => s.addProduct);
    const updateProduct = useStore(s => s.updateProduct);
    const deleteProduct = useStore(s => s.deleteProduct);
    const showToastAction = useStore(s => s.showToastAction);
    const pendingScanCode = useStore(s => s.pendingScanCode);
    const setPendingScanCode = useStore(s => s.setPendingScanCode);

    const [filterQuery, setFilterQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [inlineEdit, setInlineEdit] = useState(null); // { id, field, val }

    const nombreRef = useRef(null);
    const pvRef = useRef(null);
    const stockRef = useRef(null);
    const searchRef = useRef(null);

    const [form, setForm] = useState({
        nombre: '', codigo: '', cat: 'Bebidas',
        pv: '', pc: '', stock: '', stockMin: '', proveedor: '',
    });

    useEffect(() => {
        if (activePage === 'productos' && pendingScanCode) {
            openAdd();
            setForm(prev => ({ ...prev, codigo: pendingScanCode }));
            setPendingScanCode(null);
        } else if (activePage === 'productos' && !modalOpen) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [activePage, pendingScanCode, modalOpen]);

    // Scanner global (cuando el modal no está abierto)
    useEffect(() => {
        if (activePage !== 'productos' || modalOpen) return;
        let keys = '', lastTime = Date.now();

        const handleKeyDown = (e) => {
            const now = Date.now();
            if (now - lastTime > 80) keys = '';
            lastTime = now;
            if (e.key.length === 1) keys += e.key;
            else if (e.key === 'Enter' && keys.length > 4 && /^\d+$/.test(keys)) {
                e.preventDefault();
                const val = keys.trim();
                const found = products.find(p => p.codigo === val);
                if (found) {
                    setInlineEdit({ id: found.id, field: 'pv', val: String(found.pv) });
                    setFilterQuery(found.nombre);
                    showToastAction('✅', `${found.nombre} — editá el precio y presioná Enter`, 'success');
                } else {
                    openAdd();
                    setForm(prev => ({ ...prev, codigo: val }));
                    showToastAction('ℹ️', 'Código nuevo – completá los datos', 'info');
                }
                keys = '';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePage, modalOpen, products]);

    if (activePage !== 'productos') return null;

    const filtered = products.filter(p =>
        p.nombre.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (p.codigo && p.codigo.includes(filterQuery))
    );

    const openAdd = () => {
        setEditingId(null);
        setForm({ nombre: '', codigo: '', cat: 'Bebidas', pv: '', pc: '', stock: '', stockMin: '', proveedor: '' });
        setModalOpen(true);
        setTimeout(() => nombreRef.current?.focus(), 100);
    };

    const openEdit = (p) => {
        setEditingId(p.id);
        setForm({
            nombre: p.nombre, codigo: p.codigo, cat: p.cat,
            pv: String(p.pv), pc: String(p.pc),
            stock: String(p.stock), stockMin: String(p.stockMin),
            proveedor: p.proveedor || '',
        });
        setModalOpen(true);
        setTimeout(() => nombreRef.current?.focus(), 100);
    };

    const handleSave = () => {
        if (!form.nombre.trim() || !form.pv) {
            showToastAction('⚠️', 'Nombre y precio de venta son requeridos', 'warn');
            return;
        }
        const data = {
            nombre: form.nombre.trim(),
            codigo: form.codigo.trim() || String(Date.now()),
            cat: form.cat,
            pv: parseFloat(form.pv) || 0,
            pc: parseFloat(form.pc) || 0,
            stock: parseInt(form.stock) || 0,
            stockMin: parseInt(form.stockMin) || 5,
            proveedor: form.proveedor.trim(),
        };
        if (editingId) {
            updateProduct(editingId, data);
            showToastAction('✅', 'Producto actualizado');
        } else {
            addProduct(data);
            showToastAction('✅', 'Producto creado');
        }
        setModalOpen(false);
    };

    const handleDelete = (id, nombre) => {
        if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
        deleteProduct(id);
        showToastAction('🗑', 'Producto eliminado');
    };

    const startInlineEdit = (product, field) => {
        setInlineEdit({ id: product.id, field, val: String(product[field] ?? 0) });
    };

    const saveInlineEdit = (id, field) => {
        if (!inlineEdit || inlineEdit.id !== id || inlineEdit.field !== field) return;
        const val = parseFloat(inlineEdit.val);
        if (!isNaN(val) && val >= 0) {
            updateProduct(id, { [field]: val });
            showToastAction('✅', field === 'pc' ? 'Costo actualizado' : 'Precio actualizado');
        }
        setInlineEdit(null);
        setFilterQuery('');
        setTimeout(() => searchRef.current?.focus(), 50);
    };

    const cats = ['Bebidas', 'Snacks', 'Lácteos', 'Limpieza', 'Confitería', 'Almacén', 'Golosinas', 'Otros'];

    return (
        <div className="page active" id="page-productos" style={{ flexDirection: 'column' }}>
            {/* Toolbar */}
            <div className="page-toolbar">
                <span className="page-title">Productos</span>
                <input
                    type="text"
                    className="toolbar-input"
                    placeholder="Buscar por nombre o código..."
                    ref={searchRef}
                    value={filterQuery}
                    onChange={e => setFilterQuery(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            const val = e.target.value.trim();
                            if (!val) return;
                            if (/^\d+$/.test(val)) {
                                const found = products.find(p => p.codigo === val);
                                if (found) {
                                    setInlineEdit({ id: found.id, field: 'pv', val: String(found.pv) });
                                    setFilterQuery(found.nombre);
                                } else {
                                    openAdd(); setForm(prev => ({ ...prev, codigo: val }));
                                    setFilterQuery('');
                                }
                            }
                        }
                    }}
                />
                <div className="spacer" />
                <button className="toolbar-btn btn-outline" onClick={openAdd}>+ Nuevo</button>
            </div>

            {/* Tabla desktop */}
            <div className="table-wrap prod-table-wrap">
                <table className="prod-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Código</th>
                            <th>Cat.</th>
                            <th className="th-precio">
                                Precio Venta
                                <span className="th-hint">click para editar</span>
                            </th>
                            <th className="th-precio">
                                P. Costo
                                <span className="th-hint">click para editar</span>
                            </th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => {
                            const sc = p.stock <= 0 ? 'stock-out' : p.stock <= p.stockMin ? 'stock-low' : 'stock-ok';
                            const isEditingPrice = inlineEdit?.id === p.id && inlineEdit?.field === 'pv';
                            const isEditingCost = inlineEdit?.id === p.id && inlineEdit?.field === 'pc';
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <Package size={15} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 600 }}>{p.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="td-mono" style={{ color: 'var(--text3)', fontSize: 12 }}>{p.codigo}</td>
                                    <td><span className="tag tag-cat">{p.cat}</span></td>
                                    {/* Precio con edición inline */}
                                    <td
                                        className={`td-precio ${isEditingPrice ? '' : 'td-precio-click'}`}
                                        onClick={() => {
                                            if (!isEditingPrice) startInlineEdit(p, 'pv');
                                        }}
                                    >
                                        {isEditingPrice ? (
                                            <input
                                                autoFocus
                                                type="number"
                                                value={inlineEdit.val}
                                                onChange={e => setInlineEdit(v => ({ ...v, val: e.target.value }))}
                                                onBlur={() => saveInlineEdit(p.id, 'pv')}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit(p.id, 'pv'); }
                                                    if (e.key === 'Escape') setInlineEdit(null);
                                                }}
                                                onClick={e => e.stopPropagation()}
                                                className="inline-price-input"
                                            />
                                        ) : (
                                            <span className="td-precio-val">
                                                {fmt(p.pv)}
                                                <Pencil size={11} className="td-precio-icon" />
                                            </span>
                                        )}
                                    </td>
                                    <td
                                        className={`td-precio ${isEditingCost ? '' : 'td-precio-click'}`}
                                        onClick={() => {
                                            if (!isEditingCost) startInlineEdit(p, 'pc');
                                        }}
                                    >
                                        {isEditingCost ? (
                                            <input
                                                autoFocus
                                                type="number"
                                                value={inlineEdit.val}
                                                onChange={e => setInlineEdit(v => ({ ...v, val: e.target.value }))}
                                                onBlur={() => saveInlineEdit(p.id, 'pc')}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit(p.id, 'pc'); }
                                                    if (e.key === 'Escape') setInlineEdit(null);
                                                }}
                                                onClick={e => e.stopPropagation()}
                                                className="inline-price-input"
                                            />
                                        ) : (
                                            <span className="td-precio-val" style={{ color: 'var(--text2)' }}>
                                                {fmt(p.pc)}
                                                <Pencil size={11} className="td-precio-icon" />
                                            </span>
                                        )}
                                    </td>
                                    <td><span className={`stock-badge ${sc}`}>{p.stock <= 0 ? 'Sin stock' : `${p.stock} u`}</span></td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="row-btn" onClick={() => openEdit(p)}>Editar</button>
                                            <button className="row-btn del" onClick={() => handleDelete(p.id, p.nombre)}>Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text3)' }}>
                                    Sin productos
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cards mobile */}
            <div className="prod-cards">
                {filtered.map(p => {
                    const sc = p.stock <= 0 ? 'stock-out' : p.stock <= p.stockMin ? 'stock-low' : 'stock-ok';
                    const isEditingPrice = inlineEdit?.id === p.id && inlineEdit?.field === 'pv';
                    const isEditingCost = inlineEdit?.id === p.id && inlineEdit?.field === 'pc';
                    return (
                        <div key={p.id} className="prod-list-card">
                            <div className="prod-list-card-top">
                                <div>
                                    <div className="prod-list-card-name">{p.nombre}</div>
                                    <div className="prod-list-card-sub">
                                        <span className="tag tag-cat">{p.cat}</span>
                                        <span style={{ color: 'var(--text3)', fontSize: 11 }}>{p.codigo}</span>
                                    </div>
                                </div>
                                <span className={`stock-badge ${sc}`}>{p.stock <= 0 ? 'Sin stock' : `${p.stock} u`}</span>
                            </div>
                            <div className="prod-list-card-prices">
                                <div
                                    className={`prod-card-price-cell ${isEditingPrice ? '' : 'prod-card-price-click'}`}
                                    onClick={() => { if (!isEditingPrice) startInlineEdit(p, 'pv'); }}
                                >
                                    <span style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>PRECIO VENTA</span>
                                    {isEditingPrice ? (
                                        <input
                                            autoFocus
                                            type="number"
                                            value={inlineEdit.val}
                                            onChange={e => setInlineEdit(v => ({ ...v, val: e.target.value }))}
                                            onBlur={() => saveInlineEdit(p.id, 'pv')}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit(p.id, 'pv'); }
                                                if (e.key === 'Escape') setInlineEdit(null);
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            className="inline-price-input"
                                        />
                                    ) : (
                                        <span className="prod-card-pv">{fmt(p.pv)} <Pencil size={10} /></span>
                                    )}
                                </div>
                                <div
                                    className={`prod-card-price-cell ${isEditingCost ? '' : 'prod-card-price-click'}`}
                                    onClick={() => { if (!isEditingCost) startInlineEdit(p, 'pc'); }}
                                >
                                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>PRECIO COSTO</span>
                                    {isEditingCost ? (
                                        <input
                                            autoFocus
                                            type="number"
                                            value={inlineEdit.val}
                                            onChange={e => setInlineEdit(v => ({ ...v, val: e.target.value }))}
                                            onBlur={() => saveInlineEdit(p.id, 'pc')}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit(p.id, 'pc'); }
                                                if (e.key === 'Escape') setInlineEdit(null);
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            className="inline-price-input"
                                        />
                                    ) : (
                                        <span className="prod-card-pv" style={{ color: 'var(--text2)' }}>{fmt(p.pc)} <Pencil size={10} /></span>
                                    )}
                                </div>
                            </div>
                            <div className="row-actions" style={{ marginTop: 10 }}>
                                <button className="row-btn" style={{ flex: 1 }} onClick={() => openEdit(p)}>Editar</button>
                                <button className="row-btn del" onClick={() => handleDelete(p.id, p.nombre)}>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Sin productos</div>
                )}
            </div>

            {/* Modal crear/editar */}
            <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
                <div className="modal" style={{ width: 'min(540px, 96vw)' }}>
                    <div className="modal-title">
                        <Package size={20} /> {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                    </div>
                    <div className="form-grid">
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Nombre del Producto *</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ej: Coca Cola 500ml"
                                ref={nombreRef}
                                value={form.nombre}
                                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); pvRef.current?.focus(); } }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Código de Barras</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ej: 7790895000197"
                                value={form.codigo}
                                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categoría</label>
                            <select
                                className="form-control"
                                value={form.cat}
                                onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
                            >
                                {cats.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Precio de Venta *</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="$0"
                                ref={pvRef}
                                value={form.pv}
                                onChange={e => setForm(f => ({ ...f, pv: e.target.value }))}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        editingId ? handleSave() : stockRef.current?.focus();
                                    }
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Precio de Compra</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="$0"
                                value={form.pc}
                                onChange={e => setForm(f => ({ ...f, pc: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stock {editingId ? 'Actual' : 'Inicial'}</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="0"
                                ref={stockRef}
                                value={form.stock}
                                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stock Mínimo</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="5"
                                value={form.stockMin}
                                onChange={e => setForm(f => ({ ...f, stockMin: e.target.value }))}
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Proveedor</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nombre del proveedor"
                                value={form.proveedor}
                                onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
                            />
                        </div>
                    </div>
                    <div className="modal-actions" style={{ marginTop: 16 }}>
                        <button className="btn-modal-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button className="btn-modal-confirm" onClick={handleSave}>✓ GUARDAR</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
