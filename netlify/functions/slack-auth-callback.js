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
    const N8N_WEBHOOK_URL_SLACK = process.env.N8N_WEBHOOK_URL_SLACK;

    if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET || !SLACK_REDIRECT_URL || !N8N_WEBHOOK_URL_SLACK) {
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

    // If we don't have onboardUserId, redirect to success; nothing to send.
    if (!onboardUserId) {
      return {
        statusCode: 302,
        headers: { Location: '/success' },
        body: ''
      };
    }

    // Prepare payload for n8n webhook (do not log sensitive fields)
    const payload = {
      user_id: onboardUserId,
      slack_user_id: authedUserId || null,
      token: accessToken || null,
      team_id: teamId || null,
      app_id: appId || null,
      bot_user_id: botUserId || null,
      scope: scope || null
    };

    // Forward to n8n to create user_integrations row
    try {
      await fetch(N8N_WEBHOOK_URL_SLACK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Netlify-Function/1.0' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Non-blocking: still redirect to success
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


