const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: ''
    };
  }

  try {
    const params = new URLSearchParams(event.rawQuery || event.rawQueryString || '');
    const code = params.get('code');
    const state = params.get('state');
    const errorParam = params.get('error');

    if (errorParam) {
      return {
        statusCode: 302,
        headers: { Location: '/success' },
        body: ''
      };
    }

    const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
    const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
    const SLACK_REDIRECT_URL = process.env.SLACK_REDIRECT_URL;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET || !SLACK_REDIRECT_URL || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing environment variables' })
      };
    }

    if (!code) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing OAuth code' })
      };
    }

    // Exchange code for tokens
    const tokenResp = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        redirect_uri: SLACK_REDIRECT_URL
      })
    });
    const tokenJson = await tokenResp.json();
    if (!tokenJson.ok) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Slack token exchange failed' })
      };
    }

    // Extract fields
    const teamId = tokenJson.team && tokenJson.team.id;
    const appId = tokenJson.app_id;
    const botUserId = tokenJson.bot_user_id;
    const accessToken = tokenJson.access_token; // bot token
    const scope = tokenJson.scope;
    const authedUserId = tokenJson.authed_user && tokenJson.authed_user.id;

    // Resolve user_id from state if provided
    let onboardUserId = null;
    try {
      if (state) {
        const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        if (parsed && parsed.user_id) onboardUserId = parsed.user_id;
      }
    } catch {}

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // If we don't have onboardUserId, we cannot link to a specific user safely.
    // Redirect to /success, frontend can complete linking via RPC if needed.
    if (!onboardUserId) {
      return {
        statusCode: 302,
        headers: { Location: '/success' },
        body: ''
      };
    }

    // Upsert into user_integrations (service_id='slack')
    // We avoid logging sensitive values like tokens.
    const payload = {
      user_id: onboardUserId,
      service_id: 'slack',
      external_user_id: authedUserId || null,
      team_id: teamId || null,
      bot_user_id: botUserId || null,
      access_token: accessToken || null,
      scopes: scope || null,
      is_active: true
    };

    // Attempt upsert; if onConflict not available, fallback to update or insert
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
      // Fallback: check if record exists then update/insert
      const { data: existing } = await supabase
        .from('user_integrations')
        .select('user_id, service_id')
        .eq('user_id', onboardUserId)
        .eq('service_id', 'slack')
        .maybeSingle();
      if (existing) {
        await supabase
          .from('user_integrations')
          .update(payload)
          .eq('user_id', onboardUserId)
          .eq('service_id', 'slack');
      } else {
        await supabase.from('user_integrations').insert([payload]);
      }
    }

    return {
      statusCode: 302,
      headers: { Location: '/success' },
      body: ''
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};


