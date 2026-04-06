import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CreateUserRequest {
  identifier_type?: 'email' | 'phone'
  email?: string
  full_name: string
  phone?: string
  employee_id?: string
  department?: string
  cost_center?: string
  roles: string[]
  primary_location_id?: string
}

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const symbols = '!@#$%&*'
  const all = upper + lower + digits + symbols

  const array = new Uint8Array(16)
  crypto.getRandomValues(array)

  // Guarantee at least one of each category
  const guaranteed = [
    upper[array[0] % upper.length],
    lower[array[1] % lower.length],
    digits[array[2] % digits.length],
    symbols[array[3] % symbols.length],
  ]

  // Fill remaining 12 characters
  const remaining = Array.from(array.slice(4), b => all[b % all.length])
  const combined = [...guaranteed, ...remaining]

  // Shuffle using Fisher-Yates
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
      console.error('Missing or invalid authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('Failed to verify JWT:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerId = claimsData.claims.sub
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: isAdmin, error: roleError } = await adminClient.rpc('has_role', {
      _user_id: callerId,
      _role: 'group_admin'
    })

    if (roleError) {
      console.error('Error checking admin role:', roleError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isAdmin) {
      console.error('User is not a group_admin:', callerId)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only group admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: CreateUserRequest = await req.json()
    const identifierType = body.identifier_type || 'email'
    
    if (!body.full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: full_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validRoles = ['staff', 'driver', 'approver', 'location_coordinator', 'group_admin']
    if (body.roles && body.roles.length > 0) {
      for (const role of body.roles) {
        if (!validRoles.includes(role)) {
          return new Response(
            JSON.stringify({ error: `Invalid role: ${role}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Generate secure temporary password server-side
    const temporaryPassword = generateSecurePassword()

    let authData
    let profileEmail: string

    if (identifierType === 'phone') {
      if (!body.phone) {
        return new Response(
          JSON.stringify({ error: 'Phone number is required for phone-based user creation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const phoneRegex = /^\+[1-9]\d{6,14}$/
      if (!phoneRegex.test(body.phone)) {
        return new Response(
          JSON.stringify({ error: 'Phone number must be in E.164 format (e.g. +94771234567)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      profileEmail = body.email && body.email.trim() !== '' ? body.email : `phone_${body.phone.replace(/\+/g, '')}@noemail.local`

      console.log('Creating user with phone:', body.phone)

      const createUserPayload: Record<string, unknown> = {
        phone: body.phone,
        password: temporaryPassword,
        phone_confirm: true,
        user_metadata: {
          full_name: body.full_name
        }
      }

      if (body.email && body.email.trim() !== '') {
        createUserPayload.email = body.email
        createUserPayload.email_confirm = true
      }

      const { data, error: createError } = await adminClient.auth.admin.createUser(createUserPayload)

      if (createError) {
        console.error('Error creating auth user:', createError)
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      authData = data
    } else {
      if (!body.email) {
        return new Response(
          JSON.stringify({ error: 'Email is required for email-based user creation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      profileEmail = body.email

      console.log('Creating user with email:', body.email)

      const { data, error: createError } = await adminClient.auth.admin.createUser({
        email: body.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name
        }
      })

      if (createError) {
        console.error('Error creating auth user:', createError)
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      authData = data
    }

    const newUserId = authData.user.id
    console.log('Auth user created with ID:', newUserId)

    await new Promise(resolve => setTimeout(resolve, 500))

    const profileUpdate: Record<string, unknown> = {
      email: profileEmail,
    }
    if (body.phone) profileUpdate.phone = body.phone
    if (body.employee_id) profileUpdate.employee_id = body.employee_id
    if (body.department) profileUpdate.department = body.department
    if (body.cost_center) profileUpdate.cost_center = body.cost_center

    const { error: profileError } = await adminClient
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', newUserId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    if (body.roles && body.roles.length > 0) {
      const roleInserts = body.roles.map(role => ({
        user_id: newUserId,
        role: role
      }))

      const { error: rolesError } = await adminClient
        .from('user_roles')
        .insert(roleInserts)

      if (rolesError) {
        console.error('Error assigning roles:', rolesError)
      }
    }

    if (body.primary_location_id) {
      const { error: locationError } = await adminClient
        .from('user_locations')
        .insert({
          user_id: newUserId,
          location_id: body.primary_location_id,
          is_primary: true
        })

      if (locationError) {
        console.error('Error assigning location:', locationError)
      }
    }

    console.log('User creation complete:', newUserId)

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUserId,
          email: profileEmail,
          full_name: body.full_name
        },
        temporary_password: temporaryPassword
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})