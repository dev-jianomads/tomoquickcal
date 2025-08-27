import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, ExternalLink, Zap, RefreshCw } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useApp } from '../contexts/AppContext';
import { loggingService } from '../services/logging';

const ConnectTelegram: React.FC = () => {
  const navigate = useNavigate();
  const { appData, setAppData } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Check if user has account created
  useEffect(() => {
    const checkAccountStatus = async () => {
      console.log('ConnectTelegram: Checking account status...', {
        hasUserId: !!appData.userId,
        hasUserEmail: !!appData.userEmail,
        userId: appData.userId,
        userEmail: appData.userEmail
      });

      if (!appData.userId || !appData.userEmail) {
        console.log('❌ No account found, redirecting to create account');
        navigate('/create-account');
        return;
      }

      // Check if user already has Telegram connected
      try {
        const { supabaseService } = await import('../services/supabase');
        const userData = await supabaseService.findUserByEmail(appData.userEmail);
        
        if (userData?.telegram_id) {
          console.log('✅ Telegram already connected, redirecting to success');
          navigate('/success', { 
            state: { 
              existingUser: true 
            } 
          });
          return;
        }
        
        console.log('📱 Account exists but no Telegram connection, staying on page');
      } catch (error) {
        console.error('Error checking Telegram status:', error);
        // Continue with normal flow
      }
    };

    checkAccountStatus();
  }, [appData.userId, appData.userEmail, navigate]);

  const handleConnectTelegram = async () => {
    console.log('🤖 Connect Telegram clicked');
    
    if (!appData.userId || !appData.userEmail) {
      console.error('❌ Missing user data for Telegram connection');
      setError('Account not found. Please create your account first.');
      setTimeout(() => {
        navigate('/create-account');
      }, 2000);
      return;
    }
    
    setIsConnecting(true);
    setError('');
    setConnectionMessage('Getting your Telegram link...');
    
    try {
      // Call the endpoint to get Telegram bot link
      console.log('🔗 Calling Telegram signup endpoint...');
      // 🎯 THIS IS THE ENDPOINT BEING CALLED:
      // URL: https://n8n.srv845833.hstgr.cloud/webhook/tg-sign-up
      // Method: POST
      // Body: { user_id: appData.userId, email: appData.userEmail }
      const response = await fetch('https://n8n.srv845833.hstgr.cloud/webhook/tg-sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: appData.userId,
          email: appData.userEmail
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Telegram link received:', data);
      
      if (!data.link) {
        throw new Error('No Telegram link received from server');
      }
      
      // Show redirect message
      setConnectionMessage('Opening Telegram app...');
      
      // Wait 1.5 seconds to show the message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Open Telegram with the bot link
      console.log('🚀 Opening Telegram app with link:', data.link);
      window.open(data.link, '_blank');
      
      // Log successful Telegram link generation
      try {
        await loggingService.logTelegramSmsSent(appData.userId, appData.userEmail, 'direct_link');
      } catch (logError) {
        console.warn('Failed to log Telegram link generation:', logError);
      }
      
      // Show completion message and navigate to success
      setConnectionMessage('Telegram opened! Redirecting to completion...');
      
      // Wait a bit then navigate to success
      setTimeout(() => {
        console.log('🔄 Navigating to success page');
        navigate('/success');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Failed to connect to Telegram:', error);
      
      // Log the failure
      try {
        await loggingService.log('telegram_connection_failure', {
          userId: appData.userId,
          userEmail: appData.userEmail,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          eventData: {
            failure_type: 'telegram_link_generation',
            error_details: error instanceof Error ? error.message : 'Unknown error',
            retry_count: retryCount,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log Telegram failure:', logError);
      }
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to connect to Telegram. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = 'Account not found. Please complete the account creation process.';
        } else if (error.message.includes('500') || error.message.includes('503')) {
          errorMessage = 'Telegram service temporarily unavailable. Please try again in a moment.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      setError(errorMessage);
      setConnectionMessage('');
      setRetryCount(prev => prev + 1);
      
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setConnectionMessage('');
    handleConnectTelegram();
  };

  const handleBack = () => {
    navigate('/create-account');
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
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>of 3</span>
          </div>
        </div>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Connect to Telegram
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Add @AskTomoBot to your Telegram to start scheduling meetings with simple messages.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Ready to Connect</h3>
            
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs text-green-600">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Google Calendar Connected</p>
                  <p className="text-sm text-gray-600">Ready to create and manage events</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs text-green-600">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Account Created</p>
                  <p className="text-sm text-gray-600">Your Tomo account is ready</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <MessageCircle className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Connect Telegram</p>
                  <p className="text-sm text-gray-600">Final step to enable message-based scheduling</p>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {(isConnecting || connectionMessage) && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  {isConnecting && !connectionMessage.includes('Failed') && (
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <p className={`text-sm font-medium ${
                    connectionMessage.includes('Failed') || connectionMessage.includes('Error')
                      ? 'text-red-700' 
                      : 'text-purple-700'
                  }`}>
                    {connectionMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
                
                {/* Troubleshooting Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-blue-800 text-xs font-medium mb-2">Troubleshooting tips:</p>
                  <ul className="text-blue-700 text-xs space-y-1">
                    <li>• Make sure Telegram is installed on your device</li>
                    <li>• Check you're signed up with the same phone number</li>
                    <li>• Try refreshing the page if the link doesn't work</li>
                    {retryCount > 1 && <li>• If issues persist, try again in a few minutes</li>}
                  </ul>
                </div>
                
                {/* Retry Button */}
                <div className="pt-2">
                  <button
                    onClick={handleRetry}
                    disabled={isConnecting}
                    className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Connect Button */}
          {!isConnecting && !error && (
            <div className="pt-4">
              <Button onClick={handleConnectTelegram}>
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Add Tomo Bot to Telegram</span>
                </div>
              </Button>
            </div>
          )}

          {/* What You Can Do Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 text-left">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">What you'll be able to do:</h3>
            </div>
            <div className="space-y-2 text-gray-700">
              <div className="bg-white/60 rounded-lg p-3 border border-white/40">
                <code className="text-sm">"Schedule meeting with John tomorrow at 2pm"</code>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-white/40">
                <code className="text-sm">"Book lunch with Sarah on Friday at noon"</code>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-white/40">
                <code className="text-sm">"Create team standup Monday 9am"</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ConnectTelegram;