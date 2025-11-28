const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🔧 Netlify Function: slack-signup called');
  console.log('🔧 HTTP Method:', event.httpMethod);
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get N8N webhook URL from environment variable (no fallback)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_SLACK;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!n8nWebhookUrl) {
      console.error('❌ Missing required N8N webhook env var (N8N_WEBHOOK_URL_SLACK)');
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Server misconfiguration: missing N8N webhook URL',
          requiredEnv: ['N8N_WEBHOOK_URL_SLACK']
        })
      };
    }

    // Parse request body (forward as-is)
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    // Prepare masked payload for logging (avoid leaking full token)
    const maskedForLog = {
      ...requestBody,
      token: requestBody?.token ? `${String(requestBody.token).slice(0, 6)}***` : null
    };

    // Log payload about to send (best-effort)
    try {
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from('user_logs').insert([{
          event_type: 'slack_signup_forward_request',
          user_id: requestBody?.user_id || null,
          user_email: null,
          event_data: maskedForLog,
          success: true
        }]);
      }
    } catch (e) {
      console.warn('⚠️ Failed to log slack-signup request (non-blocking):', e?.message);
    }

    // Forward to n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();

    // Log response status/body (masked)
    try {
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from('user_logs').insert([{
          event_type: 'slack_signup_forward_response',
          user_id: requestBody?.user_id || null,
          user_email: null,
          event_data: {
            http_status: response.status,
            ok: response.ok,
            body: responseText?.length > 2000 ? `${responseText.slice(0, 2000)}…` : responseText
          },
          success: response.ok,
          error_message: response.ok ? null : `HTTP ${response.status}`
        }]);
      }
    } catch (e) {
      console.warn('⚠️ Failed to log slack-signup response (non-blocking):', e?.message);
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: `n8n webhook failed: ${response.status}`,
          details: responseText
        })
      };
    }

    let data;
    try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('❌ Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};


