import { useState } from 'react'
import { RefreshCw, AlertCircle, Zap, ShieldCheck, Sparkles, LogOut } from 'lucide-react'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function ActivationScreen({ clientKey, licenseInfo, onRecheck }) {
  const [step, setStep] = useState('form')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [plan, setPlan] = useState('semestral')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isRenewal = licenseInfo && licenseInfo.nombre && !licenseInfo.bloqueado

  const handleHardReset = () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión y borrar todos los datos locales?')) {
      localStorage.removeItem('gestifi-pos-storage-v3')
      localStorage.removeItem('kiosco_lic_cache')
      window.location.reload()
    }
  }

  async function handleSuscribirse() {
    if (!nombre.trim()) { setError('Por favor, ingresá el nombre del negocio.'); return }
    if (!email.trim()) { setError('Por favor, ingresá un correo electrónico válido.'); return }
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${FUNCTIONS_URL}/crear-suscripcion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ client_key: clientKey, nombre_negocio: nombre, email, telefono, plan }),
      })
      const data = await res.json()

      if (data.trial_started) {
        setStep('checking')
        await onRecheck()
        setTimeout(() => {
          if (document.body.contains(document.getElementById('activation-overlay'))) {
            setStep('waiting')
          }
        }, 3000)
        return
      }

      if (!res.ok || !data.init_point) {
        setError(data.error || 'Ocurrió un error al generar el enlace de pago. Por favor, intentá nuevamente.')
        setLoading(false)
        return
      }

      window.open(data.init_point, '_blank')
      setStep('waiting')
    } catch {
      setError('No se pudo establecer conexión. Verificá tu conexión a internet e intentá nuevamente.')
    }
    setLoading(false)
  }

  return (
    <div id="activation-overlay" className="activation-container">
      <div className="activation-content">

        {/* ── LEFT COLUMN ── */}
        <div className="info-column">
          <div className="brand">
            <div className="brand-icon">
              <img src="/_preview.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="brand-name">Gestify POS</span>
          </div>

          <h1 className="headline">
            Control total de tu kiosco en{' '}
            <span className="text-underline">una sola plataforma.</span>
          </h1>

          <p className="subheadline">
            Gestioná ventas, stock y caja en tiempo real desde una única plataforma.
          </p>

          <ul className="bullets">
            <li>
              <div className="bullet-icon"><Zap size={13} /></div>
              Actualización en tiempo real de ventas y stock
            </li>
            <li>
              <div className="bullet-icon"><ShieldCheck size={13} /></div>
              Respaldo automático y seguro en la nube
            </li>
            <li>
              <div className="bullet-icon"><Sparkles size={13} /></div>
              Interfaz ágil, intuitiva y optimizada para el uso diario
            </li>
          </ul>

          <div className="id-badge">
            <span className="id-label">ID DE INSTALACIÓN</span>
            <code
              className="id-code"
              onClick={() => navigator.clipboard.writeText(clientKey)}
              title="Copiar ID"
            >
              {clientKey} ⎘
            </code>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="form-column">
          <div className="main-card">

            {step === 'form' ? (
              <>
                <h2 className="card-title">
                  {isRenewal ? 'Renová tu suscripción' : 'Comenzar ahora'}
                </h2>

                <div className="plan-selector">
                  {[
                    { key: 'semestral', title: 'Semestral', price: '$89.999', promo: 'Ahorro del 25%' },
                    { key: 'mensual', title: 'Mensual', price: '$19.999', promo: null },
                    ...(!isRenewal ? [{ key: 'prueba', title: 'Prueba gratuita', price: '14 días', promo: null }] : []),
                  ].map(p => (
                    <button
                      key={p.key}
                      className={`plan-tab ${plan === p.key ? 'active' : ''}`}
                      onClick={() => setPlan(p.key)}
                    >
                      <span className="tab-title">{p.title}</span>
                      <span className="tab-price">{p.price}</span>
                      {p.promo && <span className="tab-promo">{p.promo}</span>}
                    </button>
                  ))}
                </div>

                <div className="form-grid">
                  <div className="f-group">
                    <label>Nombre del negocio / comercio</label>
                    <input
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Ej: Kiosco Central"
                    />
                  </div>
                  <div className="f-group">
                    <label>Email de contacto</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="f-group">
                    <label>Teléfono de contacto <span className="label-opt">(opcional)</span></label>
                    <input
                      value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                      placeholder="11 1234-5678"
                    />
                  </div>
                </div>

                {error && (
                  <div className="err-msg">
                    <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                  </div>
                )}

                <p className="step-guide">Completá tus datos para comenzar</p>

                <button className="cta-btn" onClick={handleSuscribirse} disabled={loading}>
                  {loading
                    ? <RefreshCw className="spin" size={17} />
                    : plan === 'prueba' ? 'Iniciar prueba gratuita' : 'Activar suscripción'
                  }
                </button>

                <div className="microcopy-block">
                  <p className="microcopy">Sin necesidad de tarjeta de crédito · Activación inmediata</p>
                  <p className="microcopy">🔒 Tus datos están protegidos y no serán compartidos</p>
                </div>

                <div className="divider" />

                <button className="secondary-btn" onClick={() => setStep('waiting')}>
                  Ingresar con una licencia existente
                </button>
              </>
            ) : (
              <div className="waiting-state">
                <div className="waiting-icon"><RefreshCw className="spin" size={28} /></div>
                <h3>Verificando el estado de tu pago...</h3>
                <p>Si ya completaste el pago, la activación se realizará automáticamente en unos segundos.</p>
                <p className="waiting-hint">Este proceso puede demorar hasta 30 segundos.</p>
                <p className="waiting-subhint">
                  Una vez acreditado el pago, el acceso se habilita automáticamente sin necesidad de acciones adicionales.
                </p>
                <button className="cta-btn" onClick={() => onRecheck()}>
                  Actualizar estado
                </button>
                <button className="secondary-btn" onClick={() => setStep('form')}>Volver</button>
              </div>
            )}
          </div>

          <button className="logout-btn" onClick={handleHardReset}>
            <LogOut size={11} /> Limpiar datos y cerrar sesión
          </button>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --black:        #0a0a0a;
          --gray-900:     #171717;
          --gray-700:     #404040;
          /* ↑ key text colors — all pushed darker than before */
          --gray-600:     #525252;   /* subtítulo, bullets, placeholders de valor */
          --gray-500:     #666666;   /* antes #737373 — labels, microcopy */
          --gray-400:     #888888;   /* antes #a3a3a3 — secundario suave */
          --gray-300:     #b0b0b0;   /* antes #d4d4d4 — placeholder inputs */
          --gray-200:     #e5e5e5;
          --gray-100:     #f5f5f5;
          --gray-50:      #fafafa;
          --white:        #ffffff;
          --border:       #e5e5e5;
          --border-dark:  #c4c4c4;
          --error-text:   #b91c1c;
          --error-bg:     #fef2f2;
          --error-border: #fecaca;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .activation-container {
          position: fixed; inset: 0;
          background: #f7f7f8;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
          color: var(--black);
          padding: 24px;
          overflow: hidden;
        }

        .activation-content {
          display: grid; grid-template-columns: 1fr 1.1fr;
          width: 100%; max-width: 960px;
          gap: 60px; align-items: center;
          animation: fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* ── LEFT ── */
        .brand { display: flex; align-items: center; gap: 9px; margin-bottom: 30px; }
        .brand-icon {
          width: 28px; height: 28px; background: var(--white);
          border-radius: 7px; display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border); overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07);
        }
        /* Brand name: darker */
        .brand-name { font-size: 14px; font-weight: 600; color: var(--gray-700); letter-spacing: -0.1px; }

        .headline {
          font-size: 34px; font-weight: 760;
          line-height: 1.13; margin-bottom: 14px;
          letter-spacing: -1.3px; color: var(--black);
        }
        .text-underline { border-bottom: 2.5px solid var(--black); padding-bottom: 1px; }

        /* Subtítulo: was gray-500 (#737373), now gray-600 (#525252) */
        .subheadline {
          font-size: 15px; font-weight: 400;
          color: var(--gray-600); line-height: 1.65;
          margin-bottom: 26px; max-width: 340px;
        }

        .bullets { list-style: none; padding: 0; margin: 0 0 34px; }
        /* Bullet text: was gray-700 (#404040), keeping same — already readable */
        .bullets li {
          display: flex; align-items: center; gap: 10px;
          font-size: 13.5px; color: var(--gray-700); font-weight: 400;
          margin-bottom: 9px; line-height: 1.4;
        }
        .bullet-icon {
          flex-shrink: 0; width: 24px; height: 24px;
          background: var(--white); border: 1px solid var(--border);
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          color: var(--gray-700); box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        /* ID badge: darker so it's actually readable */
        .id-badge { display: flex; flex-direction: column; gap: 4px; }
        .id-label { font-size: 9px; letter-spacing: 1.5px; font-weight: 600; color: var(--gray-500); text-transform: uppercase; }
        .id-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 11px; color: var(--gray-500);
          cursor: pointer; transition: color 0.15s;
        }
        .id-code:hover { color: var(--gray-700); }

        /* ── CARD ── */
        .main-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 30px 30px 24px;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.02),
            0 2px 4px rgba(0,0,0,0.04),
            0 8px 20px rgba(0,0,0,0.06),
            0 24px 48px rgba(0,0,0,0.05);
        }

        /* Card title: darker — was gray-500, now gray-700 */
        .card-title {
          font-size: 11px; font-weight: 600;
          color: var(--gray-600);
          text-align: center; margin-bottom: 20px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        /* ── PLAN SELECTOR ── */
        .plan-selector {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
          background: var(--gray-100); padding: 4px; border-radius: 14px;
          border: 1px solid var(--border); margin-bottom: 22px;
        }
        .plan-tab {
          background: transparent; border: 1px solid transparent;
          padding: 10px 4px; border-radius: 10px;
          /* Inactive: darker than before — was gray-400 (#a3a3a3), now gray-500 (#666) */
          color: var(--gray-500);
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease,
                      box-shadow 0.18s ease, transform 0.18s ease, color 0.18s ease;
          display: flex; flex-direction: column; align-items: center;
          font-family: inherit; gap: 2px;
        }
        .plan-tab:hover:not(.active) { color: var(--gray-700); background: rgba(0,0,0,0.03); }
        .plan-tab.active {
          background: var(--white); border-color: var(--border-dark);
          color: var(--black);
          transform: translateY(-1px);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.07);
        }
        .tab-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .tab-price { font-size: 14px; font-weight: 700; letter-spacing: -0.4px; }
        /* Promo: darker — was gray-700, keeping */
        .tab-promo { font-size: 9px; color: var(--gray-700); font-weight: 600; margin-top: 1px; }

        /* ── FORM ── */
        .form-grid { display: grid; gap: 11px; margin-bottom: 16px; }
        .f-group { display: flex; flex-direction: column; gap: 5px; }
        /* Labels: darker — was gray-500 (#737373), now gray-600 (#525252) */
        .f-group label {
          font-size: 11px; font-weight: 500; letter-spacing: 0.3px;
          color: var(--gray-600); text-transform: uppercase;
        }
        .label-opt { font-weight: 400; color: var(--gray-500); text-transform: none; letter-spacing: 0; }
        .f-group input {
          background: var(--gray-50); border: 1.5px solid var(--border);
          padding: 9px 12px; border-radius: 9px;
          color: var(--black); font-size: 13.5px; outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          font-family: inherit;
        }
        /* Placeholder: was #d4d4d4 (near-invisible), now gray-400 (#888) */
        .f-group input::placeholder { color: var(--gray-400); }
        .f-group input:hover:not(:focus) { border-color: var(--gray-300); background: var(--white); }
        .f-group input:focus {
          border-color: var(--black); background: var(--white);
          box-shadow: 0 0 0 3.5px rgba(10,10,10,0.07);
        }

        /* ── CTA ── */
        /* Step guide: darker — was gray-400, now gray-600 */
        .step-guide {
          font-size: 12px; font-weight: 400;
          color: var(--gray-600); text-align: center; margin-bottom: 10px;
        }

        .cta-btn {
          width: 100%; padding: 14px 20px;
          border-radius: 11px; border: none;
          background: var(--black); color: var(--white);
          font-size: 14px; font-weight: 650; letter-spacing: -0.1px;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.10), 0 8px 20px rgba(0,0,0,0.08);
        }
        .cta-btn:hover:not(:disabled) {
          background: var(--gray-900); transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08);
        }
        .cta-btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
        .cta-btn:disabled { background: var(--gray-200); color: var(--gray-400); box-shadow: none; cursor: not-allowed; }

        /* ── MICROCOPY ── */
        .microcopy-block { margin-top: 11px; display: flex; flex-direction: column; gap: 3px; }
        /* Microcopy: darker — was gray-400 (#a3a3a3), now gray-500 (#666) */
        .microcopy { font-size: 11px; color: var(--gray-500); text-align: center; line-height: 1.6; }

        .divider { border: none; border-top: 1px solid var(--border); margin: 16px 0 0; }

        /* Secondary btn: darker — was gray-400, now gray-500 */
        .secondary-btn {
          width: 100%; background: transparent; border: none;
          color: var(--gray-500); font-size: 12.5px; font-weight: 400;
          margin-top: 12px; cursor: pointer; font-family: inherit;
          transition: color 0.15s; text-align: center; display: block;
        }
        .secondary-btn:hover { color: var(--gray-700); }

        .err-msg {
          font-size: 12px; color: var(--error-text);
          background: var(--error-bg); border: 1px solid var(--error-border);
          padding: 9px 11px; border-radius: 8px; margin-bottom: 12px;
          display: flex; align-items: flex-start; gap: 6px; line-height: 1.45;
        }

        /* ── WAITING ── */
        .waiting-state { text-align: center; padding: 16px 0 8px; }
        .waiting-icon { color: var(--black); margin-bottom: 16px; display: flex; justify-content: center; }
        .waiting-state h3 { font-size: 16px; font-weight: 650; margin-bottom: 10px; letter-spacing: -0.3px; color: var(--black); }
        .waiting-state p { color: var(--gray-600); font-size: 13.5px; margin-bottom: 10px; line-height: 1.55; }
        .waiting-hint { font-size: 12px !important; color: var(--gray-500) !important; font-style: italic; }
        .waiting-subhint { font-size: 12px !important; color: var(--gray-500) !important; margin-bottom: 22px !important; }

        /* Logout: darker — was #d4d4d4 (invisible), now gray-400 */
        .logout-btn {
          background: transparent; border: none; color: var(--gray-400); font-size: 10px;
          margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 5px;
          width: 100%; cursor: pointer; font-family: inherit; transition: color 0.18s;
        }
        .logout-btn:hover { color: var(--gray-600); }

        /* ── ANIMATIONS ── */
        .spin { animation: spin 0.9s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .activation-container { overflow-y: auto; align-items: flex-start; padding: 24px 16px 48px; }
          .activation-content { grid-template-columns: 1fr; gap: 28px; }
          .headline { font-size: 28px; }
          .subheadline { max-width: 100%; }
        }
      `}} />
    </div>
  )
}