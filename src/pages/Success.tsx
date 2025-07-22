import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Calendar, MessageCircle, Sparkles } from 'lucide-react';
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
    // Try to close the window/tab first
    try {
      window.close();
    } catch (error) {
      console.log('Could not close window:', error);
    }
    
    // If window.close() doesn't work, navigate to welcome as fallback
    setTimeout(() => {
      navigate('/welcome');
    }, 100);
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
            <Button onClick={handleFinish}>
              <span className="text-blue-800 font-medium text-sm">Coming Soon: Proactive Scheduling</span>
            </div>
            <p className="text-blue-700 text-xs">
              {window.opener ? 'This tab will close automatically' : 'You can now close this tab and start using Tomo QuickCal through Signal'}
            </p>
          </div>
        </div>
        
        <div className="pt-4">
          <Button onClick={() => window.close()}>
            Close Setup
          </Button>
          <p className="text-sm text-gray-500 text-center mt-3">
            You can now close this tab and start using Tomo QuickCal through Signal
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-left">
        <h3 className="font-semibold text-blue-900 mb-3">Start scheduling now:</h3>
        <div className="space-y-2 text-blue-800">
          <p className="text-sm">Send a message to the Tomo bot like:</p>
          <div className="bg-white/60 rounded-lg p-3 border border-white/40">
            <code className="text-sm">"Schedule meeting with John tomorrow at 2pm"</code>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            The bot will automatically create the calendar event and send invites!
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default Success;