const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get environment variables (available server-side in Netlify Functions)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this
    const googleClientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;

    if (!supabaseUrl || !supabaseServiceKey || !googleClientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing environment variables' })
      };
    }

    // Parse request body
    const { userEmail, clientId } = JSON.parse(event.body);

    if (!userEmail || !clientId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userEmail or clientId' })
      };
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update user record with client credentials
    const { data, error } = await supabase
      .from('users')
      .update({
        client_id_2: clientId,
        client_secret_2: googleClientSecret
      })
      .eq('email', userEmail)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database update failed' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Client credentials updated successfully' 
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};