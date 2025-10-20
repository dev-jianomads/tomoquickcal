# Hello Tomo - Telegram Frontend

A React frontend for Hello Tomo that handles Google Calendar integration and user onboarding. Users can connect their Google Calendar, enter their phone number, and receive an SMS link to start chatting with @AskTomoBot on Telegram.

**Created by:** Ken

## 🚀 Features

- **Google OAuth Integration** - Connect Google Calendar and Contacts
- **Phone Number Collection** - Users enter their phone number for SMS delivery
- **Supabase Storage** - User data and tokens saved securely
- **Responsive Design** - Works on desktop and mobile
- **Clean UI/UX** - Step-by-step onboarding flow
- **Telegram Integration** - SMS link to start chatting with @AskTomoBot

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Supabase** for database and user management
- **Google APIs** for Calendar and Contacts integration
- **Telegram Bot** integration via SMS links

## 📦 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd tomo-quickcal-frontend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Development

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## 🔧 Environment Variables

Create a `.env` file with these variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 📦 Deployment to Netlify

### Option 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy automatically on every push

### Option 2: Manual Deploy

```bash
npm run build
# Upload the 'dist' folder to Netlify
```

### Environment Variables for Netlify

Set these in **Netlify Dashboard → Site Settings → Environment Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_SECRET`

## 🔗 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Calendar API and Contacts API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized redirect URIs:
   ```
   https://your-domain.netlify.app/oauth-success
   ```

## 📊 Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in the `supabase/migrations` folder
3. Enable Row Level Security (RLS)
4. Get your project URL and anon key

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

## 🔒 Security

- Environment variables are properly prefixed with `VITE_`
- Google OAuth tokens are securely stored in Supabase
- Row Level Security (RLS) enabled on all tables
- Proper CORS and security headers configured

## 📱 User Flow

1. **Welcome** - Introduction to Hello Tomo
2. **Connect Bot** - Enter phone number for SMS
3. **Success** - Setup complete, SMS sent with Telegram link
4. **Success** - Setup complete, ready for Signal integration

## 🔗 Telegram Integration

This frontend saves user data to Supabase. Your Telegram backend can:

1. **Read user data** from Supabase
2. **Send SMS** with Telegram bot links using stored phone numbers
3. **Create calendar events** using stored Google tokens
4. **Process Telegram messages** from @AskTomoBot

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the GitHub Issues
- Review the deployment documentation
- Verify environment variables are set correctly