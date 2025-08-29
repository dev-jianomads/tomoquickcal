import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Calendar, MessageCircle, Trash2, Zap, ExternalLink } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useApp } from '../contexts/AppContext';
import { loggingService } from '../services/logging';

const Success: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAppData, appData } = useApp();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [redirectMessage, setRedirectMessage] = React.useState('');

  useEffect(() => {
    // Set signalLinked as linked when page loads (keeping legacy field name)
    console.log('✅ Success page: Full setup complete');
    console.log('✅ Success page: Component mounted successfully');
    console.log('✅ Success page: Current URL:', window.location.href);
    console.log('✅ Success page: Current pathname:', window.location.pathname);
    console.log('✅ Success page: location.state =', location.state);
    
    const isExistingUser = location.state?.existingUser;
    const isReconnected = location.state?.reconnected;
    console.log('✅ Success page: Is existing user?', isExistingUser);
    console.log('✅ Success page: Is reconnected?', isReconnected);
    
    setAppData(prev => ({ 
      ...prev, 
      signalLinked: true, // Keep same field name for compatibility
      proactiveScheduling: false
    }));
    
    console.log('✅ Success page: Full setup complete');
    
    // Log setup completion
    if (appData.userId && appData.userEmail && !isExistingUser && !isReconnected) {
      loggingService.logSetupCompleted(appData.userId, appData.userEmail, {
        gcalLinked: appData.gcalLinked,
        signalLinked: true,
        proactiveScheduling: false,
        phoneNumber: 'set' // Don't log actual phone number for privacy
      });
    } else if (isExistingUser || isReconnected) {
      console.log('✅ Success page: Existing/reconnected user, skipping setup completion log');
    }
  }, [setAppData, appData.userId, appData.userEmail]);

  const handleAddTomoBot = async () => {
    console.log('🤖 Add Tomo Bot clicked');
    
    if (!appData.userId || !appData.userEmail) {
      console.error('❌ Missing user data for Telegram signup');
      return;
    }
    
    setIsRedirecting(true);
    setRedirectMessage('Getting your Telegram link...');
    
    try {
      // Call the endpoint to get Telegram bot link
      console.log('🔗 Calling Telegram signup endpoint...');
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
      setRedirectMessage('Opening Telegram app...');
      
      // Wait 1.5 seconds to show the message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Open Telegram with the bot link
      console.log('🚀 Opening Telegram app with link:', data.link);
      
      // Safari-specific handling for Telegram links
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                       /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      // Mobile detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isSafari || isMobile) {
        console.log('🍎 Safari or mobile detected, using direct navigation for Telegram link');
        // Safari works better with direct navigation for custom URL schemes
        // Mobile browsers also work better with direct navigation for app links
        window.location.href = data.link;
      } else {
        console.log('🌐 Desktop browser, using window.open');
        window.open(data.link, '_blank');
      }
      
      // Log successful Telegram SMS sent (keeping same event name for consistency)
      try {
        await loggingService.logTelegramSmsSent(appData.userId, appData.userEmail, 'direct_link');
      } catch (logError) {
        console.warn('Failed to log Telegram link generation:', logError);
      }
      
      // Show completion message
      setRedirectMessage('Telegram opened! You can now chat with Tomo.');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsRedirecting(false);
        setRedirectMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Failed to get Telegram link:', error);
      
      // Log the failure to Supabase
      try {
        await loggingService.log('telegram_addbot_failure', {
          userId: appData.userId,
          userEmail: appData.userEmail,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          eventData: {
            failure_type: 'telegram_link_generation',
            error_details: error instanceof Error ? error.message : 'Unknown error',
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
          errorMessage = 'User not found. Please complete the setup process again.';
        } else if (error.message.includes('500') || error.message.includes('503')) {
          errorMessage = 'Telegram service temporarily unavailable. Please try again in a moment.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      setRedirectMessage(errorMessage);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsRedirecting(false);
        setRedirectMessage('');
      }, 5000); // Longer timeout for error messages
    }
  };

  const handleFinish = () => {
    console.log('🔄 Success: Close Setup clicked');
    
    // Check if this window was opened by another window (popup/new tab from a link)
    const canClose = window.opener !== null || window.history.length <= 1;
    
    if (canClose) {
      console.log('🔄 Success: Attempting to close window...');
      try {
        window.close();
        // If close succeeds, this code won't execute
        console.log('🔄 Success: Window close may have failed, showing message');
      } catch (error) {
        console.log('🔄 Success: Window close failed:', error);
      }
    }
    
    // Show a message to user about closing manually
    const shouldShowMessage = !canClose || window.opener === null;
    
    if (shouldShowMessage) {
      // Update the button text to indicate manual close
      const button = document.querySelector('button');
      if (button) {
        button.textContent = 'Please close this tab manually';
        button.disabled = true;
      }
      
      // Show a more prominent message
      setTimeout(() => {
        alert('Setup complete! You can now close this tab and start using Tomo QuickCal through Telegram.');
      }, 500);
    }
  };

  return (
    <PageContainer>
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {location.state?.reconnected ? '🎉 Reconnection Complete!' : '🎉 Setup Complete!'}
          </h1>
          <div className="space-y-2">
            <p className="text-gray-600 text-lg leading-relaxed">
              {location.state?.reconnected 
                ? 'Your Google Calendar has been reconnected. Tomo QuickCal is ready to help you schedule meetings through Telegram.'
                : 'Tomo QuickCal is connected and ready to help you schedule meetings through Telegram.'
              }
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">
              You're all set!
            </h3>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg border border-white/40">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-800 font-medium text-left">Google Connected</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg border border-white/40">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-gray-800 font-medium">Telegram Connected</span>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={handleFinish}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            Close Setup
          </button>
        </div>

        {/* Delete Account Link - Very Bottom */}
        <div className="pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/delete-account')}
            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors flex items-center space-x-1 mx-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </PageContainer>
  );
};

export default Success;