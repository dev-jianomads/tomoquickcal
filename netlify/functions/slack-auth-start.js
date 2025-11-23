const crypto = require('crypto');

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
    const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
    // Default scopes aligned with your Slack app configuration; override via SLACK_SCOPES if needed
    const SLACK_SCOPES = process.env.SLACK_SCOPES || [
      'app_mentions:read',
      'channels:history',
      'channels:join',
      'channels:read',
      'chat:write',
      'emoji:read',
      'groups:history',
      'im:history',
      'im:read',
      'im:write',
      'links:read',
      'links:write',
      'reactions:write',
      'team:read',
      'users:read',
      'users:read.email'
    ].join(',');
    const SLACK_REDIRECT_URL = process.env.SLACK_REDIRECT_URL;

    if (!SLACK_CLIENT_ID || !SLACK_REDIRECT_URL) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Missing Slack OAuth environment variables',
          requiredEnv: ['SLACK_CLIENT_ID', 'SLACK_REDIRECT_URL', 'SLACK_SCOPES (optional)']
        })
      };
    }

    // Optional: pass through user_id via query param so we can map after callback
    const url = new URL(event.headers.referer || 'https://cal.hellotomo.ai');
    const userId = (url.searchParams && url.searchParams.get('user_id')) || null;
    const rawState = JSON.stringify({
      v: 1,
      ts: Date.now(),
      user_id: userId
    });
    const state = Buffer.from(rawState).toString('base64url');

    // Build Slack OAuth v2 URL
    const authorizeUrl = new URL('https://slack.com/oauth/v2/authorize');
    authorizeUrl.searchParams.set('client_id', SLACK_CLIENT_ID);
    authorizeUrl.searchParams.set('scope', SLACK_SCOPES);
    authorizeUrl.searchParams.set('redirect_uri', SLACK_REDIRECT_URL);
    authorizeUrl.searchParams.set('state', state);

    return {
      statusCode: 302,
      headers: {
        Location: authorizeUrl.toString(),
        'Access-Control-Allow-Origin': '*'
      },
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


