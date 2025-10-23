const { createClient } = require('@supabase/supabase-js');

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
    console.log('🔧 Netlify Function: Starting Google permission revocation...');
    
    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Missing environment variables',
          success: false
        })
      };
    }

    // Parse request body
    const { userEmail, userId } = JSON.parse(event.body);

    if (!userEmail && !userId) {
      console.error('❌ Missing userEmail or userId');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Missing userEmail or userId',
          success: false
        })
      };
    }

    console.log('🔧 Revoking Google permissions for user:', { userEmail, userId });

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve user id from email if necessary
    let resolvedUserId = userId;
    if (!resolvedUserId && userEmail) {
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();
      if (userErr || !userRow) {
        console.error('❌ Error fetching user by email:', userErr);
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'User not found', success: false })
        };
      }
      resolvedUserId = userRow.id;
    }

    // Fetch tokens from normalized table user_integrations (google_calendar)
    const { data: integration, error: integErr } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token')
      .eq('user_id', resolvedUserId)
      .eq('service_id', 'google_calendar')
      .eq('is_active', true)
      .maybeSingle();

    if (integErr) {
      console.error('❌ Error fetching integration:', integErr);
    }

    const accessToken = integration?.access_token || null;
    const refreshToken = integration?.refresh_token || null;

    console.log('🔧 Found user tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    let revocationSuccess = false;
    let revocationError = null;

    // Try to revoke access token first
    if (accessToken) {
      try {
        console.log('🔧 Revoking access token...');
        const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        });

        if (response.ok) {
          console.log('✅ Access token revoked successfully');
          revocationSuccess = true;
        } else {
          const errorText = await response.text();
          console.warn('⚠️ Access token revocation failed:', response.status, errorText);
          revocationError = `Access token revocation failed: ${response.status}`;
        }
      } catch (error) {
        console.error('❌ Error revoking access token:', error);
        revocationError = `Access token revocation error: ${error.message}`;
      }
    }

    // Try to revoke refresh token if access token revocation failed
    if (!revocationSuccess && refreshToken) {
      try {
        console.log('🔧 Revoking refresh token...');
        const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        });

        if (response.ok) {
          console.log('✅ Refresh token revoked successfully');
          revocationSuccess = true;
        } else {
          const errorText = await response.text();
          console.warn('⚠️ Refresh token revocation failed:', response.status, errorText);
          revocationError = `Refresh token revocation failed: ${response.status}`;
        }
      } catch (error) {
        console.error('❌ Error revoking refresh token:', error);
        revocationError = `Refresh token revocation error: ${error.message}`;
      }
    }

    // Clear tokens from database regardless of revocation success (normalized table)
    try {
      console.log('🔧 Clearing tokens from database (user_integrations)...');
      const { error: updateError } = await supabase
        .from('user_integrations')
        .update({
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          token_expiration_date: null,
          refresh_expired: null,
          is_active: false
        })
        .eq('user_id', resolvedUserId)
        .eq('service_id', 'google_calendar');

      if (updateError) {
        console.error('❌ Error clearing tokens from database:', updateError);
      } else {
        console.log('✅ Tokens cleared from database');
      }
    } catch (error) {
      console.error('❌ Error updating database:', error);
    }

    // Return success if either revocation worked or if no tokens were found
    const finalSuccess = revocationSuccess || (!accessToken && !refreshToken);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        success: finalSuccess,
        message: finalSuccess 
          ? 'Google permissions revoked successfully' 
          : 'Failed to revoke Google permissions',
        revocationSuccess,
        error: revocationError,
        hadTokens: !!(accessToken || refreshToken)
      })
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
        success: false,
        details: error.message
      })
    };
  }
};