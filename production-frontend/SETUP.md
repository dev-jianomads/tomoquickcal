# 🚀 Quick Setup Guide

## 1. **Copy This Folder**

Copy the entire `production-frontend` folder to your local machine and create a new GitHub repository.

## 2. **Install Dependencies**

```bash
cd production-frontend
npm install
```

## 3. **Set Up Environment Variables**

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 4. **Test Locally**

```bash
npm run dev
```

Visit `http://localhost:5173` to test the app.

## 5. **Deploy to Netlify**

### Option A: GitHub Integration
1. Push to your GitHub repository
2. Connect GitHub repo to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

### Option B: Manual Deploy
```bash
npm run build
# Upload the 'dist' folder to Netlify
```

## 6. **Configure Google OAuth**

Add your Netlify domain to Google Cloud Console:
```
https://your-site-name.netlify.app/oauth-success
```

## ✅ **You're Done!**

Your frontend will now:
- ✅ Collect Google Calendar authentication
- ✅ Save user tokens to Supabase
- ✅ Collect Signal phone numbers
- ✅ Provide clean data for your Signal backend

## 🔗 **Next Steps**

Your Signal backend can now read user data from Supabase and process messages independently!