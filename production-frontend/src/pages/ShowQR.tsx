import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Smartphone, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { apiService } from '../services/api';
import { loggingService } from '../services/logging';
import { useApp } from '../contexts/AppContext';

const ShowQR: React.FC = () => {
  const navigate = useNavigate();
  const { appData } = useApp();
  const [qrSrc, setQrSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(10);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Simple mobile detection
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
  }, []);

  useEffect(() => {
    const fetchQR = async () => {
      setIsLoading(true);
      setError('');
      try {
        console.log('Fetching QR code...');
        const response = await apiService.generateQR();
        
        if (response.success) {
          console.log('QR code generated successfully');
          setQrSrc(response.qrCode);
          setSessionId(response.sessionId);
          setIsLoading(false);
          
          // Log device linking started
          await loggingService.logDeviceLinkingStarted(appData.userId, appData.userEmail);
          
          // Start countdown after QR is loaded
          let timeLeft = 10;
          setCountdown(timeLeft);
          
          const countdownInterval = setInterval(() => {
            timeLeft -= 1;
            setCountdown(timeLeft);
            
            if (timeLeft <= 0) {
              clearInterval(countdownInterval);
              navigate('/waiting', { state: { sessionId: response.sessionId } });
            }
          }, 1000);
          
          // Store interval ID for cleanup
          return () => {
            clearInterval(countdownInterval);
          };
        } else {
          setError(response.error || 'Failed to generate QR code');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
        setError('Failed to connect to backend. Make sure the backend server is running.');
        setIsLoading(false);
      }
    };

    const cleanup = fetchQR();
    
    // Return cleanup function
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn();
        });
      }
    };
  }, [navigate]);

  const handleCancelRetry = () => {
    navigate('/show-qr');
  };

  const handleBack = () => {
    navigate('/connect-bot');
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
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Link Your Signal Device & Enable Smart Scheduling
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Scan the QR code below to link your Signal device and automatically enable proactive scheduling suggestions.
            </p>
          </div>

        <div className="space-y-4">
          <div className="w-full max-w-sm mx-auto aspect-square bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-3">
                <QrCode className="w-8 h-8 text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-500">Generating QR Code...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center space-y-3 p-4">
                <QrCode className="w-8 h-8 text-red-400" />
                <span className="text-sm text-red-500">Failed to generate QR</span>
              </div>
            ) : (
              <img 
                id="qrImage"
                src={qrSrc}
                alt="QR Code for Signal linking"
                className="w-full h-full object-contain p-4"
                onError={() => {
                  console.error('QR image failed to load');
                  setError('Failed to display QR code');
                }}
              />
            )}
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-700 text-lg leading-relaxed">
              {isMobile ? (
                <>Use another device to scan this QR code in Signal</>
              ) : (
                <>Scan this QR code in Signal → Settings → Linked Devices → Link New Device</>
              )}
            </p>
            
            {isMobile && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-orange-800 text-sm font-medium">
                      You're on a mobile device
                    </p>
                    <p className="text-orange-700 text-sm">
                      To scan this QR code, you need to use a different device (computer/tablet) 
                      to view this page, then scan with your phone's Signal app.
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <Smartphone className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-orange-600">
                        Signal → Settings → Linked Devices → Link New Device
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isMobile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="space-y-2">
                  <p className="text-blue-800 text-sm font-medium">
                    📱 On your phone's Signal app:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                    <li>Open Signal</li>
                    <li>Go to Settings</li>
                    <li>Tap "Linked Devices"</li>
                    <li>Tap "Link New Device"</li>
                    <li>Scan this QR code</li>
                  </ol>
                </div>
              </div>
            )}
            
            {/* Proactive Scheduling Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-purple-800 text-sm font-medium">
                    ✨ Proactive Scheduling Included
                  </p>
                  <p className="text-purple-700 text-xs">
                    By linking your device, you'll enable smart suggestions that help catch scheduling opportunities in your conversations. Your privacy is protected - messages are analyzed in real-time and immediately discarded.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prominent Skip Button */}
        <div className="pt-6">
          <Button onClick={() => {
            console.log('🔄 ShowQR: Skip button clicked, navigating with skippedDeviceLinking: true');
            // Log device linking skipped
            loggingService.logDeviceLinkingSkipped(appData.userId, appData.userEmail);
            navigate('/success', { state: { skippedDeviceLinking: true } });
          }} variant="primary">
            Skip Device Linking & Proactive Scheduling
          </Button>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Countdown Timer at Bottom */}
        {!isLoading && !error && qrSrc && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm text-center mb-2">
              Automatically continuing in {countdown} second{countdown !== 1 ? 's' : ''}...
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
      </div>
    </PageContainer>
  );
};

export default ShowQR;