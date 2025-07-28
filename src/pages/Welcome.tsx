import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageCircle, QrCode, ArrowRight } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/connect-calendar');
  };

  return (
    <PageContainer>
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Tomo QuickCal
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
              Schedule meetings effortlessly through Signal messages. Let's get you set up in just a few steps.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg">Setup Process</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div className="flex items-center space-x-3 flex-1">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Connect Google Calendar and Contacts</span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div className="flex items-center space-x-3 flex-1">
                <MessageCircle className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600 font-medium">Connect Tomo QuickCal</span>
              </div>
            </div>

          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">What you'll be able to do:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start space-x-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Send messages like "Schedule meeting with John tomorrow at 2pm"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Automatically create Google Calendar events</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Invite attendees and set reminders</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Manage your schedule through simple conversations</span>
            </li>
          </ul>
        </div>

        <div className="pt-4">
          <Button onClick={handleGetStarted}>
            Get Started
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default Welcome;