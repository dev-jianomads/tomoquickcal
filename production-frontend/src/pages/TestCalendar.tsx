import React, { useState } from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import CalendarEventCreator from '../components/CalendarEventCreator';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

const TestCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, user, signOut } = useGoogleAuth();
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<any[]>([]);

  const handleEventCreated = (event: any) => {
    setCreatedEvents(prev => [...prev, event]);
    setShowEventCreator(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome');
  };

  if (!isSignedIn) {
    return (
      <PageContainer>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Not Connected
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Please connect your Google Calendar and Contacts first.
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={() => navigate('/connect-calendar')}>
              Connect Google Calendar and Contacts
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
            onClick={() => navigate('/welcome')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Calendar Connected!
            </h1>
            {user && (
              <p className="text-gray-500 text-sm">
                Connected successfully
              </p>
            )}
          </div>
        </div>

        {!showEventCreator ? (
          <div className="space-y-4 flex flex-col items-center">
            <Button onClick={() => setShowEventCreator(true)}>
              Create Test Event
            </Button>
            
            {createdEvents.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">
                  Created Events ({createdEvents.length})
                </h3>
                <div className="space-y-2">
                  {createdEvents.map((event, index) => (
                    <div key={index} className="text-sm text-green-700">
                      <strong>{event.summary}</strong>
                      {event.htmlLink && (
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          View in Calendar
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <CalendarEventCreator
            onEventCreated={handleEventCreated}
            onClose={() => setShowEventCreator(false)}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default TestCalendar;