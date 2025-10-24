import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Calendar, MessageCircle, Trash2, Zap } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useApp } from '../contexts/AppContext';
import { loggingService } from '../services/logging';

const Success: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAppData, appData } = useApp();
  // Removed redirect button UX; no redirecting state needed
  const [telegramConnected, setTelegramConnected] = React.useState<boolean | null>(null);
  const [whatsappConnected, setWhatsappConnected] = React.useState<boolean | null>(null);
  const [statusError, setStatusError] = React.useState<string>('');
  
  // Determine the platform from app context
  const selectedPlatform = appData.selectedPlatform || 'telegram';

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

  // Fetch connection status (Telegram/WhatsApp)
  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!appData.userEmail) {
        setTelegramConnected(null);
        setWhatsappConnected(null);
        return;
      }
      try {
        const { supabaseService } = await import('../services/supabase');
        const user = await supabaseService.findUserByEmail(appData.userEmail);
        if (!user?.id) {
          setTelegramConnected(false);
          setWhatsappConnected(false);
          return;
        }
        const [hasTelegram, hasWhatsApp] = await Promise.all([
          supabaseService.userHasService(user.id, 'telegram'),
          supabaseService.userHasService(user.id, 'whatsapp')
        ]);
        setTelegramConnected(!!hasTelegram);
        setWhatsappConnected(!!hasWhatsApp);
        setStatusError('');
      } catch (err) {
        console.warn('Failed to fetch connection status:', err);
        setStatusError('Could not load connection status.');
      }
    };

    fetchConnectionStatus();
  }, [appData.userEmail]);

  const goConnectTelegram = () => {
    setAppData(prev => ({ ...prev, selectedPlatform: 'telegram' }));
    navigate('/connect-telegram');
  };

  const goConnectWhatsApp = () => {
    setAppData(prev => ({ ...prev, selectedPlatform: 'whatsapp' }));
    navigate('/connect-whatsapp');
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
        alert(`Setup complete! You can now close this tab and start using Hello Tomo through ${selectedPlatform === 'telegram' ? 'Telegram' : 'WhatsApp'}.`);
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
                ? `Your Google Calendar has been reconnected. Hello Tomo is ready to help you schedule meetings through ${selectedPlatform === 'telegram' ? 'Telegram' : 'WhatsApp'}.`
                : `Hello Tomo is connected and ready to help you schedule meetings through ${selectedPlatform === 'telegram' ? 'Telegram' : 'WhatsApp'}.`
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selectedPlatform === 'telegram' ? 'bg-purple-100' : 'bg-green-100'
              }`}>
                <Zap className={`w-4 h-4 ${
                  selectedPlatform === 'telegram' ? 'text-purple-600' : 'text-green-600'
                }`} />
              </div>
              <span className="text-gray-800 font-medium">
                {selectedPlatform === 'telegram' ? 'Telegram' : 'WhatsApp'} Connected
              </span>
            </div>
          </div>
        </div>

        {/* Try it out tip */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left space-y-2">
          <h3 className="font-semibold text-gray-900">Try it out</h3>
          <p className="text-gray-700 text-sm">
            Open your chat app and say: <span className="font-mono">"Create meeting tomorrow 2pm"</span>
          </p>
        </div>

        {/* Connections status card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Connections</h3>
          </div>

          {statusError && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">{statusError}</p>
            </div>
          )}

          <div className="space-y-3">
            {/* Telegram row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Telegram</p>
                  <p className="text-xs text-gray-600">
                    {telegramConnected === null ? 'Checking…' : telegramConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {!telegramConnected && telegramConnected !== null && (
                <Button onClick={goConnectTelegram}>
                  Connect Telegram
                </Button>
              )}
            </div>

            {/* WhatsApp row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">WhatsApp</p>
                  <p className="text-xs text-gray-600">
                    {whatsappConnected === null ? 'Checking…' : whatsappConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {!whatsappConnected && whatsappConnected !== null && (
                <Button onClick={goConnectWhatsApp}>
                  Connect WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={`border rounded-lg p-4 text-left ${
          selectedPlatform === 'telegram' 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-start space-x-3">
            <MessageCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              selectedPlatform === 'telegram' ? 'text-blue-600' : 'text-green-600'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                selectedPlatform === 'telegram' ? 'text-blue-800' : 'text-green-800'
              }`}>
                Look for Tomo's welcome message on {selectedPlatform === 'telegram' ? 'Telegram' : 'WhatsApp'}.
              </p>
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