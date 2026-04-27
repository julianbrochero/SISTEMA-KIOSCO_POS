import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { fmt } from '../utils';
import { Package, Pencil, Trash2, Tag, Plus, X, Check, Search, AlertCircle } from 'lucide-react';

export default function ProductosPage() {
    const activePage = useStore(s => s.activePage);
    const products = useStore(s => s.products);
    const addProduct = useStore(s => s.addProduct);
    const updateProduct = useStore(s => s.updateProduct);
    const deleteProduct = useStore(s => s.deleteProduct);
    const showToastAction = useStore(s => s.showToastAction);
    const pendingScanCode = useStore(s => s.pendingScanCode);
    const setPendingScanCode = useStore(s => s.setPendingScanCode);
    const categorias = useStore(s => s.categorias);
    const addCategoria = useStore(s => s.addCategoria);
    const deleteCategoria = useStore(s => s.deleteCategoria);

    const [filterQuery, setFilterQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [inlineEdit, setInlineEdit] = useState(null);

    // Selección múltiple
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [bulkAction, setBulkAction] = useState(''); // 'delete' | 'cat'
    const [bulkCat, setBulkCat] = useState('');

    // Categorías
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [newCatInput, setNewCatInput] = useState('');
    const newCatRef = useRef(null);

    const nombreRef = useRef(null);
    const pvRef = useRef(null);
    const stockRef = useRef(null);
    const searchRef = useRef(null);

    const [form, setForm] = useState({
        nombre: '', codigo: '', cat: categorias[0] || 'General',
        pv: '', pc: '', stock: '', stockMin: '', proveedor: '', sinStock: false,
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

    useEffect(() => {
        if (catModalOpen) setTimeout(() => newCatRef.current?.focus(), 80);
    }, [catModalOpen]);

    if (activePage !== 'productos') return null;

    const filtered = products.filter(p =>
        p.nombre.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (p.codigo && p.codigo.includes(filterQuery))
    );

    const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
    const toggleAll = () => {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(filtered.map(p => p.id)));
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelected(new Set());
        setBulkAction('');
        setBulkCat('');
    };
    const toggleOne = (id) => {
        setSelected(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const handleBulkDelete = () => {
        if (!window.confirm(`¿Eliminar ${selected.size} producto(s)?`)) return;
        selected.forEach(id => deleteProduct(id));
        showToastAction('🗑', `${selected.size} productos eliminados`);
        exitSelectMode();
    };

    const handleBulkCat = () => {
        if (!bulkCat) return;
        selected.forEach(id => updateProduct(id, { cat: bulkCat }));
        showToastAction('✅', `Categoría actualizada en ${selected.size} producto(s)`);
        exitSelectMode();
    };

    const openAdd = () => {
        setEditingId(null);
        setForm({ nombre: '', codigo: '', cat: categorias[0] || 'General', pv: '', pc: '', stock: '', stockMin: '', proveedor: '', sinStock: false });
        setModalOpen(true);
        setTimeout(() => nombreRef.current?.focus(), 100);
    };

    const openEdit = (p) => {
        setEditingId(p.id);
        setForm({
            nombre: p.nombre, codigo: p.codigo, cat: p.cat,
            pv: String(p.pv), pc: String(p.pc),
            stock: String(p.stock), stockMin: String(p.stockMin),
            proveedor: p.proveedor || '', sinStock: p.sinStock || false,
        });
        setModalOpen(true);
        setTimeout(() => nombreRef.current?.focus(), 100);
    };

    const handleSave = () => {
        if (!form.nombre.trim()) {
            showToastAction('⚠️', 'El nombre es requerido', 'warn');
            return;
        }
        if (!form.sinStock && !form.pv) {
            showToastAction('⚠️', 'El precio de venta es requerido', 'warn');
            return;
        }
        const data = {
            nombre: form.nombre.trim(),
            codigo: form.codigo.trim() || String(Date.now()),
            cat: form.cat,
            pv: parseFloat(form.pv) || 0,
            pc: parseFloat(form.pc) || 0,
            stock: form.sinStock ? 0 : (parseInt(form.stock) || 0),
            stockMin: form.sinStock ? 0 : (parseInt(form.stockMin) || 5),
            proveedor: form.proveedor.trim(),
            sinStock: form.sinStock,
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

    const handleAddCat = () => {
        const cat = newCatInput.trim();
        if (!cat) return;
        if (categorias.includes(cat)) { showToastAction('⚠️', 'Esa categoría ya existe', 'warn'); return; }
        addCategoria(cat);
        setNewCatInput('');
        showToastAction('✅', `Categoría "${cat}" creada`);
    };

    const BG     = '#FAFAFA';
    const WHITE  = '#FFFFFF';
    const BORDER = '#E5E7EB';
    const TEXT1  = '#111827';
    const TEXT2  = '#4B5563';
    const TEXT3  = '#6B7280';
    const BLUE   = '#2563EB';

    return (
        <div className="page active" id="page-productos" style={{ background: BG, padding: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* ── TOPBAR SÍMIL SAAS ── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0 32px', background: WHITE, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, height: 68 }}>
                <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 24, borderRight: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: TEXT1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Productos</span>
                    <span style={{ fontSize: 13, color: TEXT3, fontWeight: 500 }}>Gestión de inventario</span>
                </div>
                
                {/* Search Header */}
                <div style={{ flex: 1, position: 'relative', maxWidth: 460 }}>
                    <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: TEXT3 }} />
                    <input type="text" placeholder="Buscar por nombre o escanear código..." ref={searchRef} value={filterQuery} onChange={e => setFilterQuery(e.target.value)}
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
                        style={{ width: '100%', height: 40, padding: '0 16px 0 42px', background: BG, border: 'none', borderRadius: 8, fontSize: 13, color: TEXT1, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                        onFocus={e => e.target.style.boxShadow = `0 0 0 2px #E0E7FF, inset 0 1px 2px rgba(0,0,0,0.02)`}
                        onBlur={e => e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'} />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
                        style={{ padding: '0 14px', height: 40, borderRadius: 8, border: `1px solid ${selectMode ? BLUE : BORDER}`, background: selectMode ? '#EFF6FF' : WHITE, color: selectMode ? BLUE : TEXT1, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                        <Check size={16} /> {selectMode ? 'Cancelar' : 'Seleccionar'}
                    </button>
                    <button onClick={() => setCatModalOpen(true)}
                        style={{ padding: '0 14px', height: 40, borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT1, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={16} /> Categorías
                    </button>
                    <button onClick={openAdd}
                        style={{ padding: '0 16px', height: 40, borderRadius: 8, border: 'none', background: '#111827', color: WHITE, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <Plus size={16} /> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* ── CONTENIDO PRINCIPAL ── */}
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', flex: 1 }}>

                {/* Barra de acciones masivas */}
                {selected.size > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#EFF6FF', borderRadius: 12, padding: '12px 20px', marginBottom: 20, border: `1px solid #BFDBFE`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <span style={{ color: BLUE, fontWeight: 700, fontSize: 14 }}>{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
                        <div style={{ flex: 1 }} />

                        {bulkAction === 'cat' ? (
                            <>
                                <select value={bulkCat} onChange={e => setBulkCat(e.target.value)}
                                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #93C5FD', fontSize: 13, background: WHITE, outline: 'none' }}>
                                    <option value="">Elegir categoría...</option>
                                    {categorias.map(c => <option key={c}>{c}</option>)}
                                </select>
                                <button onClick={handleBulkCat} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: BLUE, color: WHITE, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Aplicar</button>
                                <button onClick={() => { setBulkAction(''); setBulkCat(''); }} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'transparent', color: TEXT2, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setBulkAction('cat'); setBulkCat(''); }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #BFDBFE', background: WHITE, color: BLUE, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Tag size={14} /> Cambiar categoría
                                </button>
                                <button onClick={handleBulkDelete} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Trash2 size={14} /> Eliminar
                                </button>
                            </>
                        )}

                        <button onClick={exitSelectMode} style={{ background: 'transparent', border: 'none', color: TEXT3, cursor: 'pointer', padding: 4, marginLeft: 8 }}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Tabla desktop rediseñada */}
                <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BORDER}` }}>
                                {selectMode && <th style={{ width: 48, padding: '12px 16px', textAlign: 'center' }}><input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: 'pointer' }} /></th>}
                                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto</th>
                                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Código</th>
                                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoría</th>
                                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Precio Venta <span style={{ fontWeight: 400, textTransform: 'none', color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>(click)</span></th>
                                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>P. Costo</th>
                                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inventario</th>
                                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => {
                                const isEditingPrice = inlineEdit?.id === p.id && inlineEdit?.field === 'pv';
                                const isEditingCost = inlineEdit?.id === p.id && inlineEdit?.field === 'pc';
                                const isSel = selected.has(p.id);

                                return (
                                    <tr key={p.id} style={{ borderBottom: `1px solid #F3F4F6`, background: isSel ? '#EFF6FF' : 'transparent', transition: 'background 0.15s' }}>
                                        {selectMode && (
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <input type="checkbox" checked={isSel} onChange={() => toggleOne(p.id)} style={{ cursor: 'pointer' }} />
                                            </td>
                                        )}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT3 }}>
                                                    <Package size={16} />
                                                </div>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT1 }}>{p.nombre}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', color: TEXT2 }}>{p.codigo}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: '#F3F4F6', color: TEXT2, fontSize: 12, fontWeight: 500 }}>{p.cat}</span>
                                        </td>
                                        
                                        {/* Row PV Edit */}
                                        <td style={{ padding: '12px 16px', cursor: isEditingPrice ? 'default' : 'pointer' }} onClick={() => { if (!isEditingPrice) startInlineEdit(p, 'pv'); }}>
                                            {isEditingPrice ? (
                                                <input autoFocus type="number" value={inlineEdit.val}
                                                    onChange={e => setInlineEdit(v => ({ ...v, val: e.target.value }))}
                                                    onBlur={() => saveInlineEdit(p.id, 'pv')}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit(p.id, 'pv'); } if (e.key === 'Escape') setInlineEdit(null); }}
                                                    onClick={e => e.stopPropagation()} 
                                                    style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: `2px solid ${BLUE}`, outline: 'none', fontSize: 14, fontWeight: 600 }} />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: TEXT1, fontWeight: 700, fontSize: 14 }}>
                                                    {fmt(p.pv)}
                                                    <Pencil size={12} color="#9CA3AF" />
                                                </div>
                                            )}
                                        </td>

                                        {/* Row PC Edit */}
                                        <td style={{ padding: '12px 16px', cursor: isEditingCost ? 'default' : 'pointer' }} onClick={() => { if (!isEditingCost) startInlineEdit(p, 'pc'); }}>
                                            {isEditingCost ? (
                                                <input autoFocus type="number" value={inlineEdit.val}
                                                    onChange={e => setInlineEdit(v => ({ ...v, val: e.target.value }))}
                                                    onBlur={() => saveInlineEdit(p.id, 'pc')}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit(p.id, 'pc'); } if (e.key === 'Escape') setInlineEdit(null); }}
                                                    onClick={e => e.stopPropagation()} 
                                                    style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: `2px solid ${BLUE}`, outline: 'none', fontSize: 13, color: TEXT2, fontWeight: 500 }} />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: TEXT3, fontWeight: 500, fontSize: 13 }}>
                                                    {fmt(p.pc)}
                                                    <Pencil size={12} color="#D1D5DB" />
                                                </div>
                                            )}
                                        </td>
                                        
                                        <td style={{ padding: '12px 16px' }}>
                                            {p.sinStock
                                                ? <span style={{ padding: '2px 8px', borderRadius: 6, background: '#F5F3FF', color: '#7C3AED', fontSize: 12, fontWeight: 600, border: '1px solid #EAEBFF' }}>Precio libre / Serv.</span>
                                                : <span style={{ padding: '2px 8px', borderRadius: 6, 
                                                    background: p.stock <= 0 ? '#FEF2F2' : p.stock <= p.stockMin ? '#FFFBEB' : '#ECFDF5', 
                                                    color: p.stock <= 0 ? '#DC2626' : p.stock <= p.stockMin ? '#D97706' : '#059669', 
                                                    fontSize: 12, fontWeight: 600 }}>
                                                    {p.stock <= 0 ? 'Agotado' : `${p.stock} u`}
                                                  </span>
                                            }
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                                <button onClick={() => openEdit(p)} style={{ padding: '6px 12px', borderRadius: 6, background: WHITE, border: `1px solid ${BORDER}`, color: TEXT1, fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>Editar</button>
                                                <button onClick={() => handleDelete(p.id, p.nombre)} style={{ padding: '6px', borderRadius: 6, background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={selectMode ? 8 : 7} style={{ textAlign: 'center', padding: 40, color: TEXT3, fontSize: 14 }}>
                                        <Package size={32} color="#D1D5DB" style={{ marginBottom: 12, display: 'block', margin: '0 auto' }} />
                                        No hay productos registrados con esos filtros
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal crear/editar producto (REDISEÑADO) */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
                    <div style={{ width: '100%', maxWidth: 640, background: WHITE, borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        
                        {/* Header Modal */}
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package size={18} color={TEXT1} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT1 }}>{editingId ? 'Editar Producto' : 'Crear Producto'}</h2>
                                    <p style={{ margin: 0, fontSize: 13, color: TEXT3 }}>{editingId ? 'Actualiza los datos del producto' : 'Añade un nuevo producto a tu catálogo'}</p>
                                </div>
                            </div>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: TEXT3, cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                        </div>

                        {/* Contenido (Scrollable) */}
                        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                            
                            {/* Sección: Información Básica */}
                            <div>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} color={TEXT3}/> Información Básica</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Nombre del Producto *</label>
                                        <input type="text" placeholder="Ej: Coca Cola 500ml" ref={nombreRef} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                            onKeyDown={e => { if (e.key === 'Enter') pvRef.current?.focus(); }}
                                            style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: BG }}
                                            onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = BORDER} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Código de Barras</label>
                                        <input type="text" placeholder="Escanea o ingresa" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                                            style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: BG }}
                                            onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = BORDER} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Categoría</label>
                                        <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
                                            style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none', background: BG, cursor: 'pointer' }}>
                                            {categorias.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Nombre del Proveedor (Opcional)</label>
                                        <input type="text" placeholder="Ej: Distribuidora Oeste" value={form.proveedor} onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
                                            style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: BG }}
                                            onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = BORDER} />
                                    </div>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: 0 }} />

                            {/* Sección: Precios */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT1, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={14} color={TEXT3}/> Precios</h3>
                                    
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginLeft: 'auto' }}>
                                        <span style={{ fontSize: 13, fontWeight: 500, color: TEXT2 }}>Producto sin precio fijo / pesable</span>
                                        <div onClick={() => setForm(f => ({ ...f, sinStock: !f.sinStock }))} style={{ width: 36, height: 20, borderRadius: 10, background: form.sinStock ? BLUE : '#D1D5DB', position: 'relative', transition: 'background 0.2s' }}>
                                            <div style={{ position: 'absolute', top: 2, left: form.sinStock ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: WHITE, transition: 'left 0.2s' }} />
                                        </div>
                                    </label>
                                </div>
                                {!form.sinStock ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Precio Venta Público *</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 12, top: 10, fontSize: 14, color: TEXT3 }}>$</span>
                                                <input type="number" placeholder="0.00" ref={pvRef} value={form.pv} onChange={e => setForm(f => ({ ...f, pv: e.target.value }))}
                                                    onKeyDown={e => { if (e.key === 'Enter') stockRef.current?.focus(); }}
                                                    style={{ width: '100%', height: 40, padding: '0 12px 0 24px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: BG }}
                                                    onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = BORDER} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Costo / Precio de Compra</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 12, top: 10, fontSize: 14, color: TEXT3 }}>$</span>
                                                <input type="number" placeholder="0.00" value={form.pc} onChange={e => setForm(f => ({ ...f, pc: e.target.value }))}
                                                    style={{ width: '100%', height: 40, padding: '0 12px 0 24px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: BG }}
                                                    onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = BORDER} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: 12, background: '#EFF6FF', borderRadius: 8, border: `1px solid #BFDBFE`, color: BLUE, fontSize: 13, fontWeight: 500 }}>
                                        El precio y el peso/cantidad se solicitarán al momento de agregarlo a la venta. Ideal para artículos a granel.
                                    </div>
                                )}
                            </div>

                            <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: 0 }} />

                            {/* Sección: Inventario */}
                            {!form.sinStock && (
                                <div>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Package size={14} color={TEXT3}/> Inventario</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Unidades Disponibles (Actual)</label>
                                            <input type="number" placeholder="0" ref={stockRef} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                                                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                                                style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: BG }}
                                                onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = BORDER} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>Alerta Nivel Mínimo</label>
                                            <input type="number" placeholder="5" value={form.stockMin} onChange={e => setForm(f => ({ ...f, stockMin: e.target.value }))}
                                                style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: BG }}
                                                onFocus={e => e.target.style.borderColor = BLUE} onBlur={e => e.target.style.borderColor = BORDER} />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer Modal */}
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#FAFAFA', borderRadius: '0 0 16px 16px' }}>
                            <button onClick={() => setModalOpen(false)} style={{ padding: '0 16px', height: 40, borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT1, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancerlar</button>
                            <button onClick={handleSave} style={{ padding: '0 24px', height: 40, borderRadius: 8, border: 'none', background: '#111827', color: WHITE, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Guardar Producto</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal categorías */}
            {catModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setCatModalOpen(false); }}>
                    <div style={{ width: '100%', maxWidth: 400, background: WHITE, borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT1, display: 'flex', alignItems: 'center', gap: 8 }}><Tag size={18} color={TEXT3}/> Categorías</h2>
                            <button onClick={() => setCatModalOpen(false)} style={{ background: 'transparent', border: 'none', color: TEXT3, cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                                <input ref={newCatRef} type="text" placeholder="Nueva categoría..." value={newCatInput} onChange={e => setNewCatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddCat(); }}
                                    style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 14, outline: 'none' }} />
                                <button onClick={handleAddCat} style={{ padding: '0 16px', borderRadius: 8, border: 'none', background: '#111827', color: WHITE, cursor: 'pointer' }}><Plus size={16} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                                {categorias.map(cat => {
                                    const inUse = products.some(p => p.cat === cat);
                                    return (
                                        <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: BG, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: TEXT1 }}>{cat}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {inUse && <span style={{ fontSize: 11, color: TEXT3 }}>{products.filter(p => p.cat === cat).length} prod.</span>}
                                                <button onClick={() => { if (inUse) { showToastAction('⚠️', 'Reasigná los productos antes de eliminar', 'warn'); return; } deleteCategoria(cat); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: inUse ? TEXT3 : RED, padding: 4 }} title={inUse ? 'Tiene productos asignados' : 'Eliminar'}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BORDER}`, background: '#FAFAFA', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setCatModalOpen(false)} style={{ padding: '8px 24px', borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT1, fontWeight: 600, cursor: 'pointer' }}>Listo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
