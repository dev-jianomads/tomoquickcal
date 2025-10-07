import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Calendar, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { supabaseService } from '../services/supabase';
import { loggingService } from '../services/logging';

const ReauthCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, isLoading, error } = useGoogleAuth();
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isValidatingUser, setIsValidatingUser] = useState(true);
  const [userValidationError, setUserValidationError] = useState<string>('');

  useEffect(() => {
    const validateUser = async () => {
      const userIdParam = searchParams.get('user_id');
      
      if (!userIdParam) {
        setUserValidationError('Missing user ID parameter. Please use the link provided in your email.');
        setIsValidatingUser(false);
        return;
      }

      try {
        console.log('🔍 ReauthCalendar: Validating user ID:', userIdParam);
        
        // Find user by ID in Supabase
        const { data, error } = await supabaseService.supabase
          .from('users')
          .select('id, email, refresh_expired_2')
          .eq('id', userIdParam)
          .single();

        if (error || !data) {
          console.error('❌ User not found:', error);
          setUserValidationError('User not found. Please check the link and try again.');
          
          // Log invalid user ID attempt
          try {
            await loggingService.log('reauth_invalid_user_id', {
              eventData: {
                attempted_user_id: userIdParam,
                error: 'User not found in database',
                timestamp: new Date().toISOString()
              }
            });
          } catch (logError) {
            console.warn('Failed to log invalid user ID:', logError);
          }
          
          setIsValidatingUser(false);
          return;
        }

        console.log('✅ ReauthCalendar: User found:', data.email);
        setUserId(data.id);
        setUserEmail(data.email);

        // Log reauth flow start
        try {
          await loggingService.log('reauth_flow_started', {
            userId: data.id,
            userEmail: data.email,
            eventData: {
              refresh_expired_2: data.refresh_expired_2,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.warn('Failed to log reauth start:', logError);
        }

      } catch (error) {
        console.error('❌ Error validating user:', error);
        setUserValidationError('Error validating user. Please try again.');
      } finally {
        setIsValidatingUser(false);
      }
    };

    validateUser();
  }, [searchParams]);

  const handleReconnectGoogle = async () => {
    if (!userId || !userEmail) {
      console.error('❌ Missing user data for reauth');
      return;
    }

    try {
      console.log('🔄 ReauthCalendar: Starting Google reauth for user:', userEmail);
      
      // Log reauth attempt
      try {
        await loggingService.log('reauth_google_oauth_start', {
          userId,
          userEmail,
          eventData: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log reauth attempt:', logError);
      }

      const success = await signIn();
      
      if (success) {
        console.log('✅ ReauthCalendar: Google reauth successful');
        
        // Get fresh auth data and update the existing user
        const { default: googleAuthService } = await import('../services/googleAuth');
        const currentUser = googleAuthService.getCurrentUser();
        const accessToken = googleAuthService.getAccessToken();
        
        if (currentUser && accessToken) {
          try {
            // Get fresh granted scopes
            console.log('🔍 ReauthCalendar: Checking granted scopes...');
            let grantedScopes = null;
            
            try {
              const scopeResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
              
              if (scopeResponse.ok) {
                const scopeInfo = await scopeResponse.json();
                const scopeString = scopeInfo.scope || '';
                
                // Parse scopes into structured object
                grantedScopes = {
                  calendar_events: scopeString.includes('https://www.googleapis.com/auth/calendar.events'),
                  calendar_readonly: scopeString.includes('https://www.googleapis.com/auth/calendar.readonly'),
                  userinfo_profile: scopeString.includes('https://www.googleapis.com/auth/userinfo.profile'),
                  userinfo_email: scopeString.includes('https://www.googleapis.com/auth/userinfo.email'),
                  meetings_space: scopeString.includes('https://www.googleapis.com/auth/meetings.space.created'),
                  contacts_readonly: scopeString.includes('https://www.googleapis.com/auth/contacts.readonly'),
                  contacts_other_readonly: scopeString.includes('https://www.googleapis.com/auth/contacts.other.readonly'),
                  last_checked: new Date().toISOString(),
                  raw_scope_string: scopeString
                };
                
                console.log('✅ ReauthCalendar: Granted scopes updated:', grantedScopes);
              } else {
                console.warn('⚠️ ReauthCalendar: Failed to fetch scope info');
              }
            } catch (scopeError) {
              console.error('❌ ReauthCalendar: Error checking scopes:', scopeError);
            }

            // Get refresh token from temp storage
            const tempAuthDataStr = localStorage.getItem('temp_google_auth');
            let refreshToken = null;
            
            if (tempAuthDataStr) {
              try {
                const tempAuthData = JSON.parse(tempAuthDataStr);
                refreshToken = tempAuthData.refreshToken;
              } catch (e) {
                console.warn('Could not parse temp auth data for refresh token');
              }
            }

            // Update user tokens and clear refresh_expired_2 flag
            console.log('🔄 ReauthCalendar: Updating user tokens in database...');
            await supabaseService.updateUser(userId, {
              access_token_2: accessToken,
              refresh_token_2: refreshToken,
              refresh_expired_2: false,
              granted_scopes: grantedScopes
            });

            console.log('✅ ReauthCalendar: User tokens updated successfully');

            // Log successful reauth
            try {
              await loggingService.log('reauth_google_oauth_success', {
                userId,
                userEmail,
                eventData: {
                  tokens_updated: true,
                  refresh_expired_cleared: true,
                  granted_scopes_updated: !!grantedScopes,
                  has_refresh_token: !!refreshToken,
                  timestamp: new Date().toISOString()
                }
              });
            } catch (logError) {
              console.warn('Failed to log reauth success:', logError);
            }

            // Clear temp auth data
            localStorage.removeItem('temp_google_auth');

            // Navigate to success page with reauth flag
            navigate('/success', { 
              state: { 
                reconnected: true,
                userEmail: userEmail
              } 
            });

          } catch (updateError) {
            console.error('❌ ReauthCalendar: Failed to update user tokens:', updateError);
            
            // Log reauth failure
            try {
              await loggingService.log('reauth_google_oauth_error', {
                userId,
                userEmail,
                success: false,
                errorMessage: updateError instanceof Error ? updateError.message : 'Token update failed',
                eventData: {
                  error_type: 'token_update_failed',
                  timestamp: new Date().toISOString()
                }
              });
            } catch (logError) {
              console.warn('Failed to log reauth error:', logError);
            }
            
            throw updateError;
          }
        } else {
          throw new Error('Failed to get user data after OAuth');
        }
      } else {
        console.log('❌ ReauthCalendar: Google reauth failed');
        
        // Log reauth failure
        try {
          await loggingService.log('reauth_google_oauth_error', {
            userId,
            userEmail,
            success: false,
            errorMessage: 'OAuth flow failed',
            eventData: {
              error_type: 'oauth_flow_failed',
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.warn('Failed to log reauth failure:', logError);
        }
      }
    } catch (err) {
      console.error('❌ ReauthCalendar: Reauth error:', err);
      
      // Log unexpected reauth error
      try {
        await loggingService.log('reauth_google_oauth_error', {
          userId,
          userEmail,
          success: false,
          errorMessage: err instanceof Error ? err.message : 'Unknown reauth error',
          eventData: {
            error_type: 'unexpected_error',
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log reauth error:', logError);
      }
    }
  };

  // Show loading state while validating user
  if (isValidatingUser) {
    return (
      <PageContainer>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Validating Account...
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Please wait while we verify your account information.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Show error if user validation failed
  if (userValidationError) {
    return (
      <PageContainer>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Account Not Found
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {userValidationError}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-red-800 text-sm font-medium">
                  Invalid Link
                </p>
                <p className="text-red-700 text-sm">
                  Please use the reconnection link provided in your email or contact support if you continue to have issues.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={() => navigate('/welcome')}>
              Go to Welcome Page
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Show reauth interface
  return (
    <PageContainer>
      <div className="w-full space-y-6">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Reconnect Google Calendar
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Your Google Calendar connection has expired. Please reconnect to continue using Tomo QuickCal.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-orange-800 text-sm font-medium">
                  Connection Expired
                </p>
                <p className="text-orange-700 text-sm">
                  For security reasons, Google periodically expires access tokens. 
                  Simply reconnect to restore your calendar integration.
                </p>
              </div>
            </div>
          </div>

          {userEmail && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <div className="space-y-1">
                <p className="text-blue-800 text-sm font-medium">
                  Account: {userEmail}
                </p>
                <p className="text-blue-700 text-sm">
                  Your Telegram connection and phone number remain active. Only Google Calendar needs to be reconnected.
                </p>
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-green-800 text-sm font-medium">
                  Your privacy is protected
                </p>
                <p className="text-green-700 text-sm">
                  We only create events you explicitly request through Telegram messages. 
                  We never read your existing calendar or personal information.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="w-full max-w-80 mx-auto p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <Button onClick={handleReconnectGoogle} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Reconnecting...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Reconnect Google Calendar
                </div>
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <div className="space-y-2">
              <p className="text-blue-800 text-sm font-medium">
                ⚡ Quick reconnection
              </p>
              <p className="text-blue-700 text-sm">
                This process takes just 30 seconds. Once reconnected, your Tomo QuickCal bot 
                will immediately resume creating calendar events from your Telegram messages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ReauthCalendar;