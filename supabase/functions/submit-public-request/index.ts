import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, requestData, guestInfo } = await req.json();

    console.log('Processing public request submission for token:', token);

    // Validate required fields
    if (!token || !requestData || !guestInfo) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!guestInfo.name || !guestInfo.email) {
      console.error('Guest name and email are required');
      return new Response(
        JSON.stringify({ error: 'Guest name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Validate form link exists and is active
    const { data: formLink, error: linkError } = await supabase
      .from('public_form_links')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (linkError) {
      console.error('Error fetching form link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate form link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!formLink) {
      console.error('Invalid or inactive form link');
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive form link' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if link has expired
    if (formLink.expires_at && new Date(formLink.expires_at) < new Date()) {
      console.error('Form link has expired');
      return new Response(
        JSON.stringify({ error: 'This form link has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Form link validated:', formLink.name);

    // 2. Create the travel request
    const { data: request, error: insertError } = await supabase
      .from('travel_requests')
      .insert({
        pickup_location: requestData.pickup_location,
        dropoff_location: requestData.dropoff_location,
        pickup_datetime: requestData.pickup_datetime,
        return_datetime: requestData.return_datetime || null,
        trip_type: requestData.trip_type || 'one_way',
        passenger_count: requestData.passenger_count || 1,
        purpose: requestData.purpose,
        special_requirements: requestData.special_requirements || null,
        notes: requestData.notes || null,
        guest_name: guestInfo.name,
        guest_email: guestInfo.email,
        guest_phone: guestInfo.phone || null,
        form_link_id: formLink.id,
        is_guest_request: true,
        requester_id: formLink.created_by,
        approver_id: formLink.default_approver_id,
        status: 'pending_approval',
      })
      .select('id, request_number')
      .single();

    if (insertError) {
      console.error('Error creating request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create request: ' + insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Request created:', request.request_number);

    // 3. Increment submission count
    const { error: updateError } = await supabase.rpc('increment_form_submissions', { 
      link_id: formLink.id 
    });

    if (updateError) {
      console.error('Error incrementing submission count:', updateError);
      // Non-critical, continue
    }

    // 4. Log to request history
    await supabase.from('request_history').insert({
      request_id: request.id,
      action: 'Public request submitted',
      to_status: 'pending_approval',
      notes: `Submitted by ${guestInfo.name} (${guestInfo.email}) via public form link "${formLink.name}"`,
    });

    console.log('Request submission completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        requestNumber: request.request_number,
        message: 'Your request has been submitted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
