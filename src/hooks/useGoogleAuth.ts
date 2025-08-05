import { useState, useEffect } from 'react';
import googleAuthService from '../services/googleAuth';

export const useGoogleAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCheckAgain, setShowCheckAgain] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('useGoogleAuth: Initializing auth service...');
        await googleAuthService.initialize();
        console.log('useGoogleAuth: Auth service initialized');
        
        const signedIn = googleAuthService.isSignedIn();
        const currentUser = googleAuthService.getCurrentUser();
        
        console.log('useGoogleAuth: Auth status check:', {
          signedIn,
          hasUser: !!currentUser,
          userEmail: currentUser?.email
        });
        
        setIsSignedIn(signedIn);
        
        if (signedIn) {
          setUser(currentUser);
        }
        
      } catch (err) {
        console.error('Auth check failed:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuthStatus();
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('useGoogleAuth: Starting sign-in...');
      
      const success = await googleAuthService.signIn();
      console.log('useGoogleAuth: Sign-in success:', success);
      
      if (success) {
        setIsSignedIn(true);
        setUser(googleAuthService.getCurrentUser());
      } else {
        // Provide more helpful error message
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isMobile && isSafari) {
          setError('Connection timeout. Try: Settings → Safari → Privacy & Security → Prevent Cross-Site Tracking (turn OFF), then try again.');
        } else if (isMobile) {
          setError('Connection timeout. Please check your internet connection and try again.');
        } else {
          setError('Connection timeout. Please allow popups for this site and try again.');
        }
      }
      
      return success;
    } catch (err) {
      console.error('useGoogleAuth: Sign-in error:', err);
      let errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      
      // Handle specific error cases
      const isMobileSafari = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
      
      if (isMobileSafari && errorMessage.includes('timeout')) {
        errorMessage = 'Safari timeout. Try: Settings → Safari → Privacy & Security → Prevent Cross-Site Tracking (turn OFF), then try again.';
      } else if (errorMessage.includes('popup')) {
        errorMessage = 'Popup blocked. Please allow popups and try again.';
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      setShowCheckAgain(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkAgain = async () => {
    setError(null);
    setShowCheckAgain(false);
    setIsLoading(true);
    
    try {
      console.log('🔄 Checking for completed OAuth...');
      
      // Re-initialize to check for stored tokens
      await googleAuthService.initialize();
      const currentUser = googleAuthService.getCurrentUser();
      const isCurrentlySignedIn = googleAuthService.isSignedIn();
      
      console.log('🔄 Check again result:', {
        isCurrentlySignedIn,
        hasCurrentUser: !!currentUser,
        userEmail: currentUser?.email
      });
      
      if (isCurrentlySignedIn && currentUser) {
        console.log('✅ OAuth was completed! Updating state...');
        setIsSignedIn(true);
        setUser(currentUser);
        return true;
      } else {
        console.log('❌ OAuth still not completed');
        setError('OAuth not completed yet. Please try connecting again.');
        setShowCheckAgain(true);
        return false;
      }
    } catch (error) {
      console.error('Error checking OAuth status:', error);
      setError('Error checking authentication status. Please try again.');
      setShowCheckAgain(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const signOut = async () => {
    setIsLoading(true);
    
    try {
      await googleAuthService.signOut();
      setIsSignedIn(false);
      setUser(null);
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventDetails: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: { email: string }[];
  }) => {
    try {
      return await googleAuthService.createCalendarEvent(eventDetails);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    isSignedIn,
    isInitialized,
    isLoading,
    error,
    user,
    signIn,
    signOut,
    createEvent,
    checkAgain,
    showCheckAgain
  };
};