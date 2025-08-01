import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageCircle, Shield, Clock, Users, Loader2 } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useApp } from '../contexts/AppContext';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, error, isSignedIn, isInitialized } = useGoogleAuth();
  const { setAppData } = useApp();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

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

  return (
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
                Tomo only creates and edits calendar events that you explicitly request through Telegram messages. 
                We never read your existing calendar events or access your personal information beyond what's needed for scheduling.
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
          </div>
        )}

        <div className="pt-4">
          <Button onClick={handleConnectGoogle} disabled={isLoading || isCheckingAuth}>
            {isLoading ? 'Connecting...' : 'Connect Google Calendar and Contacts'}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default Welcome;