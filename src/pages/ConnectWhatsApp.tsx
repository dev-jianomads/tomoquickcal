import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Zap, RefreshCw } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useApp } from '../contexts/AppContext';
import { loggingService } from '../services/logging';

const ConnectWhatsApp: React.FC = () => {
  const navigate = useNavigate();
  const { appData, setAppData } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Check if user has account created
  useEffect(() => {
    const checkAccountStatus = async () => {
      console.log('ConnectWhatsApp: Checking account status...', {
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

      // Check if user already has WhatsApp connected via RPC
      try {
        const { supabaseService } = await import('../services/supabase');
        const userData = await supabaseService.findUserByEmail(appData.userEmail);
        const hasWhatsApp = userData?.id ? await supabaseService.userHasService(userData.id, 'whatsapp') : false;

        if (hasWhatsApp) {
          console.log('✅ WhatsApp already connected, redirecting to success');
          navigate('/success', { 
            state: { 
              existingUser: true 
            } 
          });
          return;
        }
        
        console.log('📱 Account exists but no WhatsApp connection, staying on page');
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
        // Continue with normal flow
      }
    };

    checkAccountStatus();
  }, [appData.userId, appData.userEmail, navigate]);

  const handleConnectWhatsApp = async () => {
    console.log('📱 Connect WhatsApp clicked');
    
    if (!appData.userId || !appData.userEmail) {
      console.error('❌ Missing user data for WhatsApp connection');
      setError('Account not found. Please create your account first.');
      setTimeout(() => {
        navigate('/create-account');
      }, 2000);
      return;
    }
    
    setIsConnecting(true);
    setError('');
    setConnectionMessage('Getting your WhatsApp link...');
    
    try {
      // Get user's phone number from Supabase
      const { supabaseService } = await import('../services/supabase');
      const userData = await supabaseService.findUserByEmail(appData.userEmail);
      
      if (!userData?.phone_number) {
        throw new Error('Phone number not found. Please update your account.');
      }
      
      // Call the endpoint to get WhatsApp bot link
      console.log('🔗 Calling WhatsApp signup endpoint...');
      console.log('🔗 Request payload:', {
        user_id: appData.userId,
        phone: userData.phone_number
      });
      
      // Add detailed debugging
      console.log('🔗 Full request details:', {
        url: 'https://n8n.srv845833.hstgr.cloud/webhook/wa-sign-up',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: appData.userId,
          phone: userData.phone_number
        }),
        timestamp: new Date().toISOString()
      });
      
      console.log('🔗 Making POST request to WhatsApp endpoint...');
      
      const response = await fetch('/.netlify/functions/whatsapp-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: appData.userId,
          phone: userData.phone_number
        })
      });
      
      console.log('🔗 WhatsApp endpoint response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ WhatsApp endpoint error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ WhatsApp endpoint response payload:', data);

      // Accept multiple success shapes
      const link = data.link || data.url || data.deepLink || data.whatsapp_link;
      const isSuccess = data.success === true || data.ok === true || typeof data === 'string';

      if (link) {
        // Show redirect message
        setConnectionMessage('Opening WhatsApp...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('🚀 Opening WhatsApp with link:', link);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isSafari || isMobile) {
          window.location.href = link;
        } else {
          window.open(link, '_blank');
        }

        try {
          await loggingService.logTelegramSmsSent(appData.userId, appData.userEmail, 'whatsapp_direct_link');
        } catch (logError) {
          console.warn('Failed to log WhatsApp link generation:', logError);
        }

        setConnectionMessage('WhatsApp opened! Redirecting to completion...');
        setTimeout(() => {
          console.log('🔄 Navigating to success page');
          navigate('/success');
        }, 2000);
      } else if (isSuccess) {
        // Backend succeeded but did not return a link (message sent server-side). Treat as success.
        console.log('✅ WhatsApp message sent server-side; no link returned. Proceeding to success.');
        setConnectionMessage('Message sent on WhatsApp! Redirecting to completion...');
        try {
          await loggingService.logTelegramSmsSent(appData.userId, appData.userEmail, 'whatsapp_message_sent_no_link');
        } catch {}
        setTimeout(() => {
          navigate('/success');
        }, 1500);
      } else {
        throw new Error('No WhatsApp link received from server');
      }
      
    } catch (error) {
      console.error('❌ Failed to connect to WhatsApp:', error);
      
      // Log the failure to Supabase
      try {
        await loggingService.log('whatsapp_connection_failure', {
          userId: appData.userId,
          userEmail: appData.userEmail,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          eventData: {
            failure_type: 'whatsapp_link_generation',
            error_details: error instanceof Error ? error.message : 'Unknown error',
            retry_count: retryCount,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log WhatsApp failure:', logError);
      }
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to connect to WhatsApp. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Phone number not found')) {
          errorMessage = 'Phone number not found. Please update your account.';
        } else if (error.message.includes('HTTP 4')) {
          errorMessage = 'Invalid request. Please check your account details.';
        } else if (error.message.includes('HTTP 5')) {
          errorMessage = 'Server error. Please try again in a few minutes.';
        } else if (error.message.includes('No WhatsApp link')) {
          errorMessage = 'WhatsApp service temporarily unavailable. Please try again.';
        }
      }
      
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Set debug info for troubleshooting
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userId: appData.userId,
        userEmail: appData.userEmail
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setRetryCount(0);
    setDebugInfo(null);
    handleConnectWhatsApp();
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
        </div>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Connect WhatsApp
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Get started with Tomo on WhatsApp. We'll send you a link to start chatting.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">WhatsApp Bot</h3>
                <p className="text-gray-600 text-sm">Chat with Tomo on WhatsApp</p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                <strong>What happens next:</strong> We'll send you a WhatsApp message with a link to start chatting with Tomo.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm mb-2">{error}</p>
              {retryCount > 0 && (
                <p className="text-red-500 text-xs">
                  Attempt {retryCount + 1} failed. You can try again.
                </p>
              )}
            </div>
          )}

          {connectionMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-600 text-sm">{connectionMessage}</p>
            </div>
          )}

          <div className="pt-2">
            <Button 
              onClick={handleConnectWhatsApp} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-4 h-4 animate-pulse" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Connect WhatsApp</span>
                </div>
              )}
            </Button>
          </div>

          {error && retryCount > 0 && (
            <div className="pt-2">
              <Button 
                onClick={handleRetry}
                variant="secondary"
                className="w-full"
              >
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </div>
              </Button>
            </div>
          )}

          {debugInfo && (
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Debug Information
              </summary>
              <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default ConnectWhatsApp;
