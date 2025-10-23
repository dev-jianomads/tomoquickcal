exports.handler = async (event, context) => {
  console.log('🔧 Netlify Function: telegram-signup called');
  console.log('🔧 HTTP Method:', event.httpMethod);
  console.log('🔧 Headers:', JSON.stringify(event.headers, null, 2));
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔧 Handling CORS preflight request');
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
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔧 Processing POST request...');
    
    // Get N8N webhook URL from environment variable or use default
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_TG || process.env.N8N_WEBHOOK_URL || 'https://n8n.srv845833.hstgr.cloud/webhook/tg-sign-up';
    console.log('🔧 Using N8N webhook URL:', n8nWebhookUrl);
    
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
      console.log('🔧 Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    const { user_id, email } = requestBody;

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

    // Prepare the exact same payload structure as your Postman test
    const payload = {
      user_id,
      email
    };

    console.log('🔧 Final payload being sent:', JSON.stringify(payload, null, 2));
    console.log('🔧 Making fetch request to:', n8nWebhookUrl);

    // Forward request to n8n webhook using built-in fetch (Node.js 18+)
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function/1.0'
      },
      body: JSON.stringify(payload)
    });

    console.log('🔧 N8N response status:', response.status);
    console.log('🔧 N8N response ok:', response.ok);
    console.log('🔧 N8N response headers:', JSON.stringify([...response.headers.entries()], null, 2));

    // Get response text first
    const responseText = await response.text();
    console.log('🔧 N8N raw response text:', responseText);

    if (!response.ok) {
      console.error('❌ n8n webhook error:', response.status, responseText);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: `n8n webhook failed: ${response.status}`,
          details: responseText,
          url: n8nWebhookUrl,
          payload: payload,
          hint: 'Verify N8N_WEBHOOK_URL_TG env and that the n8n workflow is active and reachable'
        })
      };
    }

    // Try to parse as JSON, fallback to text
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('🔧 Response is not JSON, using as text');
      data = { message: responseText };
    }

    console.log('✅ n8n webhook success:', JSON.stringify(data, null, 2));

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
    console.error('❌ Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      })
    };
  }
};