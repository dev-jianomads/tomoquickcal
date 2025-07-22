import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Shield, Clock, Users, Loader2, MessageCircle } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useApp } from '../contexts/AppContext';

const ConnectCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, error, isSignedIn, isInitialized } = useGoogleAuth();
  const { setAppData } = useApp();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [authError, setAuthError] = React.useState<string>('');

  React.useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Don't auto-redirect on this page - let user manually proceed
        console.log('ConnectCalendar: Auth state check (no auto-redirect):', {
          isSignedIn,
          isInitialized
        });
        
      } catch (error) {
        console.error('ConnectCalendar: Error during auth check:', error);
        setAuthError('Authentication check failed. Please try again.');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    // Always show the page, don't auto-redirect
    setIsCheckingAuth(false);
    checkAuthState();
  }, [isSignedIn, isInitialized]);

  // Show loading state while checking authentication
  if (authError && authError !== '') {
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
              Checking Connection...
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Please wait while we check your Google Calendar connection.
            </p>
          </div>
        </div>
      </PageContainer>
    );
    }

  const handleSignInWithGoogle = async () => {
    try {
      console.log('ConnectCalendar: Sign-in button clicked');
      
      // Check if Google OAuth is configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
      
      console.log('ConnectCalendar: OAuth config check:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdLength: clientId?.length || 0
      });
      
      if (!clientId || !clientSecret) {
        console.log('ConnectCalendar: OAuth not configured, using demo mode');
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
      console.log('ConnectCalendar: Starting OAuth flow...');
      
      // Start the OAuth flow - it will redirect to connect-bot on success
      const success = await signIn();
      
      // If signIn returns true, it means auth completed successfully
      // and we should navigate to connect-bot
      if (success) {
        console.log('ConnectCalendar: OAuth successful, navigating to connect-bot');
        navigate('/connect-bot');
      } else {
        console.log('ConnectCalendar: OAuth failed or timed out');
        // Error will be shown by the useGoogleAuth hook
      }
    } catch (err) {
      console.error('ConnectCalendar: Sign in failed:', err);
    } finally {
      // setIsLoading is handled by the hook
    }
  };


  const handleBack = () => {
    navigate('/welcome');
  };

  return (
    <PageContainer>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>of 3</span>
          </div>
        </div>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Connect Google Calendar and Contacts
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Grant Tomo QuickCal access to create calendar events and find meeting participants from your contacts.
            </p>
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
            </div>
          )}

          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div className="w-full max-w-80 mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-600 text-sm text-center font-medium">Demo Mode</p>
              <p className="text-yellow-600 text-xs text-center mt-1">
                Google OAuth not configured. You can still explore the interface with demo data.
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button onClick={handleSignInWithGoogle} disabled={isLoading || isCheckingAuth}>
              {isLoading ? 'Connecting...' : 'Connect Google Calendar and Contacts'}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ConnectCalendar;