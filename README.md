# Tomo QuickCal - Frontend

A React frontend for Tomo QuickCal that handles Google Calendar integration and user onboarding. Users can connect their Google Calendar, enter their Signal phone number, and the data is saved to Supabase for backend processing.

## 🚀 Features

- **Google OAuth Integration** - Connect Google Calendar and Contacts
- **Phone Number Collection** - Users enter their Signal number
- **Supabase Storage** - User data and tokens saved securely
- **Responsive Design** - Works on desktop and mobile
- **Clean UI/UX** - Step-by-step onboarding flow

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Supabase** for database and user management
- **Google APIs** for Calendar and Contacts integration

## 📦 Deployment

This frontend is designed to be deployed to **Netlify** and works independently of the Signal backend.

### Environment Variables

Set these 4 variables in Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Deploy to Netlify

1. **Connect Repository**: Link your GitHub repo to Netlify
2. **Build Settings**: 
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Environment Variables**: Add the 4 variables above
4. **Deploy**: Netlify will automatically build and deploy

## 🏗️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API and external service integrations
└── main.tsx           # Application entry point
```

## 🔗 Integration

This frontend collects user data and saves it to Supabase. Your separate Signal backend can:

1. **Read user data** from Supabase
2. **Process Signal messages** using the stored phone numbers
3. **Create calendar events** using the stored Google tokens

## 🔒 Security

- Environment variables are properly prefixed with `VITE_`
- Google OAuth tokens are securely stored in Supabase
- No sensitive backend logic exposed to frontend
- Proper CORS and security headers configured

## 📱 User Flow

1. **Welcome** - Introduction to Tomo QuickCal
2. **Connect Calendar** - Google OAuth for Calendar and Contacts
3. **Connect Bot** - Enter Signal phone number
4. **Success** - Setup complete, ready for Signal integration

## 🤝 Contributing

This is the frontend portion of Tomo QuickCal. The Signal CLI backend is handled separately.

## 📄 License

MIT License - see LICENSE file for details