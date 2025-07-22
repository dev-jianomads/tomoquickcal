import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, AlertTriangle, Shield, Calendar, MessageCircle, CheckCircle } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useApp } from '../contexts/AppContext';
import { supabaseService } from '../services/supabase';
import { loggingService } from '../services/logging';

const DeleteAccount: React.FC = () => {
  const navigate = useNavigate();
  const { appData } = useApp();
  const { getCurrentUser } = useGoogleAuth();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const [deletionResults, setDeletionResults] = useState<{
    supabaseSuccess: boolean;
    googleSuccess: boolean;
    errors: string[];
  } | null>(null);

  const currentUser = getCurrentUser();
  const userEmail = currentUser?.email || appData.userEmail;

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    if (!userEmail) {
      setError('No user found to delete');
      return;
    }

    setIsDeleting(true);
    setError('');

    const results = {
      supabaseSuccess: false,
      googleSuccess: false,
      errors: [] as string[]
    };

    try {
      // Step 1: Get user data before deletion for logging
      let userId = appData.userId;
      if (!userId) {
        try {
          const userData = await supabaseService.findUserByEmail(userEmail);
          userId = userData?.id || 'unknown';
        } catch (error) {
          console.warn('Could not find user ID for logging:', error);
          userId = 'unknown';
        }
      }

      // Step 2: Revoke Google permissions server-side
      try {
        console.log('🔄 Revoking Google permissions...');
        const response = await fetch('/.netlify/functions/revoke-google-permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: userEmail
          })
        });

        const responseData = await response.json();
        
        if (response.ok && responseData.success) {
          console.log('✅ Google permissions revoked successfully');
          results.googleSuccess = true;
        } else {
          console.warn('⚠️ Failed to revoke Google permissions:', responseData);
          results.errors.push(`Google revocation: ${responseData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('❌ Error revoking Google permissions:', error);
        results.errors.push(`Google revocation: ${error instanceof Error ? error.message : 'Network error'}`);
      }

      // Step 3: Delete from Supabase
      try {
        console.log('🔄 Deleting user from Supabase...');
        const userData = await supabaseService.findUserByEmail(userEmail);
        
        if (userData) {
          // Log account deletion before deleting
          await loggingService.log('account_deleted', {
            userId: userData.id,
            userEmail: userData.email,
            eventData: {
              deleted_user_id: userData.id,
              google_revocation_success: results.googleSuccess,
              timestamp: new Date().toISOString()
            }
          });

          // Delete user (cascades to related tables)
          const { error: deleteError } = await supabaseService.supabase
            .from('users')
            .delete()
            .eq('email', userEmail);

          if (deleteError) {
            throw deleteError;
          }

          console.log('✅ User deleted from Supabase successfully');
          results.supabaseSuccess = true;
        } else {
          console.log('⚠️ User not found in Supabase');
          results.errors.push('User not found in database');
        }
      } catch (error) {
        console.error('❌ Error deleting from Supabase:', error);
        results.errors.push(`Database deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      setDeletionResults(results);

      // Redirect after showing results
      setTimeout(() => {
        navigate('/welcome');
      }, 5000);

    } catch (error) {
      console.error('❌ Unexpected error during deletion:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    navigate('/success');
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
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Delete Account
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Permanently delete your Tomo QuickCal account and revoke all permissions.
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
                  <p className="font-medium text-gray-900">Signal bot connection</p>
                  <p className="text-sm text-gray-600">Tomo will no longer respond to your Signal messages</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-gray-900 mb-2">What will NOT be affected:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your existing Google Calendar events (they remain untouched)</li>
              <li>• Your Google account and other Google services</li>
              <li>• Your Signal account and messages</li>
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
              Deleting account for: <strong>{userEmail}</strong>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default DeleteAccount;