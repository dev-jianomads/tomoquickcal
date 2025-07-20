import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { apiService } from '../services/api';
import { loggingService } from '../services/logging';
import { useApp } from '../contexts/AppContext';

const Waiting: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appData } = useApp();
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(10);
  const [hasStartedPolling, setHasStartedPolling] = useState(false);
  const isPollingRef = useRef(true);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get session ID from navigation state
  const sessionId = location.state?.sessionId;

  useEffect(() => {
    console.log('🔄 Waiting screen mounted with sessionId:', sessionId);
    
    if (!sessionId) {
      console.log('❌ No session ID, redirecting to QR generation');
      navigate('/show-qr');
      return;
    }

    isPollingRef.current = true;

    // Start with a 10-second countdown before polling begins
    let timeLeft = 10;
    setCountdown(timeLeft);
    
    const countdownInterval = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      console.log(`⏰ Countdown: ${timeLeft}s remaining`);
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        setHasStartedPolling(true);
        console.log('🔄 Countdown finished, starting polling...');
        startPolling();
      }
    }, 1000);

    const startPolling = () => {
      console.log('🔄 Starting polling function');
      pollTail();
    };

    const pollTail = async () => {
      if (!isPollingRef.current) {
        console.log('🔄 Polling stopped (ref is false)');
        return;
      }

      try {
        console.log('🔄 Making API call to check linking status...');
        const response = await apiService.checkLinkingStatus(sessionId);
        console.log('🔄 API response:', response);
        
        if (response.success && response.linked) {
          console.log('✅ Connection successful! Navigating to success page...');
          isPollingRef.current = false;
          
          // Log device linking success
          await loggingService.logDeviceLinkingSuccess(appData.userId, appData.userEmail);
          
          // Clear any pending timeouts
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
          }
          navigate('/success');
          return;
        } else if (!response.success) {
          console.error('❌ Linking check failed:', response.error);
          setError(response.error || 'Failed to check linking status');
          isPollingRef.current = false;
          return;
        }
        
        // Continue polling if still waiting
        if (isPollingRef.current && !response.linked) {
          console.log('⏳ Still waiting, scheduling next poll in 2 seconds...');
          pollTimeoutRef.current = setTimeout(() => {
            if (isPollingRef.current) {
              console.log('🔄 Executing scheduled poll...');
              pollTail();
            } else {
              console.log('🔄 Skipping scheduled poll (ref is false)');
            }
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Polling failed:', error);
        setError('Failed to connect to backend. Please check your connection.');
        isPollingRef.current = false;
      }
    };

    // 45 second timeout
    const globalTimeout = setTimeout(() => {
      if (isPollingRef.current) {
        console.log('⏰ Global timeout reached');
        isPollingRef.current = false;
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
        }
        setError('Link timed out. Please try again.');
        setTimeout(() => {
          navigate('/show-qr');
        }, 3000);
      }
    }, 45000);

    return () => {
      console.log('🧹 Cleaning up waiting screen...');
      clearInterval(countdownInterval);
      clearTimeout(globalTimeout);
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      isPollingRef.current = false;
    };
  }, [navigate, sessionId]);

  const handleSkip = () => {
    console.log('🔄 Waiting: Skip button clicked, navigating with skippedDeviceLinking: true');
    // Log device linking skipped
    loggingService.logDeviceLinkingSkipped(appData.userId, appData.userEmail);
    navigate('/success', { state: { skippedDeviceLinking: true } });
  };

  const handleBack = () => {
    navigate('/show-qr');
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
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>of 3</span>
          </div>
        </div>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">
              {hasStartedPolling ? 'Connecting to Signal...' : 'Preparing connection...'}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              {hasStartedPolling 
                ? 'Please wait while we establish the connection...'
                : `Starting connection in ${countdown} second${countdown !== 1 ? 's' : ''}...`
              }
            </p>
            
            {hasStartedPolling ? (
              <div className="flex justify-center pt-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : null}
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="pt-2">
              <button
                onClick={() => navigate('/show-qr')}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Countdown Timer at Bottom */}
        {!hasStartedPolling && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm text-center mb-2">
              Auto-starting connection in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((10 - countdown) / 10) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Waiting;