import { useState } from 'react'
import { ShoppingBag, CreditCard, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL

export default function ActivationScreen({ clientKey, licenseInfo, onRecheck }) {
  const [step, setStep] = useState('form') // 'form' | 'waiting' | 'checking'
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isRenewal = licenseInfo && licenseInfo.nombre && !licenseInfo.bloqueado

  async function handleSuscribirse() {
    if (!nombre.trim()) { setError('Ingresá el nombre de tu negocio'); return }
    if (!email.trim()) { setError('Ingresá tu email'); return }
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${FUNCTIONS_URL}/crear-suscripcion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_key: clientKey, nombre_negocio: nombre, email, telefono }),
      })
      const data = await res.json()

      if (!res.ok || !data.init_point) {
        setError(data.error || 'Error al generar el link de pago. Intentá de nuevo.')
        setLoading(false)
        return
      }

      // Abrir MP en el navegador
      window.open(data.init_point, '_blank')
      setStep('waiting')
    } catch {
      setError('Sin conexión. Verificá tu internet e intentá de nuevo.')
    }
    setLoading(false)
  }

  async function handleVerificar() {
    setStep('checking')
    await onRecheck()
    // Si sigue sin activarse, volver a waiting
    setTimeout(() => setStep('waiting'), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#111',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <ShoppingBag size={26} color="#fff" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
            Gestify POS Kiosco
          </div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
            {isRenewal ? 'Tu suscripción venció — renovala para continuar' : 'Activá tu suscripción para comenzar'}
          </div>
        </div>

        <div style={{
          background: '#1a1a1a', border: '1px solid #252525',
          borderRadius: 20, padding: '28px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}>

          {/* Precio */}
          <div style={{
            background: '#111', border: '1px solid #2a2a2a', borderRadius: 12,
            padding: '16px 20px', marginBottom: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
              Plan mensual
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              $14.999
            </div>
            <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>
              por mes · se renueva automáticamente
            </div>
          </div>

          {/* ── PASO 1: Formulario ── */}
          {step === 'form' && (
            <>
              {isRenewal && (
                <div style={{
                  background: '#1a1500', border: '1px solid #3a2a00',
                  borderRadius: 10, padding: '12px 14px', marginBottom: 18,
                  fontSize: 13, color: '#fbbf24',
                }}>
                  ⚠ Suscripción vencida el{' '}
                  {licenseInfo.vencimiento
                    ? new Date(licenseInfo.vencimiento + 'T00:00:00').toLocaleDateString('es-AR')
                    : '—'
                  }. Completá el pago para reactivar.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Nombre del negocio *
                  </label>
                  <input
                    style={inp}
                    placeholder="Ej: Kiosco San Martín"
                    value={nombre}
                    onChange={e => { setNombre(e.target.value); setError('') }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Email *
                  </label>
                  <input
                    style={inp}
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Teléfono (opcional)
                  </label>
                  <input
                    style={inp}
                    placeholder="11-1234-5678"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#2a1515', border: '1px solid #3d1a1a',
                  borderRadius: 8, padding: '8px 12px',
                  color: '#f87171', fontSize: 12, marginBottom: 14,
                }}>
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <button
                onClick={handleSuscribirse}
                disabled={loading}
                style={{
                  width: '100%', height: 48, borderRadius: 10, border: 'none',
                  background: loading ? '#222' : '#fff',
                  color: loading ? '#444' : '#111',
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, fontFamily: 'inherit',
                }}
              >
                {loading
                  ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generando link...</>
                  : <><CreditCard size={15} /> Pagar con Mercado Pago</>
                }
              </button>

              <div style={{ fontSize: 11, color: '#333', textAlign: 'center', marginTop: 12 }}>
                Se abrirá Mercado Pago en tu navegador para completar el pago
              </div>
            </>
          )}

          {/* ── PASO 2: Esperando pago ── */}
          {(step === 'waiting' || step === 'checking') && (
            <>
              <div style={{
                background: '#0a1a0a', border: '1px solid #1a3a1a',
                borderRadius: 12, padding: '20px', marginBottom: 20, textAlign: 'center',
              }}>
                <ExternalLink size={24} color="#4ade80" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#4ade80', marginBottom: 6 }}>
                  Mercado Pago abierto en el navegador
                </div>
                <div style={{ fontSize: 12, color: '#2a5a2a' }}>
                  Completá el pago allá y volvé acá.<br />
                  La activación es automática.
                </div>
              </div>

              <button
                onClick={handleVerificar}
                disabled={step === 'checking'}
                style={{
                  width: '100%', height: 48, borderRadius: 10, border: 'none',
                  background: step === 'checking' ? '#1a1a1a' : '#fff',
                  color: step === 'checking' ? '#555' : '#111',
                  fontSize: 14, fontWeight: 700,
                  cursor: step === 'checking' ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, fontFamily: 'inherit', marginBottom: 10,
                }}
              >
                {step === 'checking'
                  ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Verificando...</>
                  : <><CheckCircle size={15} /> Ya pagué — Activar</>
                }
              </button>

              <button
                onClick={() => setStep('form')}
                style={{
                  width: '100%', height: 40, borderRadius: 10,
                  border: '1px solid #2a2a2a', background: 'transparent',
                  color: '#555', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Volver
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#2a2a2a' }}>
          ID de instalación: {clientKey?.slice(0, 8)}...
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const inp = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid #2a2a2a', background: '#111',
  color: '#fff', fontSize: 13, fontFamily: 'inherit',
  boxSizing: 'border-box', outline: 'none',
}
