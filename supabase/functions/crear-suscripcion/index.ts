import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_FUNCTIONS_URL = Deno.env.get('SUPABASE_URL')!.replace('.supabase.co', '.supabase.co')

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { client_key, nombre_negocio, email, telefono } = await req.json()

    if (!client_key) {
      return new Response(JSON.stringify({ error: 'client_key requerido' }), { status: 400, headers: CORS })
    }

    // ── Guardar / actualizar cliente en Supabase ─────────────────────────────
    const { data: existente } = await supabase
      .from('clientes')
      .select('id')
      .eq('client_key', client_key)
      .maybeSingle()

    if (!existente) {
      await supabase.from('clientes').insert({
        client_key,
        nombre_negocio: nombre_negocio || 'Mi Kiosco',
        email: email || '',
        telefono: telefono || '',
        activo: true,
      })
    } else {
      await supabase.from('clientes').update({
        nombre_negocio: nombre_negocio || 'Mi Kiosco',
        email: email || '',
        telefono: telefono || '',
      }).eq('client_key', client_key)
    }

    // ── Crear suscripción en Mercado Pago ────────────────────────────────────
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')!.replace('https://', 'https://').split('.supabase')[0]}.supabase.co/functions/v1/mp-webhook`

    const mpBody = {
      reason: `Gestify POS Kiosco — ${nombre_negocio || 'Mi Kiosco'}`,
      external_reference: client_key,
      payer_email: email || undefined,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 14999,
        currency_id: 'ARS',
      },
      back_url: 'https://amoxzgrvekmlvkytefqx.supabase.co/functions/v1/mp-webhook',
      status: 'pending',
    }

    const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mpBody),
    })

    const mpData = await mpRes.json()
    console.log('MP respuesta:', JSON.stringify(mpData))

    if (!mpData.init_point) {
      return new Response(
        JSON.stringify({ error: 'MP no devolvió link de pago', detalle: mpData }),
        { status: 500, headers: CORS }
      )
    }

    return new Response(
      JSON.stringify({ init_point: mpData.init_point, subscription_id: mpData.id }),
      { headers: CORS }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
