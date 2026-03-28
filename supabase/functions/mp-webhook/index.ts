import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Estas vars están disponibles automáticamente en Supabase Edge Functions
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  // MP hace GET para verificar el webhook al configurarlo
  if (req.method === 'GET') return new Response('OK', { status: 200 })
  if (req.method !== 'POST') return new Response('OK', { status: 200 })

  try {
    const body = await req.json()
    console.log('MP Webhook recibido:', JSON.stringify(body))

    const type = body.type
    const dataId = body.data?.id
    if (!dataId) return new Response('OK', { status: 200 })

    let clientKey: string | null = null
    let deactivate = false

    // ── Pago automático de suscripción ──────────────────────────────────────
    if (type === 'subscription_authorized_payment') {
      const res = await fetch(
        `https://api.mercadopago.com/authorized_payments/${dataId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      )
      const payment = await res.json()
      console.log('Pago autorizado:', JSON.stringify(payment))

      if (payment.status !== 'processed') {
        return new Response('OK', { status: 200 })
      }

      // Buscar el client_key en la suscripción
      const subRes = await fetch(
        `https://api.mercadopago.com/preapproval/${payment.preapproval_id}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      )
      const sub = await subRes.json()
      clientKey = sub.external_reference

    // ── Cambio de estado de suscripción (cancelación, pausa) ────────────────
    } else if (type === 'subscription_preapproval') {
      const res = await fetch(
        `https://api.mercadopago.com/preapproval/${dataId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      )
      const sub = await res.json()
      console.log('Suscripción:', JSON.stringify(sub))
      clientKey = sub.external_reference

      if (sub.status === 'cancelled' || sub.status === 'paused') {
        deactivate = true
      }
    }

    if (!clientKey) return new Response('OK', { status: 200 })

    // ── Buscar o crear cliente ───────────────────────────────────────────────
    let { data: cliente } = await supabase
      .from('clientes')
      .select('id, nombre_negocio')
      .eq('client_key', clientKey)
      .maybeSingle()

    if (!cliente) {
      const { data: nuevo } = await supabase
        .from('clientes')
        .insert({ client_key: clientKey, nombre_negocio: 'Nuevo Cliente', activo: true })
        .select('id')
        .single()
      cliente = nuevo
    }

    if (!cliente) return new Response('OK', { status: 200 })

    // ── Desactivar si canceló ────────────────────────────────────────────────
    if (deactivate) {
      await supabase
        .from('clientes')
        .update({ activo: false })
        .eq('id', cliente.id)
      console.log(`Cliente ${clientKey} desactivado`)
      return new Response('OK', { status: 200 })
    }

    // ── Crear nueva licencia (30 días) ───────────────────────────────────────
    await supabase.from('clientes').update({ activo: true }).eq('id', cliente.id)

    const hoy = new Date()
    const vence = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)

    await supabase.from('licencias').insert({
      cliente_id: cliente.id,
      fecha_inicio: hoy.toISOString().slice(0, 10),
      fecha_vencimiento: vence.toISOString().slice(0, 10),
      monto: 14999,
      pagado: true,
      fecha_pago: hoy.toISOString(),
      notas: `Pago automático MP — ${type} — ID: ${dataId}`,
    })

    console.log(`Licencia creada para ${clientKey} hasta ${vence.toISOString().slice(0, 10)}`)
    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('Error en webhook:', err)
    return new Response('Error', { status: 500 })
  }
})
