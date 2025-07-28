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
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Tomo QuickCal
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
              Schedule meetings effortlessly through Signal messages. Let's get you set up in just a few steps.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left space-y-4">
          <h3 className="font-semibold text-gray-900">What we'll access:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Create calendar events</p>
                <p className="text-sm text-gray-600">Add meetings and appointments to your calendar</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Invite attendees</p>
                <p className="text-sm text-gray-600">Send calendar invites to meeting participants</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Find and invite people from your Google Contacts</p>
                <p className="text-sm text-gray-600">Contact information is used only for meeting invitations</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Create instant Google Meet calls</p>
                <p className="text-sm text-gray-600">Generate Meet links for quick huddles without calendar events</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Set reminders</p>
                <p className="text-sm text-gray-600">Configure notifications for your events</p>
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
                We only create events you explicitly request through Signal messages. 
                We never read your existing calendar or personal information.
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