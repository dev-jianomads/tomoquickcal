import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageCircle, Shield, Clock, Users, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useApp } from '../contexts/AppContext';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, error, isSignedIn, isInitialized, checkAgain, showCheckAgain } = useGoogleAuth();
  const { setAppData } = useApp();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  // Debug: Log all detection variables
  console.log('🔍 Telegram Detection Debug:', {
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    windowTelegram: !!(window as any).Telegram,
    windowTelegramWebApp: !!(window as any).Telegram?.WebApp,
    locationSearch: window.location.search,
    locationHref: window.location.href,
    isTgMiniApp: !!(window as any).Telegram?.WebApp,
    isTelegramUA: /\bTelegram\b/i.test(navigator.userAgent) || /TgWebView/i.test(navigator.userAgent),
    referrerIncludesTelegram: document.referrer.includes('t.me') || document.referrer.includes('telegram'),
    urlHasTgParam: window.location.search.includes('tgWebAppPlatform'),
    finalResult: !!(window as any).Telegram?.WebApp || 
                 /\bTelegram\b/i.test(navigator.userAgent) || 
                 /TgWebView/i.test(navigator.userAgent) ||
                 document.referrer.includes('t.me') ||
                 document.referrer.includes('telegram') ||
                 window.location.search.includes('tgWebAppPlatform')
  });

  // Enhanced Telegram detection
  const isTgMiniApp = !!(window as any).Telegram?.WebApp;
  
  // Check for Telegram-specific indicators
  const isTelegramUA = /\bTelegram\b/i.test(navigator.userAgent) || 
                       /TelegramBot/i.test(navigator.userAgent) ||
                       navigator.userAgent.includes('TgWebView');
  
  const referrerIncludesTelegram = document.referrer.includes('t.me') || document.referrer.includes('telegram');
  const urlHasTgParam = window.location.search.includes('tgWebAppPlatform');
  
  // Check for Telegram-specific window properties and APIs
  const hasTelegramAPI = !!(window as any).Telegram || 
                         !!(window as any).TelegramWebviewProxy ||
                         !!(window as any).TelegramGameProxy;
  
  // Check if opened from Telegram (iOS Safari doesn't set referrer but has other indicators)
  const isLikelyTelegramContext = window.name === 'telegram-web-app' ||
                                  window.location.search.includes('tgWebAppStartParam') ||
                                  window.location.search.includes('tgWebAppData') ||
                                  window.location.hash.includes('tgWebAppData');
  
  // Check for iOS Safari opened from Telegram (common pattern)
  const isIOSSafariFromTelegram = /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
                                  /Safari/i.test(navigator.userAgent) &&
                                  !window.chrome && // Not Chrome
                                  (hasTelegramAPI || isLikelyTelegramContext);
  
  // Detect Telegram in-app browser (including iOS Safari opened from Telegram)
  const isTelegramBrowser = isTgMiniApp || 
                           isTelegramUA ||
                           referrerIncludesTelegram ||
                           urlHasTgParam ||
                           hasTelegramAPI ||
                           isLikelyTelegramContext ||
                           isIOSSafariFromTelegram;

  console.log('🔍 Telegram Detection Result:', {
    isTgMiniApp,
    isTelegramUA,
    referrerIncludesTelegram,
    urlHasTgParam,
    hasTelegramAPI,
    isLikelyTelegramContext,
    isIOSSafariFromTelegram,
    isTelegramBrowser,
  });

  React.useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Don't auto-redirect on this page - let user manually proceed
        console.log('Welcome: Auth state check (no auto-redirect):', {
          isSignedIn,
          isInitialized
        });
        
      } catch (error) {
        console.error('Welcome: Error during auth check:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    // Always show the page, don't auto-redirect
    setIsCheckingAuth(false);
    checkAuthState();
  }, [isSignedIn, isInitialized]);

  const handleConnectGoogle = async () => {
    try {
      console.log('Welcome: Connect Google button clicked');
      
      // Enhanced Telegram detection - block OAuth in Telegram browser
      if (isTelegramBrowser) {
        console.log('Welcome: Telegram browser detected, OAuth blocked');
        return; // Don't start OAuth, UI will show instructions instead
      }
      
      // Check if Google OAuth is configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
      
      console.log('Welcome: OAuth config check:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdLength: clientId?.length || 0
      });
      
      if (!clientId || !clientSecret) {
        console.log('Welcome: OAuth not configured, using demo mode');
        // Simulate successful auth for demo
        setAppData(prev => ({ 
          ...prev, 
          gcalLinked: true,
          userEmail: 'demo@example.com' 
        }));
        navigate('/connect-bot');
        return;
      }
      
      // Show loading state immediately
      console.log('Welcome: Starting OAuth flow...');
      
      // Start the OAuth flow - it will redirect to connect-bot on success
      const success = await signIn();
      
      // If signIn returns true, it means auth completed successfully
      // and we should navigate to connect-bot
      if (success) {
        console.log('Welcome: OAuth successful, navigating to connect-bot');
        navigate('/connect-bot');
      } else {
        console.log('Welcome: OAuth failed or timed out');
        // Error will be shown by the useGoogleAuth hook
      }
    } catch (err) {
      console.error('Welcome: Connect Google failed:', err);
    }
  };

  const handleCheckAgain = async () => {
    console.log('Welcome: Check Again button clicked');
    const success = await checkAgain();
    if (success) {
      console.log('Welcome: Check again successful, navigating to connect-bot');
      navigate('/connect-bot');
    }
  };

  return (
    <>
      <PageContainer>
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-3">
                <div className="text-blue-500 text-lg">←</div>
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                <div className="text-blue-500 text-lg">→</div>
              </div>
            </div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Hello Tomo QuickCal
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
              Schedule meetings effortlessly through Telegram messages.
            </p>
          </div>
        </div>

        {/* Telegram Browser Detection - Show merged instruction box */}
        {isTelegramBrowser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-blue-800 text-sm font-medium">
                  Tap the menu (⋯) then "Open in Browser"
                </p>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-700 text-sm">
                    Why? Telegram's browser doesn't support Google authentication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left space-y-4">
          <h3 className="font-semibold text-gray-900">What Tomo'll access and be able to do for you:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Check your availability in Google Calendar</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Add and amend events in your calendar</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Find and invite people from your Google Contacts</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Create instant Google Meet calls</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-green-800 text-sm font-medium">
                Your privacy is protected
              </p>
              <p className="text-green-700 text-sm">
                Tomo only reads your calendar to check availability and creates/edits events that you explicitly request through Telegram messages. 
                We never use your personal information beyond what's needed for scheduling.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="w-full max-w-80 mx-auto p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
            {/iPhone|iPad|iPod/i.test(navigator.userAgent) && (
              <div className="mt-2 text-xs text-red-500 text-center">
                <p className="font-medium">Safari users:</p>
                <p>Settings → Safari → Privacy & Security → Turn OFF "Prevent Cross-Site Tracking"</p>
              </div>
            )}
            {showCheckAgain && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <button
                  onClick={handleCheckAgain}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Checking...' : 'Check Again'}
                </button>
                <p className="mt-1 text-xs text-red-600 text-center">
                  Click if you completed authentication in another tab
                </p>
              </div>
            )}
          </div>
        )}

        {isTelegramBrowser ? (
          // Telegram Browser - Show Instructions UI
          <div className="space-y-4"></div>
        ) : (
          // Regular Browser - Show Connect Button
          <div className="space-y-4">
            <Button
              onClick={handleConnectGoogle}
              disabled={isLoading || isCheckingAuth}
              className="w-full max-w-80 mx-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Connect Google Calendar and Contacts
                </div>
              )}
            </Button>
            
            <p className="text-gray-500 text-sm max-w-80 mx-auto">
              You'll be redirected to Google to securely connect your calendar
            </p>
          </div>
        )}
      </div>
      </PageContainer>

      {/* Debug UI - Restored for Android testing */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded-lg max-w-xs">
        <div className="font-bold mb-2">Debug Info:</div>
        <div>isTelegramBrowser: {isTelegramBrowser.toString()}</div>
        <div>isTgMiniApp: {isTgMiniApp.toString()}</div>
        <div>isTelegramUA: {isTelegramUA.toString()}</div>
        <div>hasTelegramAPI: {hasTelegramAPI.toString()}</div>
        <div>isLikelyTelegramContext: {isLikelyTelegramContext.toString()}</div>
        <div>isIOSSafariFromTelegram: {isIOSSafariFromTelegram.toString()}</div>
        <div>referrer: {document.referrer || 'none'}</div>
        <div>windowName: {window.name || 'none'}</div>
        <div>search: {window.location.search || 'none'}</div>
        <div>hash: {window.location.hash || 'none'}</div>
        <div>userAgent: {navigator.userAgent.substring(0, 50)}...</div>
      </div>
    </>
  );
};

export default Welcome;