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
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/meetings.space.created https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/contacts.other.readonly');
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
      if (isMobileSafari) {
        console.log('🔐 Mobile Safari detected, using direct navigation (popups blocked)');
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
      
      // Longer timeout for mobile users (3 minutes for Safari)
      const timeoutDuration = isMobileSafari ? 180000 : (isMobile ? 120000 : 60000);
      setTimeout(() => {
        clearInterval(checkInterval);
        window.removeEventListener('focus', handleFocus);
        console.log('🔐 OAuth timeout after', timeoutDuration / 1000, 'seconds for', isMobileSafari ? 'Mobile Safari' : (isMobile ? 'Mobile' : 'Desktop'));
        resolveOnce(false);
      }, timeoutDuration);
    });
  }

  public async handleAuthCallback(code: string, state: string): Promise<boolean> {
    try {
      console.log('🔐 Processing OAuth callback...');
      
      // Verify state
      const storedState = localStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid OAuth state');
      }
      
      // Exchange code for tokens
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
        throw new Error('Failed to exchange code for tokens');
      }
      
      const tokens = await tokenResponse.json();
      this.accessToken = tokens.access_token;
      const refreshToken = tokens.refresh_token;
      
      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }
      
      const userInfo = await userResponse.json();
      this.currentUser = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      };
      
      // Store auth data
      localStorage.setItem('google_access_token', this.accessToken);
      localStorage.setItem('google_user', JSON.stringify(this.currentUser));
      if (refreshToken) {
        localStorage.setItem('google_refresh_token', refreshToken);
      }
      localStorage.removeItem('oauth_state');
      
      // Store auth data temporarily in sessionStorage for later Supabase creation
      const tempAuthData = {
        email: this.currentUser.email,
        name: this.currentUser.name,
        accessToken: this.accessToken,
        refreshToken: refreshToken,
        clientId: this.clientId,
        clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET
      };
      
      sessionStorage.setItem('temp_google_auth', JSON.stringify(tempAuthData));
      console.log('✅ Google auth data stored temporarily, will create Supabase record after phone collection');
      
      // Log successful OAuth (but not full record creation yet)
      await loggingService.logGoogleOAuthSuccess('temp_user', this.currentUser.email, {
        email: this.currentUser.email,
        name: this.currentUser.name,
        refreshToken: !!refreshToken
      });
      
      console.log('✅ Google OAuth successful');
      
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      try {
        await loggingService.logGoogleOAuthError(undefined, error instanceof Error ? error.message : 'OAuth callback failed');
      } catch (logError) {
        console.warn('Failed to log OAuth error:', logError);
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

  public async getAccessToken(): Promise<string | null> {
    return this.accessToken;
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