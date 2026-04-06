import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const symbols = '!@#$%&*'
  const all = upper + lower + digits + symbols

  const array = new Uint8Array(16)
  crypto.getRandomValues(array)

  const guaranteed = [
    upper[array[0] % upper.length],
    lower[array[1] % lower.length],
    digits[array[2] % digits.length],
    symbols[array[3] % symbols.length],
  ]

  const remaining = Array.from(array.slice(4), b => all[b % all.length])
  const combined = [...guaranteed, ...remaining]

  const shuffleBytes = new Uint8Array(combined.length)
  crypto.getRandomValues(shuffleBytes)
  for (let i = combined.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]]
  }

  return combined.join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validate caller JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token)

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerId = claimsData.claims.sub
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Check caller is group_admin
    const { data: isAdmin, error: roleError } = await adminClient.rpc('has_role', {
      _user_id: callerId,
      _role: 'group_admin'
    })

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only group admins can reset passwords' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input
    const body = await req.json()
    const userId = body?.user_id

    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent resetting own password via this endpoint
    if (userId === callerId) {
      return new Response(
        JSON.stringify({ error: 'Cannot reset your own password via this endpoint. Use the change password feature instead.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate new temporary password
    const temporaryPassword = generateSecurePassword()

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
    })

    if (updateError) {
      console.error('Error resetting password:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Password reset for user:', userId, 'by admin:', callerId)

    return new Response(
      JSON.stringify({
        success: true,
        temporary_password: temporaryPassword,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
