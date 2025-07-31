import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Shield, Clock, Users, Loader2, RefreshCw, MessageCircle } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

const ReconnectCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, isLoading, error, isSignedIn } = useGoogleAuth();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  // Get user context from URL params if available
  const userId = searchParams.get('user_id');
  const isReauth = searchParams.get('reauth') === 'true';

  React.useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Wait a bit for auth state to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isSignedIn) {
          console.log('ReconnectCalendar: User signed in, checking for existing phone number...');
          
          // Get current user info
          const { default: googleAuthService } = await import('../services/googleAuth');
          await googleAuthService.initialize();
          const currentUser = googleAuthService.getCurrentUser();
          
          if (currentUser?.email) {
            try {
              const { supabaseService } = await import('../services/supabase');
              const existingUser = await supabaseService.findUserByEmail(currentUser.email);
              
              if (existingUser?.phone_number && 
                  existingUser.phone_number.trim() !== '' && 
                  existingUser.phone_number !== 'null' &&
                  existingUser.phone_number !== null) {
                console.log('✅ ReconnectCalendar: User found, redirecting to connect-bot for phone check');
                navigate('/connect-bot');
                return;
              }
          
              console.log('ReconnectCalendar: User already signed in, redirecting to test-calendar...');
              navigate('/test-calendar');
            } catch (error) {
              console.log('Could not check user data, redirecting to test-calendar:', error);
              navigate('/test-calendar');
            }
          } else {
            console.log('ReconnectCalendar: User already signed in, redirecting to test-calendar...');
            navigate('/test-calendar');
          }
        } else {
          console.log('ReconnectCalendar: User not signed in, showing reconnect page');
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('ReconnectCalendar: Error during auth check:', error);
        setIsCheckingAuth(false);
      }
    };
      
    checkAuthState();
  }, [isSignedIn, navigate]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
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

  const handleReconnectGoogle = async () => {
    try {
      console.log('ReconnectCalendar: Reconnect button clicked');
      const success = await signIn();
      console.log('ReconnectCalendar: Reconnect result:', success);
      if (success) {
        // After successful reconnection, check if user has phone number
        const { default: googleAuthService } = await import('../services/googleAuth');
        const currentUser = googleAuthService.getCurrentUser();
        
        if (currentUser?.email) {
          try {
            const { supabaseService } = await import('../services/supabase');
            const existingUser = await supabaseService.findUserByEmail(currentUser.email);
            
            console.log('✅ ReconnectCalendar: OAuth successful, redirecting to connect-bot');
            navigate('/connect-bot');
          } catch (error) {
            console.log('Could not check user data, redirecting to connect-bot:', error);
            navigate('/connect-bot');
          }
        } else {
          console.log('ReconnectCalendar: User already signed in, redirecting to connect-bot...');
          navigate('/connect-bot');
        }
      } else {
        console.log('ReconnectCalendar: Reconnect failed, staying on page');
      }
    } catch (err) {
      console.error('ReconnectCalendar: Reconnect failed:', err);
    }
  };

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
              Reconnect Google Calendar and Contacts
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {isReauth 
                ? "Your Google Calendar and Contacts connection has expired. Please reconnect to continue using Tomo QuickCal."
                : "Reconnect your Google Calendar and Contacts to restore full functionality."
              }
            </p>
          </div>

          {isReauth && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-orange-800 text-sm font-medium">
                    Connection Expired
                  </p>
                  <p className="text-orange-700 text-sm">
                    Your Google Calendar access token has expired. This is normal for security reasons. 
                    Simply reconnect to restore your calendar integration.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                  We never read your existing calendar or personal information. Your Telegram connection and phone number remain unchanged.
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
              {isLoading ? 'Reconnecting...' : 'Reconnect Google Calendar'}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <div className="space-y-2">
              <p className="text-blue-800 text-sm font-medium">
                ⚡ Quick reconnection
              </p>
              <p className="text-blue-700 text-sm">
                This process takes just 30 seconds. Once reconnected, your Tomo QuickCal bot 
                will immediately resume creating calendar events and finding contacts from your Telegram messages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ReconnectCalendar;