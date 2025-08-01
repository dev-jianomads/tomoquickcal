import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Welcome from './pages/Welcome';
import ConnectBot from './pages/ConnectBot';
import Success from './pages/Success';
import TestCalendar from './pages/TestCalendar';
import ReconnectCalendar from './pages/ReconnectCalendar';
import DeleteAccount from './pages/DeleteAccount';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/connect-bot" element={<ConnectBot />} />
            <Route path="/success" element={<Success />} />
            <Route path="/test-calendar" element={<TestCalendar />} />
            <Route path="/reconnect-calendar" element={<ReconnectCalendar />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            {/* Legacy redirects */}
            <Route path="/landing" element={<Navigate to="/welcome" replace />} />
            {/* OAuth success page for handling redirects */}
            <Route path="/oauth-success" element={<OAuthSuccessHandler />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

// Simple component to handle OAuth success and redirect
const OAuthSuccessHandler: React.FC = () => {
  const [isProcessing, setIsProcessing] = React.useState(true);
  
  React.useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        console.log('🔄 OAuthSuccessHandler: Processing OAuth callback...');
        setIsProcessing(true);
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
          // Import and handle OAuth callback
          const { default: googleAuthService } = await import('./services/googleAuth');
          const success = await googleAuthService.handleAuthCallback(code, state);
          
          if (success) {
            console.log('🔄 OAuthSuccessHandler: OAuth successful, navigating to /connect-bot');
            // Check if we're in the OAuth tab (has opener) or main tab
            if (window.opener && !window.opener.closed) {
              // We're in the OAuth tab, redirect the main tab and close this one
              console.log('🔄 OAuthSuccessHandler: In OAuth tab, redirecting main tab');
              window.opener.location.href = '/connect-bot';
              window.close();
            } else {
              // We're in the main tab, just navigate normally
              console.log('🔄 OAuthSuccessHandler: In main tab, navigating normally');
              window.location.href = '/connect-bot';
            }
          } else {
            console.log('🔄 OAuthSuccessHandler: OAuth failed, redirecting to /connect-calendar');
            if (window.opener && !window.opener.closed) {
              window.opener.location.href = '/connect-calendar';
              window.close();
            } else {
              window.location.href = '/connect-calendar';
            }
          }
        } else {
          console.log('🔄 OAuthSuccessHandler: No OAuth code, redirecting to /connect-calendar');
          if (window.opener && !window.opener.closed) {
            window.opener.location.href = '/connect-calendar';
            window.close();
          } else {
            window.location.href = '/connect-calendar';
          }
        }
      } catch (error) {
        console.error('OAuthSuccessHandler error:', error);
        if (window.opener && !window.opener.closed) {
          window.opener.location.href = '/connect-calendar';
          window.close();
        } else {
          window.location.href = '/connect-calendar';
        }
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleOAuthSuccess();
  }, []);
  
  // Show minimal loading state (should be very brief)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Completing authentication...</p>
          </>
        ) : (
          <p className="text-gray-600">Redirecting...</p>
        )}
      </div>
    </div>
  );
};

export default App;