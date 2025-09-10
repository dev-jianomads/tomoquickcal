import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Smartphone, ChevronDown, Zap } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useApp } from '../contexts/AppContext';
import { supabaseService } from '../services/supabase';
import googleAuthService from '../services/googleAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { loggingService } from '../services/logging';

export default function CreateAccount() {
  const navigate = useNavigate();
  const { appData, setAppData } = useApp();
  const { isSignedIn, isInitialized, user } = useGoogleAuth();
  const [authError, setAuthError] = React.useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Check authentication state on component mount
  React.useEffect(() => {
    const checkAuthState = async () => {
      console.log('🔍 CreateAccount: Starting auth state check...', {
        isSignedIn,
        isInitialized,
        hasUser: !!user,
        userEmail: user?.email,
        appDataGcalLinked: appData.gcalLinked,
        appDataUserEmail: appData.userEmail
      });
      
      console.log('CreateAccount: Auth state check:', {
        isSignedIn,
        isInitialized,
        hasUser: !!user,
        userEmail: user?.email,
        appDataGcalLinked: appData.gcalLinked,
        appDataUserEmail: appData.userEmail
      });
      
      try {
        // First check if user is authenticated
        // Simple check - just verify we have Google auth
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.log('CreateAccount: No client ID found, using demo mode');
          setIsCheckingAuth(false);
          return;
        }
        
        // Initialize Google auth service
        const { default: googleAuthService } = await import('../services/googleAuth');
        await googleAuthService.initialize();
        const currentUser = googleAuthService.getCurrentUser();
        const isCurrentlySignedIn = googleAuthService.isSignedIn();
        
        console.log('CreateAccount: Auth check result:', {
          isCurrentlySignedIn,
          hasCurrentUser: !!currentUser,
          currentUserEmail: currentUser?.email,
        });
        
        // Simple check - do we have a current user?
        const hasValidAuth = isCurrentlySignedIn && currentUser?.email;
        
        if (!hasValidAuth) {
          console.log('❌ User not authenticated, redirecting to welcome');
          setAuthError('Please connect Google Calendar first. Redirecting...');
          setTimeout(() => {
            navigate('/welcome');
          }, 2000);
          return;
        }
        
        console.log('✅ User authenticated, proceeding with CreateAccount');
        
        console.log('🔍 CreateAccount: Starting existing user check for:', currentUser.email);
        
        // Check if user already exists and is complete  
        try {
          const { supabaseService } = await import('../services/supabase');
          console.log('🔍 CreateAccount: Supabase service imported, looking up user...');
          
          const existingUser = await supabaseService.findUserByEmail(currentUser.email);
          
          console.log('🔍 CreateAccount: User lookup result:', {
            userFound: !!existingUser,
            userId: existingUser?.id,
            email: existingUser?.email
          });
          
          if (existingUser) {
            console.log('🔍 CreateAccount: Existing user found, checking completion status...');
            
            // Check if user has phone number and tokens
            const hasPhoneNumber = !!(existingUser.phone_number && 
                                    existingUser.phone_number.trim() !== '' && 
                                    existingUser.phone_number !== 'null');
            const hasTokens = !!(existingUser.access_token_2);
            const hasTelegram = !!(existingUser.telegram_id);
            
            console.log('🔍 CreateAccount: User completion status:', {
              userId: existingUser.id,
              email: existingUser.email,
              phone_number_raw: existingUser.phone_number,
              phone_number_type: typeof existingUser.phone_number,
              phone_number_length: existingUser.phone_number?.length || 0,
              phone_number_trimmed: existingUser.phone_number?.trim(),
              phone_number_is_null_string: existingUser.phone_number === 'null',
              phone_number_is_empty_string: existingUser.phone_number === '',
              phone_number_is_null: existingUser.phone_number === null,
              phone_number_is_undefined: existingUser.phone_number === undefined,
              access_token_2_present: !!existingUser.access_token_2,
              access_token_2_length: existingUser.access_token_2?.length || 0,
              telegram_id_present: !!existingUser.telegram_id,
              telegram_id_value: existingUser.telegram_id,
              hasPhoneNumber,
              hasTokens,
              hasTelegram,
              navigationDecision: hasPhoneNumber && hasTokens && hasTelegram ? 'success' : 
                                hasPhoneNumber && hasTokens && !hasTelegram ? 'connect-telegram' : 'stay-here'
            });
            
            // Update app data with user info
            setAppData(prev => ({
              ...prev,
              gcalLinked: true,
              userEmail: existingUser.email,
              userId: existingUser.id
            }));
            
            // Navigate based on completion status
            if (hasPhoneNumber && hasTokens && hasTelegram) {
              console.log('✅ CreateAccount: User fully complete, redirecting to success');
              setIsCheckingAuth(false);
              navigate('/success', { state: { existingUser: true } });
              return;
            } else if (hasPhoneNumber && hasTokens && !hasTelegram) {
              console.log('✅ CreateAccount: User has account but no Telegram, redirecting to connect-telegram');
              setIsCheckingAuth(false);
              navigate('/connect-telegram');
              return;
            } else {
              console.log('📝 CreateAccount: User needs to complete account creation, staying on page. Reasons:', {
                missingPhone: !hasPhoneNumber,
                missingTokens: !hasTokens,
                missingTelegram: !hasTelegram,
                phoneValue: existingUser.phone_number,
                tokenValue: existingUser.access_token_2 ? 'present' : 'missing'
              });
              // Stay on create-account page - user needs to enter/update phone number
            }
          } else {
            console.log('👤 CreateAccount: New user, staying on create-account page');
          }
        } catch (error) {
          console.error('❌ CreateAccount: Error checking existing user:', error);
          // Continue with normal flow on error
        }
        
        // Update app data with current user info
        if (currentUser && !appData.userEmail) {
          setAppData(prev => ({
            ...prev,
            gcalLinked: true,
            userEmail: currentUser.email,
            userId: currentUser.id || 'unknown'
          }));
        }
      } catch (error) {
        console.error('CreateAccount: Error during auth check:', error);
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
  }, [isSignedIn, isInitialized, user, navigate, setAppData, appData.userEmail]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <PageContainer>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600 animate-pulse" />
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
              <User className="w-8 h-8 text-blue-600" />
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
              You need to connect Google Calendar before creating your account.
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={() => navigate('/welcome')}>
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
    { code: '+886', flag: '🇹🇼' },
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
    console.log('🚀 Account creation started');
    console.log('🚀 Form data:', {
      phoneNumber,
      countryCode,
      isSubmitting,
      userEmail: user?.email || appData.userEmail
    });
    
    // Log form submission start
    try {
      await loggingService.log('phone_number_entered', {
        userEmail: user?.email || appData.userEmail,
        eventData: {
          phone_number_masked: phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3),
          country_code: countryCode,
          phone_length: phoneNumber.replace(/\D/g, '').length,
          form_submission_started: true
        }
      });
    } catch (logError) {
      console.warn('Failed to log phone number entry:', logError);
    }
    
    setError('');
    
    if (!phoneNumber.trim()) {
      console.log('❌ Phone number validation failed: empty');
      try {
        await loggingService.log('phone_number_entered', {
          userEmail: user?.email || appData.userEmail,
          success: false,
          errorMessage: 'Phone number empty',
          eventData: { validation_failed: 'empty_phone' }
        });
      } catch (logError) {
        console.warn('Failed to log validation error:', logError);
      }
      setError('Please enter your phone number');
      return;
    }
    
    // Basic phone number validation
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 7) {
      console.log('❌ Phone number validation failed: too short', cleanNumber.length);
      try {
        await loggingService.log('phone_number_entered', {
          userEmail: user?.email || appData.userEmail,
          success: false,
          errorMessage: 'Phone number too short',
          eventData: { 
            validation_failed: 'too_short',
            phone_length: cleanNumber.length
          }
        });
      } catch (logError) {
        console.warn('Failed to log validation error:', logError);
      }
      setError('Please enter a valid phone number');
      return;
    }
    
    console.log('✅ Phone number validation passed');
    
    // Log validation success
    try {
      await loggingService.log('phone_number_entered', {
        userEmail: user?.email || appData.userEmail,
        eventData: {
          phone_number_masked: phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3),
          country_code: countryCode,
          phone_length: cleanNumber.length,
          validation_passed: true
        }
      });
    } catch (logError) {
      console.warn('Failed to log validation success:', logError);
    }
    
    // Get current user info
    let currentUser = user || googleAuthService.getCurrentUser();
    
    // If no user from hook, try to get from service
    if (!currentUser) {
      await googleAuthService.initialize();
      currentUser = googleAuthService.getCurrentUser();
    }
    
    console.log('CreateAccount: Current user check:', {
      hasCurrentUser: !!currentUser,
      userEmail: currentUser?.email,
      isSignedIn,
      appDataGcalLinked: appData.gcalLinked,
      appDataUserEmail: appData.userEmail
    });
    
    // Use email from current user or app data
    const userEmail = currentUser?.email || appData.userEmail;
    
    if (!userEmail) {
      console.log('❌ No current user found, redirecting to welcome');
      setError('Google Calendar connection required. Redirecting...');
      setTimeout(() => {
        navigate('/welcome');
      }, 2000);
      return;
    }
    
    console.log('✅ Current user found, proceeding with account creation:', userEmail);
    
    setIsSubmitting(true);
    
    try {
      console.log('👤 Starting account creation process...');
      
      // Log submission process start
      try {
        await loggingService.log('phone_number_entered', {
          userEmail,
          eventData: {
            submission_process_started: true,
            has_current_user: !!currentUser,
            user_email_source: currentUser?.email ? 'current_user' : 'app_data'
          }
        });
      } catch (logError) {
        console.warn('Failed to log submission start:', logError);
      }
      
      // Combine country code with phone number
      // Remove leading zeros from the clean number
      const cleanNumberNoLeadingZeros = cleanNumber.replace(/^0+/, '');
      const fullPhoneNumber = countryCode + cleanNumberNoLeadingZeros;
      
      console.log('📱 Phone number processed:', {
        original: phoneNumber,
        cleaned: cleanNumber,
        withoutLeadingZeros: cleanNumberNoLeadingZeros,
        full: fullPhoneNumber
      });
      
      // Get temporary Google auth data from localStorage
      const tempAuthDataStr = localStorage.getItem('temp_google_auth');
      console.log('💾 Checking for temporary auth data...', {
        hasData: !!tempAuthDataStr,
        dataLength: tempAuthDataStr?.length || 0
      });
      
      // Log session storage check
      try {
        await loggingService.log('phone_number_entered', {
          userEmail,
          eventData: {
            local_storage_check: true,
            has_temp_auth_data: !!tempAuthDataStr,
            temp_auth_data_length: tempAuthDataStr?.length || 0,
            local_storage_keys: Object.keys(localStorage).filter(key => key.includes('temp_google_auth') || key.includes('google'))
          }
        });
      } catch (logError) {
        console.warn('Failed to log local storage check:', logError);
      }
      
      let tempAuthData;
      
      if (!tempAuthDataStr) {
        console.error('❌ No temporary auth data found');
        console.error('❌ LocalStorage contents:', {
          keys: Object.keys(localStorage).filter(key => key.includes('google') || key.includes('temp')),
          tempAuth: localStorage.getItem('temp_google_auth'),
          googleUser: localStorage.getItem('google_user'),
          googleToken: localStorage.getItem('google_access_token')
        });
        
        // Try to reconstruct from existing localStorage as fallback
        const googleUser = localStorage.getItem('google_user');
        const googleToken = localStorage.getItem('google_access_token');
        const googleRefresh = localStorage.getItem('google_refresh_token');
        
        if (googleUser && googleToken) {
          console.log('🔄 Attempting to reconstruct auth data from localStorage...');
          try {
            const userData = JSON.parse(googleUser);
            const reconstructedAuthData = {
              email: userData.email,
              name: userData.name,
              accessToken: googleToken,
              refreshToken: googleRefresh,
              clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET
            };
            
            // Log the reconstruction attempt
            await loggingService.log('phone_number_entered', {
              userEmail,
              eventData: {
                auth_data_reconstructed: true,
                has_user_data: !!googleUser,
                has_access_token: !!googleToken,
                has_refresh_token: !!googleRefresh
              }
            });
            
            // Use reconstructed data
            tempAuthData = reconstructedAuthData;
            console.log('✅ Successfully reconstructed auth data');
          } catch (reconstructError) {
            console.error('❌ Failed to reconstruct auth data:', reconstructError);
            
            await loggingService.log('phone_number_entered', {
              userEmail,
              success: false,
              errorMessage: 'Failed to reconstruct auth data',
              eventData: {
                reconstruction_failed: true,
                error: reconstructError instanceof Error ? reconstructError.message : 'Unknown error'
              }
            });
            
            setError('Session expired. Please reconnect Google Calendar.');
            setTimeout(() => {
              navigate('/welcome');
            }, 2000);
            return;
          }
        } else {
          await loggingService.log('phone_number_entered', {
            userEmail,
            success: false,
            errorMessage: 'No temporary auth data found and cannot reconstruct',
            eventData: {
              missing_temp_auth: true,
              has_google_user: !!googleUser,
              has_google_token: !!googleToken,
              local_storage_keys: Object.keys(localStorage).filter(key => key.includes('google') || key.includes('temp'))
            }
          });
          
          setError('Session expired. Please reconnect Google Calendar.');
          setTimeout(() => {
            navigate('/welcome');
          }, 2000);
          return;
        }
      } else {
        tempAuthData = JSON.parse(tempAuthDataStr);
      }
      
      console.log('💾 Parsed temporary auth data:', {
        email: tempAuthData.email,
        hasAccessToken: !!tempAuthData.accessToken,
        hasRefreshToken: !!tempAuthData.refreshToken,
        hasGrantedScopes: !!tempAuthData.grantedScopes,
        grantedScopesType: typeof tempAuthData.grantedScopes,
        grantedScopesValue: tempAuthData.grantedScopes
      });
      
      // Log detailed temp auth data analysis
      try {
        await loggingService.log('create_account_temp_auth_analysis', {
          userEmail,
          eventData: {
            temp_auth_data_keys: Object.keys(tempAuthData),
            has_granted_scopes: 'grantedScopes' in tempAuthData,
            granted_scopes_is_null: tempAuthData.grantedScopes === null,
            granted_scopes_is_undefined: tempAuthData.grantedScopes === undefined,
            granted_scopes_type: typeof tempAuthData.grantedScopes,
            granted_scopes_value: tempAuthData.grantedScopes,
            granted_scopes_stringified: JSON.stringify(tempAuthData.grantedScopes),
            will_save_to_supabase: true,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.warn('Failed to log temp auth analysis:', logError);
      }
      
      console.log('💾 Creating/updating Supabase record with complete data for:', userEmail);
      
      // Log parsed auth data
      try {
        await loggingService.log('phone_number_entered', {
          userEmail,
          eventData: {
            temp_auth_parsed: true,
            has_access_token: !!tempAuthData.accessToken,
            has_refresh_token: !!tempAuthData.refreshToken,
            ready_for_user_creation: true
          }
        });
      } catch (logError) {
        console.warn('Failed to log parsed auth data:', logError);
      }
      
      // Create or update user with complete data (Google auth + phone number)
      let userData;
      try {
        // Check if user already exists
        let existingUser = await supabaseService.findUserByEmail(userEmail);
        console.log('🔍 Existing user check result:', !!existingUser);
        
        // Log user lookup result
        try {
          await loggingService.log('phone_number_entered', {
            userEmail,
            eventData: {
              user_lookup_completed: true,
              existing_user_found: !!existingUser,
              will_update: !!existingUser,
              will_create: !existingUser
            }
          });
        } catch (logError) {
          console.warn('Failed to log user lookup:', logError);
        }
        
        if (existingUser) {
          console.log('📝 Updating existing user with Google auth and phone number');
          // Update existing user with fresh Google auth data and phone number
          // ALWAYS update tokens for existing users who just completed OAuth
          // This ensures they get fresh refresh tokens even if they're otherwise complete
          const tempAuthDataStr = localStorage.getItem('temp_google_auth');
          if (tempAuthDataStr) {
            console.log('🔄 CreateAccount: Updating existing user tokens from fresh OAuth...');
            try {
              const tempAuthData = JSON.parse(tempAuthDataStr);
              
              // Update existing user with fresh tokens
              const updatedUser = await supabaseService.updateUser(existingUser.id, {
                access_token_2: tempAuthData.accessToken,
                refresh_token_2: tempAuthData.refreshToken,
                client_id_2: tempAuthData.clientId,
                client_secret_2: tempAuthData.clientSecret,
                granted_scopes: tempAuthData.grantedScopes || null
              });
              
              console.log('✅ CreateAccount: Existing user tokens updated successfully');
              
              // Clear temp auth data
              localStorage.removeItem('temp_google_auth');
              
              // Use updated user data for completion check
              existingUser = updatedUser;
            } catch (error) {
              console.error('❌ CreateAccount: Failed to update existing user tokens:', error);
              // Continue with existing logic - don't fail the whole flow
            }
          }
          
          userData = await supabaseService.updateUser(existingUser.id, {
            display_name: tempAuthData.name,
            phone_number: fullPhoneNumber,
            access_token_2: tempAuthData.accessToken,
            refresh_token_2: tempAuthData.refreshToken,
            client_id_2: tempAuthData.clientId,
            client_secret_2: tempAuthData.clientSecret,
            granted_scopes: tempAuthData.grantedScopes || null
          });
          
          // Log what was actually sent to Supabase for update
          try {
            await loggingService.log('supabase_user_update_data', {
              userEmail,
              eventData: {
                update_operation: 'existing_user',
                granted_scopes_sent: tempAuthData.grantedScopes,
                granted_scopes_sent_type: typeof tempAuthData.grantedScopes,
                granted_scopes_sent_is_null: tempAuthData.grantedScopes === null,
                update_fields: ['display_name', 'phone_number', 'access_token_2', 'refresh_token_2', 'client_id_2', 'client_secret_2', 'granted_scopes'],
                timestamp: new Date().toISOString()
              }
            });
          } catch (logError) {
            console.warn('Failed to log Supabase update data:', logError);
          }
        } else {
          console.log('👤 Creating new user with complete data');
          // Create new user with all data at once
          userData = await supabaseService.createUser({
            email: tempAuthData.email,
            display_name: tempAuthData.name,
            phone_number: fullPhoneNumber,
            access_token_2: tempAuthData.accessToken,
            refresh_token_2: tempAuthData.refreshToken,
            client_id_2: tempAuthData.clientId,
            client_secret_2: tempAuthData.clientSecret,
            granted_scopes: tempAuthData.grantedScopes || null
          });
          
          // Log what was actually sent to Supabase for creation
          try {
            await loggingService.log('supabase_user_create_data', {
              userEmail,
              eventData: {
                create_operation: 'new_user',
                granted_scopes_sent: tempAuthData.grantedScopes,
                granted_scopes_sent_type: typeof tempAuthData.grantedScopes,
                granted_scopes_sent_is_null: tempAuthData.grantedScopes === null,
                create_fields: ['email', 'display_name', 'phone_number', 'access_token_2', 'refresh_token_2', 'client_id_2', 'client_secret_2', 'granted_scopes'],
                timestamp: new Date().toISOString()
              }
            });
          } catch (logError) {
            console.warn('Failed to log Supabase create data:', logError);
          }
        }
        
        console.log('✅ User operation completed successfully:', {
          userId: userData.id,
          email: userData.email
        });
        
        // Log final user data that was returned from Supabase
        try {
          await loggingService.log('supabase_user_operation_result', {
            userEmail,
            eventData: {
              returned_user_id: userData.id,
              returned_user_email: userData.email,
              returned_granted_scopes: userData.granted_scopes,
              returned_granted_scopes_type: typeof userData.granted_scopes,
              returned_granted_scopes_is_null: userData.granted_scopes === null,
              operation_successful: true,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.warn('Failed to log Supabase operation result:', logError);
        }
      } catch (error) {
        console.error('❌ Failed to create/update user in Supabase:', error);
        
        // Log Supabase operation failure
        try {
          await loggingService.log('phone_number_entered', {
            userEmail,
            success: false,
            errorMessage: `Supabase operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            eventData: {
              supabase_operation_failed: true,
              error_type: error instanceof Error ? error.constructor.name : 'Unknown'
            }
          });
        } catch (logError) {
          console.warn('Failed to log Supabase error:', logError);
        }
        
        throw error;
      }
      
      console.log('✅ User account created successfully:', userData);
      
      // Clear temporary auth data from localStorage
      localStorage.removeItem('temp_google_auth');
      console.log('🧹 Cleared temporary auth data from localStorage');
      
      // Log successful user operation
      try {
        await loggingService.log('phone_number_saved', {
          userId: userData.id,
          userEmail: userData.email,
          eventData: {
            user_operation_successful: true,
            phone_number_masked: fullPhoneNumber.substring(0, 3) + '***' + fullPhoneNumber.substring(fullPhoneNumber.length - 3),
            ready_for_telegram_connection: true
          }
        });
      } catch (logError) {
        console.warn('Failed to log successful operation:', logError);
      }
      
      // Update app context with user data
      setAppData(prev => ({ 
        ...prev, 
        userEmail: userData.email,
        userId: userData.id 
      }));
      
      // Account creation successful - navigate to Telegram connection
      console.log('✅ Account creation successful, navigating to connect-telegram');
      
      // Show loading state briefly then navigate to Telegram connection
      console.log('🔄 Navigating to connect-telegram in 1.5 seconds...');
      setTimeout(() => {
        console.log('🔄 Executing navigation to /connect-telegram');
        navigate('/connect-telegram');
      }, 1500);
      
    } catch (err) {
      console.error('Failed to create account:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      
      // Log overall failure
      try {
        await loggingService.log('phone_number_entered', {
          userEmail: user?.email || appData.userEmail,
          success: false,
          errorMessage: `Account creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          eventData: {
            overall_submission_failed: true,
            error_type: err instanceof Error ? err.constructor.name : 'Unknown'
          }
        });
      } catch (logError) {
        console.warn('Failed to log overall failure:', logError);
      }
      
      setError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/welcome');
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
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Create Your Account
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Enter your number and enable Telegram connection
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Your Phone Number</h3>
              
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  {/* Country Code Dropdown */}
                  <div className="relative flex-shrink-0 w-full sm:w-auto">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-3 pr-8 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer w-full sm:w-auto min-w-[120px]"
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting || !phoneNumber.trim()}>
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 animate-pulse" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Create Account</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}