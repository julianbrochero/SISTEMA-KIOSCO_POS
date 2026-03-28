import { create } from 'zustand';
import { persist } from 'zustand/middleware';



const initialUsuarios = [
  { id: 1, nombre: 'Admin', pin: '0000', rol: 'admin', activo: true },
];

const now = () => {
  const d = new Date();
  return {
    hora: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    fecha: d.toLocaleDateString('es-AR'),
  };
};

// Genera un UUID v4 simple
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export const useStore = create(
  persist(
    (set, get) => ({
      activePage: 'pos',
      setActivePage: (page) => set({ activePage: page }),

      // ─── LICENCIA ─────────────────────────────────────────────────────────
      // Clave única de esta instalación — se genera una sola vez y persiste
      clientKey: uuidv4(),

      pendingScanCode: null,
      setPendingScanCode: (code) => set({ pendingScanCode: code }),

      // ─── CONFIGURACIÓN ────────────────────────────────────────────────────
      configuracion: {
        nombreKiosco: 'KIOSCO CENTRAL',
        direccion: '',
        telefono: '',
        imprimirTicket: false,
        moneda: '$',
      },
      updateConfiguracion: (cfg) => set(state => ({
        configuracion: { ...state.configuracion, ...cfg }
      })),

      // ─── USUARIOS ─────────────────────────────────────────────────────────
      usuarios: initialUsuarios,
      nextUserId: 4,
      currentUser: null,

      login: (pin) => {
        const usuarios = get().usuarios;
        const user = usuarios.find(u => u.pin === pin && u.activo);
        if (!user) return false;
        const { hora, fecha } = now();
        set({ currentUser: user });
        set(state => ({
          logs: [{
            id: Date.now(),
            usuario: user.nombre,
            rol: user.rol,
            accion: 'LOGIN',
            detalle: `${user.nombre} (${user.rol}) inició sesión`,
            hora,
            fecha,
          }, ...state.logs]
        }));
        return true;
      },

      logout: () => {
        const user = get().currentUser;
        if (!user) return;
        const { hora, fecha } = now();
        set(state => ({
          logs: [{
            id: Date.now(),
            usuario: user.nombre,
            rol: user.rol,
            accion: 'LOGOUT',
            detalle: `${user.nombre} cerró sesión`,
            hora,
            fecha,
          }, ...state.logs],
          currentUser: null,
          activePage: 'pos',
        }));
      },

      addUsuario: (u) => set(state => ({
        usuarios: [...state.usuarios, { id: state.nextUserId, ...u, activo: true }],
        nextUserId: state.nextUserId + 1,
      })),
      updateUsuario: (id, u) => set(state => ({
        usuarios: state.usuarios.map(usr => usr.id === id ? { ...usr, ...u } : usr)
      })),
      deleteUsuario: (id) => set(state => ({
        usuarios: state.usuarios.filter(usr => usr.id !== id)
      })),

      // ─── LOGS ─────────────────────────────────────────────────────────────
      logs: [],
      addLog: (accion, detalle) => {
        const user = get().currentUser;
        const { hora, fecha } = now();
        set(state => ({
          logs: [{
            id: Date.now(),
            usuario: user?.nombre || 'Sistema',
            rol: user?.rol || 'sistema',
            accion,
            detalle,
            hora,
            fecha,
          }, ...state.logs]
        }));
      },

      products: [],
      nextId: 1,
      cart: [],
      sales: [],
      cajaMovs: [],
      cajaTotal: 0,
      cajaApertura: 0,
      saleCounter: 1,
      cajaAbierta: false,

      // Descuento global para la venta actual
      descuento: 0,
      setDescuento: (v) => set({ descuento: v }),

      // Products CRUD
      addProduct: (p) => {
        const user = get().currentUser;
        set(state => ({
          products: [...state.products, { id: state.nextId, ...p }],
          nextId: state.nextId + 1
        }));
        get().addLog('PRODUCTO_CREADO', `${user?.nombre || 'Sistema'} creó producto: ${p.nombre}`);
      },
      updateProduct: (id, p) => {
        const user = get().currentUser;
        const prod = get().products.find(x => x.id === id);
        set(state => ({
          products: state.products.map(prod => prod.id === id ? { ...prod, ...p } : prod)
        }));
        get().addLog('PRODUCTO_EDITADO', `${user?.nombre || 'Sistema'} editó producto: ${prod?.nombre || id}`);
      },
      deleteProduct: (id) => {
        const user = get().currentUser;
        const prod = get().products.find(x => x.id === id);
        set(state => ({
          products: state.products.filter(prod => prod.id !== id)
        }));
        get().addLog('PRODUCTO_ELIMINADO', `${user?.nombre || 'Sistema'} eliminó producto: ${prod?.nombre || id}`);
      },

      // Bulk price update by category
      bulkPriceUpdate: (cat, percent) => {
        const user = get().currentUser;
        set(state => ({
          products: state.products.map(p => {
            if (p.cat === cat) {
              const newPv = Math.round(p.pv * (1 + percent / 100));
              return { ...p, pv: newPv };
            }
            return p;
          })
        }));
        get().addLog('PRECIO_MASIVO', `${user?.nombre || 'Sistema'} actualizó precios de ${cat} en ${percent}%`);
      },

      // Stock
      addStock: (items) => {
        const user = get().currentUser;
        set(state => {
          const newProds = [...state.products];
          items.forEach(i => {
            const idx = newProds.findIndex(x => x.id === i.id);
            if (idx > -1) newProds[idx] = { ...newProds[idx], stock: newProds[idx].stock + i.qty };
          });
          return { products: newProds };
        });
        get().addLog('INGRESO_STOCK', `${user?.nombre || 'Sistema'} ingresó mercadería: ${items.map(i => `${i.nombre}x${i.qty}`).join(', ')}`);
      },
      reduceStock: (items) => set(state => {
        const newProds = [...state.products];
        items.forEach(i => {
          const idx = newProds.findIndex(x => x.id === i.id);
          if (idx > -1) newProds[idx] = { ...newProds[idx], stock: Math.max(0, newProds[idx].stock - i.qty) };
        });
        return { products: newProds };
      }),

      // Cart
      addToCart: (p) => set(state => {
        const existing = state.cart.find(i => i.id === p.id);
        if (existing) {
          return { cart: state.cart.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) };
        } else {
          return { cart: [...state.cart, { id: p.id, nombre: p.nombre, cat: p.cat, precio: p.pv, pc: p.pc, qty: 1 }] };
        }
      }),
      addVarios: (amount) => set(state => ({
        cart: [...state.cart, { id: 'varios-' + Date.now(), nombre: 'Varios', cat: 'Cobro General', precio: amount, pc: 0, qty: 1 }]
      })),
      removeFromCart: (id) => {
        const user = get().currentUser;
        const item = get().cart.find(i => i.id === id);
        set(state => ({ cart: state.cart.filter(i => i.id !== id) }));
        if (item) get().addLog('ITEM_ELIMINADO', `${user?.nombre || 'Sistema'} eliminó del carrito: ${item.nombre}`);
      },
      changeCartQty: (id, delta, maxStock) => set(state => ({
        cart: state.cart.map(i => {
          if (i.id === id) {
            return { ...i, qty: Math.max(1, Math.min(i.qty + delta, maxStock)) };
          }
          return i;
        })
      })),
      changeCartItemPrice: (id, newPrice) => set(state => ({
        cart: state.cart.map(i => {
          if (i.id === id) {
            return { ...i, precio: newPrice };
          }
          return i;
        })
      })),
      removeLastCartItem: () => {
        const user = get().currentUser;
        const cart = get().cart;
        if (cart.length > 0) {
          const last = cart[cart.length - 1];
          set({ cart: cart.slice(0, -1) });
          get().addLog('ITEM_ELIMINADO', `${user?.nombre || 'Sistema'} eliminó último ítem: ${last.nombre}`);
        }
      },
      clearCart: () => set({ cart: [], descuento: 0 }),

      // Sales
      addSale: (sale, total, method, descuento, customDate = null) => set(state => {
        const user = get().currentUser;
        const saleDate = customDate ? new Date(customDate) : new Date();
        const horaStr = saleDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const fechaStr = saleDate.toLocaleDateString('es-AR');

        const newSale = {
          id: state.saleCounter,
          hora: horaStr,
          fecha: fechaStr,
          items: [...sale],
          total,
          subtotal: sale.reduce((s, i) => s + i.precio * i.qty, 0),
          costo: sale.reduce((s, i) => s + (i.pc || 0) * i.qty, 0),
          descuento: descuento || 0,
          pago: method,
          anulada: false,
          usuarioId: user?.id || null,
          usuarioNombre: user?.nombre || 'Sistema',
        };
        const newMov = { id: Date.now(), tipo: 'ingreso', desc: `Venta #${state.saleCounter} (${method})`, monto: total, hora: horaStr, fecha: fechaStr, usuario: user?.nombre };
        const logEntry = {
          id: Date.now() + 1,
          usuario: user?.nombre || 'Sistema',
          rol: user?.rol || 'sistema',
          accion: 'VENTA_REGISTRADA',
          detalle: `Venta #${state.saleCounter} por ${method} — ${sale.map(i => `${i.nombre}x${i.qty}`).join(', ')} — Total: $${total}`,
          hora: horaStr,
          fecha: fechaStr,
        };
        return {
          sales: [newSale, ...state.sales],
          saleCounter: state.saleCounter + 1,
          cajaTotal: state.cajaTotal + total,
          cajaMovs: [...state.cajaMovs, newMov],
          logs: [logEntry, ...state.logs],
        };
      }),
      anularVenta: (id, motivo = '') => set(state => {
        const sale = state.sales.find(s => s.id === id);
        if (!sale || sale.anulada) return {};
        const user = get().currentUser;
        const { hora, fecha } = now();

        // Restaurar stock de los items de la venta
        const newProds = [...state.products];
        sale.items.forEach(i => {
          const idx = newProds.findIndex(x => x.id === i.id);
          if (idx > -1) newProds[idx] = { ...newProds[idx], stock: newProds[idx].stock + i.qty };
        });

        const descTexto = motivo ? `Anulación #${id} (${motivo})` : `Anulación venta #${id}`;
        const logEntry = {
          id: Date.now(),
          usuario: user?.nombre || 'Sistema',
          rol: user?.rol || 'sistema',
          accion: 'VENTA_ANULADA',
          detalle: `${user?.nombre || 'Sistema'} anuló venta #${id}. Motivo: ${motivo || 'Sin especificar'}`,
          hora,
          fecha,
        };
        return {
          sales: state.sales.map(s => s.id === id ? { ...s, anulada: true, motivoAnulacion: motivo, anuladaPor: user?.nombre, anuladaHora: hora } : s),
          products: newProds,
          cajaTotal: state.cajaTotal - sale.total,
          cajaMovs: [...state.cajaMovs, { id: Date.now(), tipo: 'egreso', desc: descTexto, monto: sale.total, hora, fecha, usuario: user?.nombre }],
          logs: [logEntry, ...state.logs],
        };
      }),

      // Caja
      registrarMovimiento: (tipo, desc, monto) => {
        const user = get().currentUser;
        const { hora, fecha } = now();
        set(state => ({
          cajaMovs: [...state.cajaMovs, { id: Date.now(), tipo, desc, monto, hora, fecha, usuario: user?.nombre }],
          cajaTotal: state.cajaTotal + (tipo === 'ingreso' ? monto : -monto)
        }));
        get().addLog(tipo === 'egreso' ? 'EGRESO_CAJA' : 'INGRESO_CAJA', `${user?.nombre || 'Sistema'} registró ${tipo}: ${desc} — $${monto}`);
      },
      eliminarMovimiento: (id) => {
        const mov = get().cajaMovs.find(m => m.id === id);
        if (!mov) return;
        set(state => ({
          cajaMovs: state.cajaMovs.filter(m => m.id !== id),
          cajaTotal: state.cajaTotal - (mov.tipo === 'ingreso' ? mov.monto : -mov.monto)
        }));
      },
      abrirCaja: (monto) => {
        const user = get().currentUser;
        const { hora, fecha } = now();
        set(() => ({
          cajaMovs: [{ id: Date.now(), tipo: 'ingreso', desc: 'Apertura de caja', monto, hora, fecha, usuario: user?.nombre }],
          cajaTotal: monto,
          cajaApertura: monto,
          cajaAbierta: true,
        }));
        get().addLog('APERTURA_CAJA', `${user?.nombre || 'Sistema'} abrió caja con $${monto}`);
      },
      resetCaja: (efectivoReal = 0) => {
        const user = get().currentUser;
        const { hora, fecha } = now();
        get().addLog('CIERRE_CAJA', `${user?.nombre || 'Sistema'} cerró caja. Efectivo contado: $${efectivoReal}`);
        set(() => ({
          cajaAbierta: false,
          cajaMovs: [],
          cajaTotal: 0,
          cajaApertura: 0
        }));
      },

      // Dynamic favorites: get top 6 most sold product IDs
      getFavoriteIds: () => {
        const state = useStore.getState();
        const countMap = {};
        state.sales.forEach(s => {
          if (s.anulada) return;
          s.items.forEach(i => {
            countMap[i.id] = (countMap[i.id] || 0) + i.qty;
          });
        });
        const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
        if (sorted.length < 4) {
          return state.products.slice(0, 6).map(p => p.id);
        }
        return sorted.map(e => parseInt(e[0]));
      },

      // Toast
      toast: { show: false, icon: '', msg: '', type: 'info' },
      setToast: (show, icon = '', msg = '', type = 'info') => set({ toast: { show, icon, msg, type } }),
      showToastAction: (icon, msg, type = 'info') => {
        set({ toast: { show: true, icon, msg, type } });
        setTimeout(() => {
          set({ toast: { show: false, icon: '', msg: '', type: 'info' } });
        }, 3000);
      }
    }),
    {
      name: 'gestifi-pos-storage-v3',
    }
  )
);
