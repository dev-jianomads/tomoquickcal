# 🚀 Deployment Guide

## Netlify Deployment Steps

### 1. **Prepare Your Repository**

Make sure your repository contains only the frontend files:
- ✅ `src/` folder with React components
- ✅ `package.json` with frontend dependencies only
- ✅ `netlify.toml` configuration file
- ✅ `.gitignore` excluding backend files
- ❌ No `backend/` folder
- ❌ No Signal CLI dependencies

### 2. **Set Up Environment Variables**

In Netlify Dashboard → Site Settings → Environment Variables, add these **4 variables**:

| Variable Name | Example Value | Description |
|---------------|---------------|-------------|
| `VITE_SUPABASE_URL` | `https://abc123.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Your Supabase anonymous key |
| `VITE_GOOGLE_CLIENT_ID` | `123456789-abc123.apps.googleusercontent.com` | Google OAuth client ID |
| `VITE_GOOGLE_CLIENT_SECRET` | `GOCSPX-abc123def456` | Google OAuth client secret |

### 3. **Deploy to Netlify**

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) and sign in
3. Click "New site from Git"
4. Choose GitHub and select your repository
5. Build settings should auto-detect:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables (step 2 above)
7. Click "Deploy site"

#### Option B: Manual Deploy
1. Run `npm run build` locally
2. Drag and drop the `dist` folder to Netlify

### 4. **Configure Google OAuth**

In Google Cloud Console:
1. Go to APIs & Services → Credentials
2. Edit your OAuth 2.0 client
3. Add your Netlify domain to **Authorized redirect URIs**:
   ```
   https://your-site-name.netlify.app/oauth-success
   ```

### 5. **Test Your Deployment**

Visit your Netlify URL and test:
- ✅ Google Calendar connection works
- ✅ Phone number can be entered and saved
- ✅ Data appears in Supabase
- ✅ All pages load correctly

## 🔧 Build Configuration

The `netlify.toml` file handles:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Redirects**: All routes → `index.html` (for React Router)
- **Headers**: Security and caching headers

## 🔒 Security Notes

- Environment variables are automatically injected during build
- Only `VITE_*` prefixed variables are exposed to the browser
- Google OAuth secrets are handled securely
- Supabase RLS (Row Level Security) should be enabled

## 📊 Monitoring

After deployment, monitor:
- **Netlify Analytics**: Page views and performance
- **Supabase Dashboard**: User registrations and data
- **Google Cloud Console**: OAuth usage and quotas

## 🐛 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify environment variables are set correctly
- Check build logs in Netlify dashboard

### OAuth Errors
- Verify redirect URIs in Google Cloud Console
- Check that client ID/secret are correct
- Ensure domain matches exactly (including https://)

### Supabase Connection Issues
- Verify Supabase URL and anon key
- Check RLS policies allow anonymous access where needed
- Test connection in Supabase dashboard

## 🚀 Next Steps

Once deployed:
1. **Test the full user flow**
2. **Set up your Signal backend** to read from Supabase
3. **Monitor user registrations** in Supabase dashboard
4. **Configure custom domain** in Netlify (optional)

Your frontend is now live and ready to collect user data for your Signal backend! 🎉