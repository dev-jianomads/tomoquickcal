import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, AlertTriangle, Shield, Calendar, MessageCircle, Mail, Loader2 } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useApp } from '../contexts/AppContext';
import { supabaseService } from '../services/supabase';
import { loggingService } from '../services/logging';

const DeleteAccount: React.FC = () => {
  const navigate = useNavigate();
  const { appData } = useApp();
  const [emailInput, setEmailInput] = useState('');
  const [isLookingUpUser, setIsLookingUpUser] = useState(false);
  const [userLookupError, setUserLookupError] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const [deletionResults, setDeletionResults] = useState<{
    supabaseSuccess: boolean;
    googleSuccess: boolean;
    errors: string[];
  } | null>(null);

  // Get user email from app context, Google Auth, or URL params
  const [userEmail, setUserEmail] = useState<string>('');
  const [hasActiveSession, setHasActiveSession] = useState(false);
  
  React.useEffect(() => {
    const getUserEmail = async () => {
      try {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromUrl = urlParams.get('email');
        
        if (emailFromUrl) {
          setEmailInput(emailFromUrl);
          console.log('Delete Account: Email from URL:', emailFromUrl);
        }
        
        // Try to get from app context first
        if (appData.userEmail) {
          setUserEmail(appData.userEmail);
          setHasActiveSession(true);
          console.log('Delete Account: Email from app context:', appData.userEmail);
          return;
        }
        
        // Try to get from Google Auth if available
        try {
          const { default: googleAuthService } = await import('../services/googleAuth');
          await googleAuthService.initialize();
          const currentUser = googleAuthService.getCurrentUser();
          
          if (currentUser?.email) {
            setUserEmail(currentUser.email);
            setHasActiveSession(true);
            console.log('Delete Account: Email from Google Auth:', currentUser.email);
            return;
          }
        } catch (error) {
          console.warn('Could not get user from Google Auth:', error);
        }
        
        // Fallback to stored user data
        const storedUser = localStorage.getItem('google_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData.email) {
              setUserEmail(userData.email);
              setHasActiveSession(true);
              console.log('Delete Account: Email from localStorage:', userData.email);
              return;
            }
          } catch (e) {
            console.warn('Could not parse stored user data:', e);
          }
        }
        
        // No active session found
        console.log('Delete Account: No active session found, user will need to enter email');
        setHasActiveSession(false);
      } catch (error) {
        console.error('Error getting user email:', error);
        setHasActiveSession(false);
      }
    };
    
    getUserEmail();
  }, [appData.userEmail]);

  const handleEmailLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailInput.trim()) {
      setUserLookupError('Please enter your email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      setUserLookupError('Please enter a valid email address');
      return;
    }
    
    setIsLookingUpUser(true);
    setUserLookupError('');
    
    try {
      console.log('Delete Account: Looking up user by email:', emailInput);
      const userData = await supabaseService.findUserByEmail(emailInput.trim());
      
      if (userData) {
        console.log('Delete Account: User found:', userData.id);
        setFoundUser(userData);
        setUserEmail(emailInput.trim());
        setUserLookupError('');
      } else {
        console.log('Delete Account: User not found');
        setUserLookupError('No account found with this email address. Please check the email and try again.');
      }
    } catch (error) {
      console.error('Delete Account: Error looking up user:', error);
      setUserLookupError('Error looking up account. Please try again.');
    } finally {
      setIsLookingUpUser(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    // Get the email to delete
    const emailToDelete = userEmail || foundUser?.email;
    
    if (!emailToDelete) {
      setError('No user found to delete');
      return;
    }

    setIsDeleting(true);
    setError('');

    // Log deletion process start
    try {
      await loggingService.logAccountDeletionStarted(emailToDelete, 'self_service');
      console.log('✅ Logged account deletion start');
    } catch (logError) {
      console.warn('Failed to log deletion start:', logError);
    }

    const results = {
      supabaseSuccess: false,
      googleSuccess: false,
      errors: [] as string[]
    };

    try {
      // Step 1: Get user data before deletion for logging
      let userId = appData.userId || foundUser?.id;
      
      if (!userId) {
        try {
          const userData = await supabaseService.findUserByEmail(emailToDelete);
          userId = userData?.id || 'unknown';
          console.log('🔍 Found user ID for deletion logging:', userId);
        } catch (error) {
          console.warn('Could not find user ID for logging:', error);
          userId = 'unknown';
        }
      }

      console.log('🗑️ Starting deletion process for:', {
        userId,
        emailToDelete,
        hasFoundUser: !!foundUser,
        hasAppDataUserId: !!appData.userId
      });
      // Step 2: Revoke Google permissions server-side
      try {
        console.log('🔄 Revoking Google permissions...');
        const response = await fetch('/.netlify/functions/revoke-google-permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: emailToDelete
          })
        });

        const responseData = await response.json();
        
        if (response.ok && responseData.success) {
          console.log('✅ Google permissions revoked successfully');
          results.googleSuccess = true;
          
          // Log successful Google revocation
          try {
            await loggingService.logGooglePermissionsRevoked(userId, emailToDelete, true);
            console.log('✅ Logged Google permissions revocation success');
          } catch (logError) {
            console.warn('Failed to log Google revocation success:', logError);
          }
        } else {
          console.warn('⚠️ Failed to revoke Google permissions:', responseData);
          results.errors.push(`Google revocation: ${responseData.error || 'Unknown error'}`);
          
          // Log failed Google revocation
          try {
            await loggingService.logGooglePermissionsRevoked(userId, emailToDelete, false, responseData.error || 'Unknown error');
            console.log('✅ Logged Google permissions revocation failure');
          } catch (logError) {
            console.warn('Failed to log Google revocation failure:', logError);
          }
        }
      } catch (error) {
        console.error('❌ Error revoking Google permissions:', error);
        results.errors.push(`Google revocation: ${error instanceof Error ? error.message : 'Network error'}`);
        
        // Log Google revocation error
        try {
          await loggingService.logGooglePermissionsRevoked(userId, emailToDelete, false, error instanceof Error ? error.message : 'Network error');
          console.log('✅ Logged Google permissions revocation error');
        } catch (logError) {
          console.warn('Failed to log Google revocation error:', logError);
        }
      }

      // Step 3: Delete from Supabase
      try {
        console.log('🔄 Deleting user from Supabase...');
        const userData = await supabaseService.findUserByEmail(emailToDelete);
        
        if (userData) {
          // Log user data deletion BEFORE actually deleting
          try {
            await loggingService.logUserDataDeleted(userData.id, userData.email, true);
            console.log('✅ Logged user data deletion (before actual deletion)');
          } catch (logError) {
            console.warn('Failed to log user data deletion:', logError);
          }
          
          // Delete user (cascades to related tables)
          const { error: deleteError } = await supabaseService.supabase
            .from('users')
            .delete()
            .eq('email', emailToDelete);

          if (deleteError) {
            throw deleteError;
          }

          console.log('✅ User deleted from Supabase successfully');
          results.supabaseSuccess = true;
        } else {
          console.log('⚠️ User not found in Supabase');
          results.errors.push('User not found in database');
          
          // Log that user was not found
          try {
            await loggingService.logUserDataDeleted(userId, emailToDelete, false, 'User not found in database');
            console.log('✅ Logged user not found for deletion');
          } catch (logError) {
            console.warn('Failed to log user not found:', logError);
          }
        }
      } catch (error) {
        console.error('❌ Error deleting from Supabase:', error);
        results.errors.push(`Database deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Log failed user data deletion
        try {
          await loggingService.logUserDataDeleted(userId, emailToDelete, false, error instanceof Error ? error.message : 'Unknown error');
          console.log('✅ Logged user data deletion failure');
        } catch (logError) {
          console.warn('Failed to log user data deletion failure:', logError);
        }
      }

      // Step 4: Clear local storage
      try {
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_user');
        localStorage.removeItem('google_refresh_token');
        localStorage.removeItem('user_data');
        console.log('✅ Local storage cleared');
      } catch (error) {
        console.warn('⚠️ Error clearing local storage:', error);
      }

      // Step 5: Log final account deletion result BEFORE setting results
      try {
        await loggingService.logAccountDeleted(userId, emailToDelete, results);
        console.log('✅ Logged final account deletion result');
      } catch (logError) {
        console.error('❌ Failed to log final account deletion result:', logError);
      }
      setDeletionResults(results);

      // Redirect after showing results
      setTimeout(() => {
        navigate('/welcome');
      }, 5000);

    } catch (error) {
      console.error('❌ Unexpected error during deletion:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log unexpected deletion error
      try {
        await loggingService.log('account_deleted', {
          userEmail: emailToDelete,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unexpected deletion error',
          eventData: {
            unexpected_error: true,
            error_type: error instanceof Error ? error.constructor.name : 'Unknown',
            timestamp: new Date().toISOString()
          }
        });
        console.log('✅ Logged unexpected deletion error');
      } catch (logError) {
        console.warn('Failed to log unexpected deletion error:', logError);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    navigate('/success');
  };

  const handleBackToEmailInput = () => {
    setFoundUser(null);
    setUserEmail('');
    setConfirmText('');
  };

  // Show deletion results
  if (deletionResults) {
    const { supabaseSuccess, googleSuccess, errors } = deletionResults;
    const hasErrors = errors.length > 0;

    return (
      <PageContainer>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              supabaseSuccess && googleSuccess ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <Trash2 className={`w-8 h-8 ${
                supabaseSuccess && googleSuccess ? 'text-green-600' : 'text-orange-600'
              }`} />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Account Deletion {supabaseSuccess && googleSuccess ? 'Complete' : 'Partially Complete'}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {supabaseSuccess && googleSuccess 
                ? 'Your account and permissions have been successfully removed.'
                : 'Some parts of the deletion process encountered issues.'
              }
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left space-y-4">
            <h3 className="font-semibold text-gray-900">Deletion Status:</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  supabaseSuccess ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className={`text-xs ${supabaseSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {supabaseSuccess ? '✓' : '✗'}
                  </span>
                </div>
                <span className="text-gray-800">Account data deleted from Tomo servers</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  googleSuccess ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className={`text-xs ${googleSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {googleSuccess ? '✓' : '✗'}
                  </span>
                </div>
                <span className="text-gray-800">Google Calendar permissions revoked</span>
              </div>
            </div>

            {hasErrors && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium mb-2">Issues encountered:</p>
                <ul className="text-red-700 text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-blue-800 text-sm">
              Redirecting to welcome page in 5 seconds...
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={() => navigate('/welcome')}>
              Return to Welcome Page
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Show email input form if no active session and no user found yet
  if (!hasActiveSession && !foundUser && !userEmail) {
    return (
      <PageContainer>
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/welcome')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
          </div>

          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                <Mail className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Delete Account
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                Enter your email address to find and delete your Hello Tomo account.
              </p>
            </div>

            <form onSubmit={handleEmailLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isLookingUpUser}
                  required
                />
              </div>

              {userLookupError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{userLookupError}</p>
                </div>
              )}

              <div className="pt-2">
                <Button 
                  type="submit"
                  disabled={isLookingUpUser || !emailInput.trim()}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                >
                  {isLookingUpUser ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Looking up account...
                    </div>
                  ) : (
                    'Find My Account'
                  )}
                </Button>
              </div>
            </form>
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
            onClick={!hasActiveSession && foundUser ? handleBackToEmailInput : handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {!hasActiveSession && foundUser ? 'Change Email' : 'Back'}
          </button>
        </div>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Delete Account
            </h1>
            {!hasActiveSession && foundUser && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  ✅ Account found: <strong>{foundUser.email}</strong>
                </p>
              </div>
            )}
            <p className="text-gray-600 text-lg leading-relaxed">
              Permanently delete your Hello Tomo account and revoke all permissions.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-red-800 text-sm font-medium">
                  This action cannot be undone
                </p>
                <p className="text-red-700 text-sm">
                  Deleting your account will permanently remove all your data and revoke access to your Google Calendar.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left space-y-4">
            <h3 className="font-semibold text-gray-900">What will be deleted:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Your account data</p>
                  <p className="text-sm text-gray-600">Email, phone number, and all associated records from Tomo servers</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Google Calendar permissions</p>
                  <p className="text-sm text-gray-600">Revoke access to create events and read contacts</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MessageCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Telegram bot functionality</p>
                  <p className="text-sm text-gray-600">Tomo will no longer respond to your Telegram messages (chat history remains)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-gray-900 mb-2">What will NOT be affected:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your existing Google Calendar events (they remain untouched)</li>
              <li>• Your Google account and other Google services</li>
              <li>• Your Telegram account and chat history with Tomo</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isDeleting}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <Button 
                onClick={handleDelete} 
                disabled={isDeleting || confirmText !== 'DELETE'}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                {isDeleting ? 'Deleting Account...' : 'Delete Account Permanently'}
              </Button>
            </div>
          </div>

          {userEmail && (
            <div className="text-sm text-gray-500">
              Deleting account for: <strong>{userEmail || foundUser?.email}</strong>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default DeleteAccount;