# Hello Tomo - Onboarding Frontend

A React frontend for Hello Tomo that handles Google Calendar integration and user onboarding. Users connect Google Calendar, enter their phone number, and choose Telegram or WhatsApp to chat with Tomo.

**Created by:** Ken

## 🚀 Features

- **Google OAuth Integration** - Connect Google Calendar and Contacts
- **Phone Number Collection** - Users enter their phone number for SMS delivery
- **Supabase Storage** - User data and tokens saved securely
- **Responsive Design** - Works on desktop and mobile
- **Clean UI/UX** - Step-by-step onboarding flow
- **Messaging Integrations** - Connect Telegram or WhatsApp

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Supabase** for database and user management (normalized schema)
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

## 📊 Supabase Setup (Normalized Schema)

1. Create a new Supabase project
2. New tables in public schema: `users`, `user_integrations`, `services`
3. RPC available in public schema (callable from anon):
   - `public.get_user_integrations(user_id)`
   - `public.user_has_service(user_id, service_id)`
   - `public.link_calendar_to_user(...)`
   - `public.update_calendar_token(user_id, access_token, expiry_seconds, refresh_token?)`
   - `public.link_telegram_to_user(...)`, `public.link_whatsapp_to_user(...)`
   - `public.unlink_service_from_user(user_id, service_id, external_user_id?)`
4. Get your project URL and anon key

## 📁 Project Structure (Key Files)

```
src/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API and external service integrations
└── main.tsx           # Application entry point

Netlify Functions:
- `netlify/functions/telegram-signup.js` (proxies to n8n)
- `netlify/functions/whatsapp-signup.js` (proxies to n8n)
```

## 🔒 Security Notes

- Environment variables are properly prefixed with `VITE_`
- Tokens are stored in `user_integrations` via RPC; frontend uses anon RPC
- Keep sensitive token-returning RPC usage to backend if you later enable strict RLS
- Proper CORS and security headers configured

## 📱 User Flow

1. **Welcome** - Introduction to Hello Tomo
2. **Create Account** - Enter phone number and choose Telegram/WhatsApp
3. **Connect Telegram/WhatsApp** - Trigger Netlify function (n8n webhook)
4. **Success** - Setup complete

## 🔗 Integrations

This frontend saves user profile and service links to Supabase. Your messaging backends can:

1. **Read user data** from Supabase
2. **Send links/messages** using stored phone numbers
3. **Create calendar events** using Google tokens retrieved server-side
4. **Process chat messages** and call backend services

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