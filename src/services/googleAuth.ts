// Real Google Authentication Service
import { loggingService } from './logging';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isInitialized = false;
  private accessToken: string | null = null;
  private currentUser: GoogleUser | null = null;
  private clientId: string;
  private redirectUri: string;

  private constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    // Use the current origin for redirect URI, but ensure it works for both dev and prod
    this.redirectUri = `${window.location.origin}/oauth-success`;
    
    console.log('🔐 GoogleAuth: Configuration:', {
      clientId: this.clientId ? `${this.clientId.substring(0, 10)}...` : 'Missing',
      redirectUri: this.redirectUri,
      origin: window.location.origin,
      hasClientId: !!this.clientId,
      clientIdLength: this.clientId?.length || 0
    });
  }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔐 GoogleAuth: Initializing...');
    
    // Check if we have the required configuration
    if (!this.clientId) {
      console.log('🔐 GoogleAuth: No client ID configured, running in mock mode');
      this.isInitialized = true;
      return;
    }
    
    // Check if we have stored auth data
    const storedToken = localStorage.getItem('google_access_token');
    const storedUser = localStorage.getItem('google_user');
    const storedRefreshToken = localStorage.getItem('google_refresh_token');
    
    console.log('🔐 GoogleAuth: Stored data check:', {
      hasToken: !!storedToken,
      hasUser: !!storedUser,
      hasRefreshToken: !!storedRefreshToken
    });
    
    if (storedToken && storedUser) {
      try {
        console.log('🔐 GoogleAuth: Restoring from stored data...');
        this.accessToken = storedToken;
        this.currentUser = JSON.parse(storedUser);
        
        console.log('🔐 GoogleAuth: Restored user:', {
          email: this.currentUser?.email,
          name: this.currentUser?.name
        });
        
        // Verify token is still valid
        console.log('🔐 GoogleAuth: Verifying token...');
        const isValid = await this.verifyToken();
        console.log('🔐 GoogleAuth: Token valid:', isValid);
        
        if (!isValid) {
          console.log('🔐 GoogleAuth: Token invalid, clearing stored auth');
          this.clearStoredAuth();
        } else {
          console.log('🔐 GoogleAuth: Token valid, user restored successfully');
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
        this.clearStoredAuth();
      }
    }
    
    this.isInitialized = true;
    console.log('✅ GoogleAuth: Initialization complete', {
      isSignedIn: this.isSignedIn(),
      userEmail: this.currentUser?.email
    });
  }

  private async verifyToken(): Promise<boolean> {
    if (!this.accessToken) return false;
    
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${this.accessToken}`);
      const isValid = response.ok;
      console.log('🔐 GoogleAuth: Token verification result:', isValid);
      return isValid;
    } catch {
      console.log('🔐 GoogleAuth: Token verification failed (network error)');
      return false;
    }
  }

  private clearStoredAuth(): void {
    console.log('🔐 GoogleAuth: Clearing stored auth data');
    this.accessToken = null;
    this.currentUser = null;
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_user');
    localStorage.removeItem('google_refresh_token');
  }

  public async signIn(): Promise<boolean> {
    await this.initialize();
    
    console.log('🔐 GoogleAuth: signIn called, checking configuration...');
    
    // If no client ID, simulate successful auth for demo
    if (!this.clientId) {
      console.log('🔐 GoogleAuth: Mock sign-in for demo mode');
      
      // Create a mock user
      this.currentUser = {
        id: 'demo_user_' + Date.now(),
        email: 'demo@example.com',
        name: 'Demo User',
        picture: ''
      };
      
      this.accessToken = 'demo_token_' + Date.now();
      
      // Store mock data
      localStorage.setItem('google_access_token', this.accessToken);
      localStorage.setItem('google_user', JSON.stringify(this.currentUser));
      
      return true;
    }
    
    console.log('🔐 Starting Google OAuth flow...');
    
    // Validate client secret as well
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      console.log('🔐 GoogleAuth: No client secret, falling back to demo mode');
      // Create a mock user
      this.currentUser = {
        id: 'demo_user_' + Date.now(),
        email: 'demo@example.com',
        name: 'Demo User',
        picture: ''
      };
      
      this.accessToken = 'demo_token_' + Date.now();
      
      // Store mock data
      localStorage.setItem('google_access_token', this.accessToken);
      localStorage.setItem('google_user', JSON.stringify(this.currentUser));
      
      return true;
    }
    
    // Log OAuth start
    try {
      await loggingService.logGoogleOAuthStart();
    } catch (error) {
      console.warn('Failed to log OAuth start:', error);
    }
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isMobileSafari = isMobile && isSafari;
    
    // Generate OAuth URL
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/meetings.space.created https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/contacts.other.readonly');
    const state = Math.random().toString(36).substring(2, 15);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `include_granted_scopes=true`;
    
    console.log('🔐 OAuth URL generated:', authUrl);
    console.log('🔐 Redirect URI:', this.redirectUri);
    console.log('🔐 Device info:', { isMobile, isSafari, isMobileSafari, userAgent: navigator.userAgent });
    
    // Store state for verification
    localStorage.setItem('oauth_state', state);
    
    try {
      // For mobile Safari, ALWAYS use direct navigation (popups don't work)
      if (isMobileSafari || isSafari) {
        console.log('🔐 Safari detected, using direct navigation (popups unreliable)');
        window.location.href = authUrl;
        return new Promise(() => {}); // Never resolves, page will navigate away
      }
      
      // For desktop browsers, try popup first
      console.log('🔐 Desktop browser detected, trying popup');
      const popup = window.open(authUrl, '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.log('🔐 Popup blocked or failed, falling back to direct navigation');
        window.location.href = authUrl;
        return new Promise(() => {}); // Never resolves, page will navigate away
      }
      
      // Monitor popup for closure (desktop only)
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Check if auth was successful
          setTimeout(() => {
            const token = localStorage.getItem('google_access_token');
            if (token) {
              console.log('🔐 Popup OAuth successful');
              // Auth success will be handled by the focus listener below
            } else {
              console.log('🔐 Popup closed without auth success');
            }
          }, 500);
        }
      }, 1000);
      
    } catch (error) {
      console.error('🔐 Error opening OAuth window:', error);
      console.log('🔐 Falling back to direct navigation');
      window.location.href = authUrl;
      return new Promise(() => {}); // Never resolves, page will navigate away
    }
    
    // Return a promise that resolves when auth is complete
    // The OAuth success page will handle the redirect
    return new Promise((resolve) => {
      let resolved = false;
      
      const resolveOnce = (value: boolean) => {
        if (!resolved) {
          resolved = true;
          resolve(value);
        }
      };
      
      // Set up a listener for when the user returns to this tab
      const handleFocus = () => {
        // Check if auth was successful when user returns to this tab
        setTimeout(() => {
          const token = localStorage.getItem('google_access_token');
          if (token) {
            window.removeEventListener('focus', handleFocus);
            resolveOnce(true);
          }
        }, 500);
      };
      
      window.addEventListener('focus', handleFocus);
      
      // Also check periodically in case focus event doesn't fire
      const checkInterval = setInterval(() => {
        const token = localStorage.getItem('google_access_token');
        if (token) {
          clearInterval(checkInterval);
          window.removeEventListener('focus', handleFocus);
          resolveOnce(true);
        }
      }, 1000);
      
      // 3 minutes timeout for all devices
      const timeoutDuration = 180000;
      setTimeout(() => {
        clearInterval(checkInterval);
        window.removeEventListener('focus', handleFocus);
        console.log('🔐 OAuth timeout after', timeoutDuration / 1000, 'seconds');
        resolveOnce(false);
      }, timeoutDuration);
    });
  }

  public async handleAuthCallback(code: string, state: string): Promise<boolean> {
    try {
      console.log('🔐 Processing OAuth callback...', {
        hasCode: !!code,
        hasState: !!state,
        codeLength: code?.length || 0,
        stateLength: state?.length || 0
      });
      
      // Verify state
      const storedState = localStorage.getItem('oauth_state');
      console.log('🔐 State verification:', {
        receivedState: state,
        storedState: storedState,
        statesMatch: state === storedState
      });
      
      if (state !== storedState) {
        console.error('🔐 OAuth state mismatch!', { received: state, stored: storedState });
        throw new Error('Invalid OAuth state');
      }
      
      // Exchange code for tokens
      console.log('🔐 Exchanging code for tokens...');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('🔐 Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText
        });
        throw new Error('Failed to exchange code for tokens');
      }
      
      const tokens = await tokenResponse.json();
      console.log('🔐 Token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in
      });
      
      this.accessToken = tokens.access_token;
      const refreshToken = tokens.refresh_token;

      // If this is a reauth flow, require a fresh refresh_token
      try {
        const isReauth = sessionStorage.getItem('reauth_mode') === '1';
        if (isReauth && !refreshToken) {
          console.warn('🔐 Reauth flow missing refresh_token. Instruct user to revoke access and retry.');
          try {
            await loggingService.log('google_oauth_reauth_missing_refresh', {
              userEmail: this.currentUser?.email,
              eventData: {
                note: 'No new refresh_token on reauth',
                timestamp: new Date().toISOString()
              }
            });
          } catch {}
          localStorage.setItem('reauth_missing_refresh_token', '1');
          // Ensure we do not proceed with a short-lived access token only
          this.clearStoredAuth();
          return false;
        }
      } catch {}
      
      // Check what scopes were actually granted by the user
      console.log('🔐 Checking granted scopes...');
      
      // Log scope collection start
      try {
        await loggingService.log('google_oauth_scope_check_start', {
          userEmail: this.currentUser?.email,
          eventData: {
            access_token_available: !!this.accessToken,
            access_token_length: this.accessToken?.length || 0,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log scope check start:', logError);
      }
      
      let grantedScopes = null;
      try {
        console.log('🔐 Making tokeninfo API call...');
        const scopeResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${this.accessToken}`);
        
        console.log('🔐 Tokeninfo API response:', {
          ok: scopeResponse.ok,
          status: scopeResponse.status,
          statusText: scopeResponse.statusText
        });
        
        // Log API response status
        try {
          await loggingService.log('google_oauth_scope_api_response', {
            userEmail: this.currentUser?.email,
            eventData: {
              api_response_ok: scopeResponse.ok,
              api_response_status: scopeResponse.status,
              api_response_status_text: scopeResponse.statusText,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.warn('Failed to log scope API response:', logError);
        }
        
        if (scopeResponse.ok) {
          const scopeInfo = await scopeResponse.json();
          
          console.log('🔐 Tokeninfo API response data:', {
            hasScopeProperty: 'scope' in scopeInfo,
            scopeType: typeof scopeInfo.scope,
            scopeLength: scopeInfo.scope?.length || 0,
            fullResponse: scopeInfo
          });
          
          const scopeString = scopeInfo.scope || '';
          console.log('🔐 Raw granted scopes:', scopeString);
          
          // Log raw scope string
          try {
            await loggingService.log('google_oauth_scope_raw_data', {
              userEmail: this.currentUser?.email,
              eventData: {
                raw_scope_string: scopeString,
                scope_string_length: scopeString.length,
                scope_string_empty: scopeString === '',
                full_tokeninfo_response: scopeInfo,
                timestamp: new Date().toISOString()
              }
            });
          } catch (logError) {
            console.warn('Failed to log raw scope data:', logError);
          }
          
          // Parse and normalize scopes into structured object
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
          
          console.log('🔐 Parsed granted scopes:', grantedScopes);
          
          // Log parsed scope object
          try {
            await loggingService.log('google_oauth_scope_parsed', {
              userEmail: this.currentUser?.email,
              eventData: {
                parsed_scopes: grantedScopes,
                scope_count: Object.keys(grantedScopes).filter(key => key !== 'last_checked' && key !== 'raw_scope_string' && grantedScopes[key] === true).length,
                has_calendar_events: grantedScopes.calendar_events,
                has_contacts_readonly: grantedScopes.contacts_readonly,
                timestamp: new Date().toISOString()
              }
            });
          } catch (logError) {
            console.warn('Failed to log parsed scope data:', logError);
          }
        } else {
          console.warn('🔐 Failed to fetch scope info:', scopeResponse.status);
          
          // Log scope API failure
          try {
            await loggingService.log('google_oauth_scope_api_failure', {
              userEmail: this.currentUser?.email,
              success: false,
              errorMessage: `Scope API failed with status ${scopeResponse.status}`,
              eventData: {
                api_status: scopeResponse.status,
                api_status_text: scopeResponse.statusText,
                timestamp: new Date().toISOString()
              }
            });
          } catch (logError) {
            console.warn('Failed to log scope API failure:', logError);
          }
        }
      } catch (error) {
        console.error('🔐 Error checking granted scopes:', error);
        
        // Log scope collection error
        try {
          await loggingService.log('google_oauth_scope_collection_error', {
            userEmail: this.currentUser?.email,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown scope collection error',
            eventData: {
              error_type: error instanceof Error ? error.constructor.name : 'Unknown',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              has_access_token: !!this.accessToken,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.warn('Failed to log scope collection error:', logError);
        }
      }
      
      // Log final scope collection result
      try {
        await loggingService.log('google_oauth_scope_collection_complete', {
          userEmail: this.currentUser?.email,
          eventData: {
            granted_scopes_is_null: grantedScopes === null,
            granted_scopes_type: typeof grantedScopes,
            granted_scopes_object: grantedScopes,
            will_be_stored_in_temp_auth: true,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log scope collection complete:', logError);
      }
      
      // Get user info
      console.log('🔐 Fetching user info...');
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('🔐 User info fetch failed:', {
          status: userResponse.status,
          statusText: userResponse.statusText,
          error: errorText
        });
        throw new Error('Failed to get user info');
      }
      
      const userInfo = await userResponse.json();
      console.log('🔐 User info received:', {
        hasId: !!userInfo.id,
        hasEmail: !!userInfo.email,
        hasName: !!userInfo.name,
        email: userInfo.email
      });
      
      this.currentUser = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      };
      
      // Store auth data
      console.log('🔐 Storing auth data in localStorage...');
      localStorage.setItem('google_access_token', this.accessToken);
      localStorage.setItem('google_user', JSON.stringify(this.currentUser));
      if (refreshToken) {
        localStorage.setItem('google_refresh_token', refreshToken);
      }
      localStorage.removeItem('oauth_state');
      console.log('🔐 Auth data stored successfully');
      
      // Store auth data temporarily in sessionStorage for later Supabase creation
      const tempAuthData = {
        email: this.currentUser.email,
        name: this.currentUser.name,
        accessToken: this.accessToken,
        refreshToken: refreshToken,
        clientId: this.clientId,
        clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        grantedScopes: grantedScopes
      };
      
      localStorage.setItem('temp_google_auth', JSON.stringify(tempAuthData));
      console.log('✅ Google auth data stored temporarily for Supabase creation');
      
      // Log what was actually stored in temp_google_auth
      try {
        await loggingService.log('google_oauth_temp_storage', {
          userEmail: this.currentUser?.email,
          eventData: {
            temp_auth_data_keys: Object.keys(tempAuthData),
            has_granted_scopes_in_temp: 'grantedScopes' in tempAuthData,
            granted_scopes_in_temp_is_null: tempAuthData.grantedScopes === null,
            granted_scopes_in_temp_type: typeof tempAuthData.grantedScopes,
            granted_scopes_in_temp_value: tempAuthData.grantedScopes,
            temp_auth_data_size: JSON.stringify(tempAuthData).length,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log temp storage data:', logError);
      }
      
      // For existing users: Update their tokens in Supabase immediately
      try {
        console.log('🔄 Checking if user exists in Supabase for token update...');
        const { supabaseService } = await import('./supabase');
        const existingUser = await supabaseService.findUserByEmail(this.currentUser.email);
        
        if (existingUser) {
          console.log('👤 Existing user found, updating tokens in Supabase...');
          await supabaseService.updateUser(existingUser.id, {
            access_token_2: this.accessToken,
            refresh_token_2: refreshToken,
            // Clear the expired flag on successful OAuth
            refresh_expired_2: false,
            client_id_2: this.clientId,
            client_secret_2: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
            granted_scopes: grantedScopes || null
          });
          console.log('✅ Existing user tokens updated in Supabase');
        } else {
          console.log('👤 New user - tokens will be saved during ConnectBot flow');
        }
      } catch (error) {
        console.error('⚠️ Failed to update existing user tokens (non-critical):', error);
        // Don't fail the OAuth flow if token update fails
      }
      
      // Log successful OAuth (but not full record creation yet)
      console.log('🔐 Logging OAuth success...');
      try {
        await loggingService.logGoogleOAuthSuccess('temp_user', this.currentUser.email, {
          email: this.currentUser.email,
          name: this.currentUser.name,
          refreshToken: !!refreshToken
        });
        console.log('✅ OAuth success logged to Supabase');
      } catch (logError) {
        console.error('❌ Failed to log OAuth success:', logError);
        // Don't fail the OAuth flow if logging fails
      }
      
      console.log('✅ Google OAuth successful');
      
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      console.error('OAuth callback error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      try {
        await loggingService.logGoogleOAuthError(undefined, error instanceof Error ? error.message : 'OAuth callback failed');
        console.log('✅ OAuth error logged to Supabase');
      } catch (logError) {
        console.error('❌ Failed to log OAuth error:', logError);
      }
      this.clearStoredAuth();
      return false;
    }
  }

  public async signOut(): Promise<void> {
    console.log('🔐 Google sign-out...');
    
    if (this.accessToken) {
      try {
        // Revoke token
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }
    
    this.clearStoredAuth();
    console.log('✅ Google sign-out complete');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public isSignedIn(): boolean {
    return !!this.accessToken && !!this.currentUser;
  }

  public getCurrentUser(): GoogleUser | null {
    return this.currentUser;
  }

  public async createCalendarEvent(eventDetails: CalendarEvent): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not signed in to Google');
    }

    console.log('📅 Creating Google Calendar event:', eventDetails.summary);
    
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventDetails),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Calendar API error: ${error.error?.message || 'Unknown error'}`);
      }
      
      const event = await response.json();
      console.log('✅ Google Calendar event created:', event.id);
      return event;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }
}

export default GoogleAuthService.getInstance();