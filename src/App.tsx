import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Welcome from './pages/Welcome';
import CreateAccount from './pages/CreateAccount';
import ConnectTelegram from './pages/ConnectTelegram';
import ConnectWhatsApp from './pages/ConnectWhatsApp';
import Success from './pages/Success';
import ReauthCalendar from './pages/ReauthCalendar';
import DeleteAccount from './pages/DeleteAccount';

// Handle reauth URL parameters and redirect appropriately
const ReauthRedirectHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  React.useEffect(() => {
    const isReauth = searchParams.get('reauth') === 'true';
    const userId = searchParams.get('user_id');
    
    console.log('🔄 ReauthRedirectHandler: Processing URL params:', {
      isReauth,
      userId,
      fullUrl: window.location.href,
      searchString: window.location.search
    });
    
    if (isReauth && userId) {
      console.log('🔄 Reauth detected, redirecting to reauth-calendar with user_id:', userId);
      window.location.href = `/reauth-calendar?user_id=${userId}`;
    } else {
      console.log('🔄 No reauth params, redirecting to welcome');
      window.location.href = '/welcome';
    }
  }, [searchParams]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Processing request...</p>
      </div>
    </div>
  );
};

// Simple component to handle OAuth success and redirect
const OAuthSuccessHandler: React.FC = () => {
  const [isProcessing, setIsProcessing] = React.useState(true);
  
  React.useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        console.log('🔄 OAuthSuccessHandler: Starting OAuth callback processing...');
        console.log('🔄 OAuthSuccessHandler: Current URL:', window.location.href);
        console.log('🔄 OAuthSuccessHandler: URL search params:', window.location.search);
        setIsProcessing(true);
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        console.log('🔄 OAuthSuccessHandler: URL parameters:', {
          hasCode: !!code,
          hasState: !!state,
          hasError: !!error,
          codeLength: code?.length || 0,
          stateLength: state?.length || 0,
          error: error
        });
        
        if (error) {
          console.error('🔄 OAuthSuccessHandler: OAuth error in URL:', error);
          throw new Error(`OAuth error: ${error}`);
        }
        
        if (code && state) {
          console.log('🔄 OAuthSuccessHandler: Valid code and state found, processing...');
          // Import and handle OAuth callback
          const { default: googleAuthService } = await import('./services/googleAuth');
          console.log('🔄 OAuthSuccessHandler: GoogleAuthService imported, calling handleAuthCallback...');
          const success = await googleAuthService.handleAuthCallback(code, state);
          console.log('🔄 OAuthSuccessHandler: handleAuthCallback result:', success);
          
          if (success) {
            console.log('🔄 OAuthSuccessHandler: OAuth successful, deciding next route...');
            // Determine deep-link context (persisted in localStorage by Welcome)
            const deeplinkService = (localStorage.getItem('deeplink_service') || '').toLowerCase();
            const deeplinkId = localStorage.getItem('deeplink_id') || '';

            let nextRoute = '/create-account';
            try {
              if (deeplinkService === 'whatsapp') {
                // For WhatsApp deep link: if user already complete, skip CreateAccount
                const currentUser = googleAuthService.getCurrentUser();
                if (currentUser?.email) {
                  const { supabaseService } = await import('./services/supabase');
                  const user = await supabaseService.findUserByEmail(currentUser.email);
                  if (user) {
                    const hasPhone = !!(user.phone_number && user.phone_number.trim() !== '' && user.phone_number !== 'null');
                    const hasGcal = await supabaseService.userHasService(user.id, 'google_calendar');
                    const hasWA = await supabaseService.userHasService(user.id, 'whatsapp');
                    if (hasPhone && hasGcal) {
                      nextRoute = '/success';
                      // Safety net: ensure WhatsApp integration exists; trigger if missing
                      if (!hasWA) {
                        try {
                          console.log('🛠️ OAuthSuccessHandler: WhatsApp integration missing; triggering webhook');
                          const response = await fetch('/.netlify/functions/whatsapp-signup', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: user.id, phone: user.phone_number })
                          });
                          const respText = await response.text();
                          try {
                            const { loggingService } = await import('./services/logging');
                            await loggingService.log('onboarding_path', {
                              userId: user.id,
                              userEmail: user.email,
                              eventData: {
                                path: 'whatsapp_deeplink_oauth_handler_auto_repair',
                                response_ok: response.ok,
                                response_status: response.status,
                                response_body: respText
                              }
                            });
                          } catch {}
                        } catch (e) {
                          console.warn('OAuthSuccessHandler: WhatsApp webhook safety-net error (non-blocking):', e);
                        }
                      }
                    }
                    console.log('🔄 OAuthSuccessHandler: Deep link decision', { hasPhone, hasGcal, hasWA, nextRoute });
                  }
                }
              }
            } catch (deeplinkCheckErr) {
              console.warn('⚠️ OAuthSuccessHandler: deeplink decision check failed, defaulting to CreateAccount', deeplinkCheckErr);
              nextRoute = '/create-account';
            }

            // Clear deeplink flags after decision
            try { localStorage.removeItem('deeplink_service'); localStorage.removeItem('deeplink_id'); } catch {}

            // Navigate
            if (window.opener && !window.opener.closed) {
              console.log('🔄 OAuthSuccessHandler: In OAuth tab, redirecting main tab to', nextRoute);
              window.opener.location.href = nextRoute;
              window.close();
            } else {
              console.log('🔄 OAuthSuccessHandler: In main tab, navigating to', nextRoute);
              window.location.href = nextRoute;
            }
          } else {
            console.log('🔄 OAuthSuccessHandler: OAuth failed, redirecting to /welcome');
            if (window.opener && !window.opener.closed) {
              window.opener.location.href = '/welcome';
              window.close();
            } else {
              window.location.href = '/welcome';
            }
          }
        } else {
          console.log('🔄 OAuthSuccessHandler: No OAuth code, redirecting to /welcome');
          if (window.opener && !window.opener.closed) {
            window.opener.location.href = '/welcome';
            window.close();
          } else {
            window.location.href = '/welcome';
          }
        }
      } catch (error) {
        console.error('OAuthSuccessHandler error:', error);
        if (window.opener && !window.opener.closed) {
          window.opener.location.href = '/welcome';
          window.close();
        } else {
          window.location.href = '/welcome';
        }
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleOAuthSuccess();
  }, []);
  
  // Show minimal loading state (should be very brief)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Completing authentication...</p>
          </>
        ) : (
          <p className="text-gray-600">Redirecting...</p>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<ReauthRedirectHandler />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/connect-telegram" element={<ConnectTelegram />} />
            <Route path="/connect-whatsapp" element={<ConnectWhatsApp />} />
            <Route path="/success" element={<Success />} />
            <Route path="/reauth-calendar" element={<ReauthCalendar />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            {/* Legacy redirects */}
            <Route path="/landing" element={<Navigate to="/welcome" replace />} />
            {/* OAuth success page for handling redirects */}
            <Route path="/oauth-success" element={<OAuthSuccessHandler />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}


export default App;