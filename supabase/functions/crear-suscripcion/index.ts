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
    const { client_key, nombre_negocio, email, telefono, plan } = await req.json()

    if (!client_key) {
      return new Response(JSON.stringify({ error: 'client_key requerido' }), { status: 400, headers: CORS })
    }

    // ── Guardar / actualizar cliente en Supabase ─────────────────────────────
    const { data: existente } = await supabase
      .from('clientes')
      .select('id')
      .eq('client_key', client_key)
      .maybeSingle()

    let clienteId: string

    if (!existente) {
      const { data: nuevoCliente, error: insertError } = await supabase.from('clientes').insert({
        client_key,
        nombre_negocio: nombre_negocio || 'Mi Kiosco',
        email: email || '',
        telefono: telefono || '',
        activo: true,
      }).select('id').single()
      if (insertError || !nuevoCliente) {
        return new Response(JSON.stringify({ error: 'No se pudo registrar el cliente: ' + (insertError?.message || 'error desconocido') }), { status: 500, headers: CORS })
      }
      clienteId = nuevoCliente.id
    } else {
      clienteId = existente.id
      await supabase.from('clientes').update({
        nombre_negocio: nombre_negocio || 'Mi Kiosco',
        email: email || '',
        telefono: telefono || '',
      }).eq('client_key', client_key)
    }

    // Calcular montos según el plan
    let transactionAmount = 19999
    let frequency = 1
    let reasonSuffix = "Mensual"

    if (plan === 'semestral') {
      transactionAmount = 89999
      frequency = 6
      reasonSuffix = "Semestral"
    } else if (plan === 'prueba') {
      // Verificar si ya tuvo licencia antes
      const { count } = await supabase
        .from('licencias')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', clienteId);

      if (count && count > 0) {
        return new Response(JSON.stringify({ error: 'Este negocio o dispositivo ya utilizó una licencia previa. Debes elegir un plan de pago.' }), { status: 400, headers: CORS });
      }

      const idCliente = clienteId;

      // Crear licencia de 14 días
      const hoy = new Date();
      const vence = new Date(hoy.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      await supabase.from('licencias').insert({
        cliente_id: idCliente,
        fecha_inicio: hoy.toISOString().slice(0, 10),
        fecha_vencimiento: vence.toISOString().slice(0, 10),
        monto: 0,
        pagado: true,
        fecha_pago: hoy.toISOString(),
        notas: 'Prueba gratuita de 14 días',
      });

      return new Response(JSON.stringify({ trial_started: true }), { headers: CORS });
    }

    // ── Crear suscripción en Mercado Pago ────────────────────────────────────
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')!.replace('https://', 'https://').split('.supabase')[0]}.supabase.co/functions/v1/mp-webhook`

    const mpBody = {
      reason: `Gestify POS Kiosco — ${nombre_negocio || 'Mi Kiosco'} (${reasonSuffix})`,
      external_reference: client_key,
      payer_email: email || undefined,
      auto_recurring: {
        frequency: frequency,
        frequency_type: 'months',
        transaction_amount: transactionAmount,
        currency_id: 'ARS',
      },
      back_url: webhookUrl,
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
