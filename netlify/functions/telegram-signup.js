const fetch = require('node-fetch');

exports.handler = async (event, context) => {
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
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔧 Netlify Function: Proxying Telegram signup request...');
    
    // Parse request body
    const { user_id, email } = JSON.parse(event.body);

    if (!user_id || !email) {
      console.error('❌ Missing user_id or email');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Missing user_id or email' })
      };
    }

    console.log('🔧 Forwarding request to n8n:', { user_id, email });

    // Forward request to n8n webhook
    const response = await fetch('https://n8n.srv845833.hstgr.cloud/webhook/tg-sign-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        email
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ n8n webhook error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: `n8n webhook failed: ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log('✅ n8n webhook success:', data);

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
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};