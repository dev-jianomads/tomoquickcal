import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Smartphone, MessageSquare, Send, CheckCircle, ChevronDown } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useApp } from '../contexts/AppContext';
import { supabaseService } from '../services/supabase';
import googleAuthService from '../services/googleAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { loggingService } from '../services/logging';

const ConnectBot: React.FC = () => {
  const navigate = useNavigate();
  const { appData, setAppData } = useApp();
  const { isSignedIn, isInitialized, user } = useGoogleAuth();
  const [authError, setAuthError] = React.useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState('');
  
  // This would come from your backend config
  const botPhoneNumber = import.meta.env.VITE_SIGNAL_BOT_NUMBER || '+85291356545';

  // Check authentication state on component mount
  React.useEffect(() => {
    const checkAuthState = async () => {
      console.log('ConnectBot: Auth state check:', {
        isSignedIn,
        isInitialized,
        hasUser: !!user,
        userEmail: user?.email,
        appDataGcalLinked: appData.gcalLinked,
        appDataUserEmail: appData.userEmail
      });
      
      try {
        // Check if we're in a valid state to proceed
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.log('ConnectBot: No client ID found, using demo mode');
          // In demo mode, proceed without auth check
          setIsCheckingAuth(false);
          return;
        }
        
        // Give more time for auth state to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Re-check auth state after delay
        const { default: googleAuthService } = await import('../services/googleAuth');
        await googleAuthService.initialize();
        const currentUser = googleAuthService.getCurrentUser();
        const isCurrentlySignedIn = googleAuthService.isSignedIn();
        
        console.log('ConnectBot: Updated auth check:', {
          isCurrentlySignedIn,
          hasCurrentUser: !!currentUser,
          currentUserEmail: currentUser?.email,
          appDataGcalLinked: appData.gcalLinked
        });
        
        // Check if user is authenticated (more comprehensive check)
        const hasValidAuth = isCurrentlySignedIn || appData.gcalLinked || (currentUser?.email);
        
        if (!hasValidAuth) {
          console.log('❌ User not authenticated, redirecting to calendar connection');
          setAuthError('Please connect Google Calendar first. Redirecting...');
          setTimeout(() => {
            navigate('/connect-calendar');
          }, 2000);
        } else {
          console.log('✅ User authenticated, proceeding with ConnectBot');
          
          // Check if user already has phone number saved
          if (currentUser?.email) {
            try {
              const { supabaseService } = await import('../services/supabase');
              const existingUser = await supabaseService.findUserByEmail(currentUser.email);
              
              if (existingUser?.phone_number && existingUser.phone_number.trim() !== '' && existingUser.phone_number !== 'null') {
                console.log('✅ User already has phone number, redirecting to success');
                
                // Check if this is a reconnection flow by looking at the referrer or app state
                const isReconnected = document.referrer.includes('/reconnect-calendar');
                
                setAppData(prev => ({
                  ...prev,
                  gcalLinked: true,
                  userEmail: existingUser.email,
                  userId: existingUser.id
                }));
                navigate('/success', { 
                  state: { 
                    existingUser: true,
                    reconnected: isReconnected
                  } 
                });
                return;
              } else {
                console.log('📱 User exists but no valid phone number, staying on ConnectBot page');
                console.log('📱 Current phone_number value:', existingUser?.phone_number);
              }
            } catch (error) {
              console.log('Could not check existing phone number:', error);
              // Continue with normal flow
            }
          }
          
          // Update app data if we have user info but app data doesn't
          if (currentUser && !appData.userEmail) {
            setAppData(prev => ({
              ...prev,
              gcalLinked: true,
              userEmail: currentUser.email,
              userId: currentUser.id || 'unknown'
            }));
          }
        }
      } catch (error) {
        console.error('ConnectBot: Error during auth check:', error);
        setAuthError('Authentication check failed. Please try again.');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    // Only check auth state if initialized
    if (isInitialized) {
      checkAuthState();
    } else {
      setIsCheckingAuth(false);
    }
  }, [isSignedIn, isInitialized, user, appData.gcalLinked, appData.userEmail, navigate]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <PageContainer>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Checking Authentication...
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Please wait while we verify your Google Calendar connection.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Show auth error if there's a configuration issue
  if (authError) {
    return (
      <PageContainer>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Setup Required
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {authError}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-600 text-sm">
              You need to connect Google Calendar before setting up Signal integration.
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={() => navigate('/connect-calendar')}>
              Connect Google Calendar
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Common country codes
  const countryCodes = [
    { code: '+1', flag: '🇺🇸' },
    { code: '+44', flag: '🇬🇧' },
    { code: '+49', flag: '🇩🇪' },
    { code: '+33', flag: '🇫🇷' },
    { code: '+39', flag: '🇮🇹' },
    { code: '+34', flag: '🇪🇸' },
    { code: '+31', flag: '🇳🇱' },
    { code: '+46', flag: '🇸🇪' },
    { code: '+47', flag: '🇳🇴' },
    { code: '+45', flag: '🇩🇰' },
    { code: '+41', flag: '🇨🇭' },
    { code: '+43', flag: '🇦🇹' },
    { code: '+32', flag: '🇧🇪' },
    { code: '+351', flag: '🇵🇹' },
    { code: '+353', flag: '🇮🇪' },
    { code: '+358', flag: '🇫🇮' },
    { code: '+852', flag: '🇭🇰' },
    { code: '+65', flag: '🇸🇬' },
    { code: '+61', flag: '🇦🇺' },
    { code: '+64', flag: '🇳🇿' },
    { code: '+81', flag: '🇯🇵' },
    { code: '+82', flag: '🇰🇷' },
    { code: '+86', flag: '🇨🇳' },
    { code: '+91', flag: '🇮🇳' },
    { code: '+55', flag: '🇧🇷' },
    { code: '+52', flag: '🇲🇽' },
    { code: '+54', flag: '🇦🇷' },
    { code: '+56', flag: '🇨🇱' },
    { code: '+57', flag: '🇨🇴' },
    { code: '+27', flag: '🇿🇦' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phoneNumber.trim()) {
      setError('Please enter your Signal phone number');
      return;
    }
    
    // Basic phone number validation
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }
    
    // Get current user info
    let currentUser = user || googleAuthService.getCurrentUser();
    
    // If no user from hook, try to get from service
    if (!currentUser) {
      await googleAuthService.initialize();
      currentUser = googleAuthService.getCurrentUser();
    }
    
    console.log('ConnectBot: Current user check:', {
      hasCurrentUser: !!currentUser,
      userEmail: currentUser?.email,
      isSignedIn,
      appDataGcalLinked: appData.gcalLinked,
      appDataUserEmail: appData.userEmail
    });
    
    // Use email from current user or app data
    const userEmail = currentUser?.email || appData.userEmail;
    
    if (!userEmail) {
      console.log('❌ No current user found, redirecting to calendar connection');
      setError('Google Calendar connection required. Redirecting...');
      setTimeout(() => {
        navigate('/connect-calendar');
      }, 2000);
      return;
    }
    
    console.log('✅ Current user found, proceeding with phone number save:', userEmail);
    
    setIsSubmitting(true);
    
    try {
      // Combine country code with phone number
      // Remove leading zeros from the clean number
      const cleanNumberNoLeadingZeros = cleanNumber.replace(/^0+/, '');
      const fullPhoneNumber = countryCode + cleanNumberNoLeadingZeros;
      
      // Log phone number entered
      await loggingService.logPhoneNumberEntered(userEmail, fullPhoneNumber);
      
      // Check if user exists in Supabase first
      console.log('💾 Saving phone number to Supabase for:', userEmail);
      
      // First, ensure user exists in database (create if needed)
      let userData;
      try {
        userData = await supabaseService.saveUserPhoneNumber(userEmail, fullPhoneNumber);
      } catch (error) {
        console.log('❌ User not found, creating user first...');
        // If user doesn't exist, create them first
        const newUser = await supabaseService.saveUserAfterGoogleAuth({
          email: userEmail,
          name: currentUser?.name || 'User',
          accessToken: googleAuthService.getAccessToken() || '',
          refreshToken: localStorage.getItem('google_refresh_token') || undefined
        });
        console.log('✅ User created, now saving phone number...');
        userData = await supabaseService.saveUserPhoneNumber(userEmail, fullPhoneNumber);
      }
      
      console.log('✅ Phone number saved, user data:', userData);
      
      // Update app context with user data
      setAppData(prev => ({ 
        ...prev, 
        userEmail: userData.email,
        userId: userData.id 
      }));
      
      // Log phone number saved with the correct user ID
      await loggingService.logSignalMessageSent(userData.id, userData.email, fullPhoneNumber);
      
      // Send initial message to user
      // In production, this would send a Signal message
      // For now, we'll just simulate success since the phone number is saved
      console.log('📱 Phone number saved successfully, simulating message sent');
      setMessageSent(true);
      
      // Verify the phone number was actually saved
      setTimeout(async () => {
        const verification = await supabaseService.verifyPhoneNumberSaved(userEmail);
        if (verification.saved) {
          console.log('✅ Phone number verification successful');
        } else {
          console.log('❌ Phone number verification failed - not found in database');
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to save phone number or send message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save phone number';
      
      if (errorMessage.includes('connect Google Calendar first')) {
        setError('Google Calendar and Contacts connection required. Redirecting...');
        setTimeout(() => {
          navigate('/connect-calendar');
        }, 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    navigate('/show-qr');
  };

  const handleBack = () => {
    navigate('/connect-calendar');
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on country code with proper international formats
    switch (countryCode) {
      case '+1': // US/Canada: (XXX) XXX-XXXX - allows up to 11 digits (with leading 1)
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 11)}`;
        
      case '+44': // UK: XXXX XXX XXXX - allows up to 11 digits (with leading 0)
        if (digits.length <= 4) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 12)}`;
        
      case '+49': // Germany: XXX XXXXXXXX - allows up to 12 digits (with leading 0)
        if (digits.length <= 3) return digits;
        return `${digits.slice(0, 3)} ${digits.slice(3, 12)}`;
        
      case '+33': // France: X XX XX XX XX - allows up to 10 digits (with leading 0)
        if (digits.length <= 1) return digits;
        if (digits.length <= 3) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
        if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
        if (digits.length <= 7) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 10)}`;
        
      case '+39': // Italy: XXX XXX XXXX - allows up to 11 digits (with leading 0)
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 11)}`;
        
      case '+34': // Spain: XXX XX XX XX - allows up to 9 digits
        if (digits.length <= 3) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
        
      case '+31': // Netherlands: XX XXX XXXX - allows up to 10 digits (with leading 0)
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 10)}`;
        
      case '+46': // Sweden: XX XXX XX XX - allows up to 10 digits (with leading 0)
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 10)}`;
        
      case '+47': // Norway: XXX XX XXX - allows up to 8 digits
        if (digits.length <= 3) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)}`;
        
      case '+45': // Denmark: XX XX XX XX - allows up to 8 digits
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`;
        
      case '+41': // Switzerland: XX XXX XX XX - allows up to 10 digits (with leading 0)
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 10)}`;
        
      case '+43': // Austria: X XXX XXXX - allows up to 11 digits (with leading 0)
        if (digits.length <= 1) return digits;
        if (digits.length <= 4) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
        return `${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 11)}`;
        
      case '+61': // Australia: XXX XXX XXX
        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
        
      case '+64': // New Zealand: XX XXX XXXX - allows up to 10 digits (with leading 0)
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 10)}`;
        
      case '+81': // Japan: XX XXXX XXXX - allows up to 11 digits (with leading 0)
        if (digits.length <= 2) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 11)}`;
        
      case '+82': // South Korea: XX XXXX XXXX - allows up to 11 digits (with leading 0)
        if (digits.length <= 2) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 11)}`;
        
      case '+86': // China: XXX XXXX XXXX - allows up to 11 digits
        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`;
        
      case '+91': // India: XXXXX XXXXX - allows up to 10 digits
        if (digits.length <= 5) return digits;
        return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
        
      case '+55': // Brazil: XX XXXXX XXXX - allows up to 11 digits
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7, 11)}`;
        
      case '+852': // Hong Kong: XXXX XXXX - allows up to 8 digits
        if (digits.length <= 4) return digits;
        return `${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
        
      case '+65': // Singapore: XXXX XXXX - allows up to 8 digits
        if (digits.length <= 4) return digits;
        return `${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
        
      default: // Generic international format: XXX XXX XXXX - allows up to 15 digits
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 15)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
  };

  // Helper function to clean phone number and remove leading zeros
  const getCleanPhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    // Remove leading zeros
    return digits.replace(/^0+/, '');
  };

  // Helper function to get appropriate placeholder for each country
  const getPlaceholderForCountry = (code: string) => {
    switch (code) {
      case '+1': return '(555) 123-4567'; // US/Canada: 10 digits
      case '+44': return '07700 900123'; // UK: 11 digits with leading 0
      case '+49': return '0151 12345678'; // Germany: 11-12 digits with leading 0
      case '+33': return '06 12 34 56 78'; // France: 10 digits with leading 0
      case '+39': return '320 123 4567'; // Italy: 9-10 digits (mobile without leading 0)
      case '+34': return '612 34 56 78'; // Spain: 9 digits
      case '+31': return '06 1234 5678'; // Netherlands: 9 digits with leading 0
      case '+46': return '070 123 45 67'; // Sweden: 9 digits with leading 0
      case '+47': return '123 45 678'; // Norway: 8 digits
      case '+45': return '12 34 56 78'; // Denmark: 8 digits
      case '+41': return '078 123 45 67'; // Switzerland: 9 digits with leading 0
      case '+43': return '0664 123456'; // Austria: 10-11 digits with leading 0
      case '+61': return '0412 345 678'; // Australia: 10 digits with leading 0
      case '+64': return '021 123 4567'; // New Zealand: 9-10 digits with leading 0
      case '+81': return '090 1234 5678'; // Japan: 11 digits with leading 0
      case '+82': return '010 1234 5678'; // South Korea: 11 digits with leading 0
      case '+86': return '138 0013 8000'; // China: 11 digits
      case '+91': return '98765 43210'; // India: 10 digits
      case '+55': return '11 91234 5678'; // Brazil: 11 digits (area code + 9 + number)
      case '+852': return '9123 4567'; // Hong Kong: 8 digits
      case '+65': return '9123 4567'; // Singapore: 8 digits
      default: return '123 456 7890'; // Generic format
    }
  };

  if (messageSent) {
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
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Phone Number Saved! 📱
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                You should receive an introduction Signal message from Tomo shortly.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 text-left space-y-4">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Next steps:</h3>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>You'll receive a Signal message from <strong>{botPhoneNumber}</strong> shortly</li>
                <li>Accept the conversation request if prompted</li>
                <li>Start scheduling with simple messages!</li>
              </ol>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 text-left">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Try these commands once connected:</h3>
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

            <div className="pt-4">
              <Button onClick={() => navigate('/success')}>
                Finish Setup
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

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
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Connect Tomo QuickCal
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Enter your Signal phone number and Tomo will send you the first message to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Your Signal Phone Number</h3>
              
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  {/* Country Code Dropdown */}
                  <div className="relative flex-shrink-0 w-full sm:w-auto">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-3 pr-8 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer w-full sm:w-auto min-w-[120px]"
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-3 pr-8 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer min-w-0"
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {/* Phone Number Input */}
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onBlur={() => {
                      // Format only when user finishes editing (loses focus)
                      if (phoneNumber) {
                        const formatted = formatPhoneNumber(phoneNumber);
                        setPhoneNumber(formatted);
                      }
                    }}
                    placeholder={getPlaceholderForCountry(countryCode)}
                    className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[200px]"
                    inputMode="tel"
                    required
                  />
                </div>
                
                <p className="text-sm text-gray-500">
                  Enter your complete phone number as you normally would
                </p>
                
                {/* Preview of full number */}
                {phoneNumber && (
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-sm text-gray-600">Full number:</p>
                    <p className="font-mono text-base text-gray-900 break-all">
                      {countryCode}{getCleanPhoneNumber()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting || !phoneNumber.trim()}>
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4 animate-pulse" />
                    <span>Sending Message...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Connect Tomo QuickCal</span>
                  </div>
                )}
              </Button>
            </div>
          </form>

          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 text-left space-y-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">What happens next:</h3>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Tomo will send you an introduction message on Signal</li>
              <li>Accept the conversation if Signal asks for approval</li>
              <li>Start scheduling with simple messages!</li>
            </ol>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 text-left">
            <div className="flex items-center space-x-2 mb-3">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Example commands you'll be able to use:</h3>
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

export default ConnectBot;