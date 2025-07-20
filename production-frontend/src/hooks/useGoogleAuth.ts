import { useState, useEffect } from 'react';
import googleAuthService from '../services/googleAuth';

export const useGoogleAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
      
      // Add timeout to prevent hanging
      const signInPromise = googleAuthService.signIn();
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Sign-in timeout')), 30000); // 30 second timeout
      });
      
      const success = await Promise.race([signInPromise, timeoutPromise]);
      console.log('useGoogleAuth: Sign-in success:', success);
      
      if (success) {
        setIsSignedIn(true);
        setUser(googleAuthService.getCurrentUser());
      }
      
      return success;
    } catch (err) {
      console.error('useGoogleAuth: Sign-in error:', err);
      let errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      
      // Handle specific error cases
      if (errorMessage.includes('timeout')) {
        errorMessage = 'Connection timeout. Please try again.';
      } else if (errorMessage.includes('popup')) {
        errorMessage = 'Popup blocked. Please allow popups and try again.';
      }
      
      setError(errorMessage);
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
    createEvent
  };
};