import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Calendar, MessageCircle, Sparkles, Trash2 } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useApp } from '../contexts/AppContext';
import { loggingService } from '../services/logging';

const Success: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAppData, appData } = useApp();

  useEffect(() => {
    // Set Signal as linked when page loads, but handle proactive scheduling correctly
    // Device linking is coming soon, so proactive scheduling is not available yet
    console.log('✅ Success page: Device linking coming soon');
    console.log('✅ Success page: location.state =', location.state);
    
    const isExistingUser = location.state?.existingUser;
    const isReconnected = location.state?.reconnected;
    console.log('✅ Success page: Is existing user?', isExistingUser);
    console.log('✅ Success page: Is reconnected?', isReconnected);
    
    setAppData(prev => ({ 
      ...prev, 
      signalLinked: true,
      proactiveScheduling: false // Coming soon
    }));
    
    console.log('✅ Success page: Setting proactiveScheduling to false (coming soon)');
    
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
        alert('Setup complete! You can now close this tab and start using Tomo QuickCal through Signal.');
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
                ? 'Your Google Calendar has been reconnected. Tomo QuickCal is ready to help you schedule meetings through Signal.'
                : 'Tomo QuickCal is connected and ready to help you schedule meetings through Signal.'
              }
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>Manual scheduling ready</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">
              {appData.proactiveScheduling ? "You're all set with smart scheduling!" : "You're all set!"}
            </h3>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg border border-white/40">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-800 font-medium">Google Calendar and Contacts connected</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg border border-white/40">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-gray-800 font-medium">Signal bot linked</span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-800 font-medium text-sm">Coming Soon: Proactive Scheduling</span>
            </div>
            <p className="text-blue-700 text-xs">
              {window.opener ? 'This tab will close automatically' : 'You can now close this tab and start using Tomo QuickCal through Signal'}
            </p>
          </div>
          
          <p className="text-sm text-gray-500 text-center mt-3">
            You can now close this tab and start using Tomo QuickCal through Signal
          </p>
          
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
      </div>
    </PageContainer>
  );
};

export default Success;