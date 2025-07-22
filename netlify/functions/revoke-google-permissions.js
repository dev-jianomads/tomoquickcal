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
    const { userEmail } = JSON.parse(event.body);

    if (!userEmail) {
      console.error('❌ Missing userEmail');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Missing userEmail',
          success: false
        })
      };
    }

    console.log('🔧 Revoking Google permissions for user:', userEmail);

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's access token
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('access_token_2, refresh_token_2')
      .eq('email', userEmail)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching user data:', fetchError);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'User not found',
          success: false
        })
      };
    }

    const accessToken = userData.access_token_2;
    const refreshToken = userData.refresh_token_2;

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

    // Clear tokens from database regardless of revocation success
    try {
      console.log('🔧 Clearing tokens from database...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          access_token_2: null,
          refresh_token_2: null,
          client_id_2: null,
          client_secret_2: null
        })
        .eq('email', userEmail);

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