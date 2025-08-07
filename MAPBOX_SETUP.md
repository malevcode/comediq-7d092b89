# Mapbox Setup Guide (Supabase)

## Quick Setup

1. **Create a `.env` file** in the project root (same level as `package.json`)

2. **Add your Mapbox token** to the `.env` file:
```bash
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.example
```

3. **Get your token** from [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)

## How to Get Your Mapbox Token

1. Go to [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
2. Sign in or create an account
3. Copy your **Default public token** (starts with `pk.`)
4. Paste it in your `.env` file

## Supabase Deployment

For Supabase deployment, you have multiple options:

### Option 1: Supabase Vault (Recommended - New Approach)
1. Go to your Supabase project dashboard
2. Navigate to **Integrations** → **Vault**
3. Add a new secret:
   - **Name**: `VITE_MAPBOX_TOKEN`
   - **Value**: Your Mapbox public token (starts with `pk.`)
4. The app will automatically fetch the token via Edge Function

### Option 2: Supabase Dashboard Environment Variables (Legacy)
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `VITE_MAPBOX_TOKEN`
   - **Value**: Your Mapbox public token (starts with `pk.`)
4. Click **Save**
5. **Important**: Redeploy your app after setting environment variables

### Option 3: Supabase CLI
```bash
supabase secrets set VITE_MAPBOX_TOKEN=your_token_here
```

### Option 4: Local Development
Keep using the `.env` file for local development - it won't be committed to git.

## File Structure

Your project should look like this:
```
your-project/
├── .env                    ← Create this file (local development only)
├── supabase/               ← Your Supabase config
│   └── functions/
│       └── get-mapbox-token/ ← Edge Function for token retrieval
├── package.json
├── src/
├── public/
└── ...
```

## Security Notes

- ✅ `.env` is already in `.gitignore` - your token won't be committed
- ✅ Only use **public tokens** (start with `pk.`) for client-side code
- ✅ Never commit your secret tokens (start with `sk.`)
- ✅ Supabase Vault handles environment variables securely
- ✅ Edge Functions provide secure access to Vault secrets

## Troubleshooting

If you see "Mapbox token not found" error:

### Local Development:
1. Make sure `.env` file exists in project root
2. Make sure `VITE_MAPBOX_TOKEN=` is set correctly
3. Restart your development server after creating `.env`
4. Check that your token starts with `pk.` (public token)
5. Use the debug button in development mode to check environment variables

### Supabase Production:
1. **Check Vault secret:**
   - Go to your Supabase project dashboard
   - Integrations → Vault
   - Verify `VITE_MAPBOX_TOKEN` is set correctly
   - Make sure the value starts with `pk.`

2. **Check Edge Function:**
   - Go to Functions in your Supabase dashboard
   - Verify `get-mapbox-token` function is deployed
   - Check function logs for any errors

3. **Check browser console:**
   - Open browser developer tools
   - Look for console messages about Mapbox token
   - The app will show detailed debug information

4. **Verify token format:**
   - Mapbox public tokens start with `pk.`
   - They are typically around 140-150 characters long
   - Example: `pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.example`

### Common Issues:

1. **Token not working in production:**
   - Vault secret not set correctly
   - Edge Function not deployed
   - Wrong token format (using secret token instead of public token)

2. **Token working locally but not in production:**
   - Local `.env` file is being used instead of Vault
   - Edge Function not properly configured
   - Vault secret name is incorrect (must be `VITE_MAPBOX_TOKEN`)

3. **Debugging:**
   - Use the "Debug Environment Variables" button in development mode
   - Check browser console for detailed logging
   - Verify token format and length
   - Check Edge Function logs in Supabase dashboard

## Fallback Mechanism

The app includes a comprehensive fallback mechanism:
1. First tries to use `VITE_MAPBOX_TOKEN` environment variable
2. Falls back to localStorage token (for development)
3. Attempts to fetch token from Edge Function (Vault)
4. Shows a token input form if no token is available

This ensures the app works in all scenarios:
- ✅ **Production with Vault secrets** (recommended)
- ✅ **Production with environment variables** (legacy)
- ✅ **Production with manual token input** (fallback)
- ✅ **Development with `.env` file**
- ✅ **Development with manual token input**

## Edge Function Details

The app includes a `get-mapbox-token` Edge Function that:
- Securely retrieves the token from Supabase Vault
- Returns it to the client-side application
- Handles CORS and error cases
- Provides detailed logging for debugging

The function is automatically deployed when you run:
```bash
supabase functions deploy get-mapbox-token
``` 