const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing environment variables' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { user_id, slack_user_id, team_id, app_id, bot_user_id, token } = body;

    if (!user_id || !team_id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing user_id or team_id' })
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const payload = {
      user_id,
      service_id: 'slack',
      external_user_id: slack_user_id || null,
      team_id: team_id || null,
      bot_user_id: bot_user_id || null,
      access_token: token || null, // Optional; avoid logging
      is_active: true
    };

    // Upsert semantics
    let upsertError = null;
    try {
      const { error } = await supabase
        .from('user_integrations')
        .upsert(payload, { onConflict: 'user_id,service_id' });
      upsertError = error;
    } catch (e) {
      upsertError = e;
    }

    if (upsertError) {
      const { data: existing } = await supabase
        .from('user_integrations')
        .select('user_id, service_id')
        .eq('user_id', user_id)
        .eq('service_id', 'slack')
        .maybeSingle();
      if (existing) {
        await supabase
          .from('user_integrations')
          .update(payload)
          .eq('user_id', user_id)
          .eq('service_id', 'slack');
      } else {
        await supabase.from('user_integrations').insert([payload]);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};


