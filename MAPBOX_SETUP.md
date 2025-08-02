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

For Supabase deployment, you have two options:

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Settings → Environment Variables
3. Add `VITE_MAPBOX_TOKEN` with your token value
4. Deploy your app

### Option 2: Supabase CLI
```bash
supabase secrets set VITE_MAPBOX_TOKEN=your_token_here
```

### Option 3: Local Development
Keep using the `.env` file for local development - it won't be committed to git.

## File Structure

Your project should look like this:
```
your-project/
├── .env                    ← Create this file (local development only)
├── supabase/               ← Your Supabase config
├── package.json
├── src/
├── public/
└── ...
```

## Security Notes

- ✅ `.env` is already in `.gitignore` - your token won't be committed
- ✅ Only use **public tokens** (start with `pk.`) for client-side code
- ✅ Never commit your secret tokens (start with `sk.`)
- ✅ Supabase handles environment variables securely

## Troubleshooting

If you see "Mapbox token not found" error:

**Local Development:**
1. Make sure `.env` file exists in project root
2. Make sure `VITE_MAPBOX_TOKEN=` is set correctly
3. Restart your development server after creating `.env`
4. Check that your token starts with `pk.` (public token)

**Supabase Production:**
1. Check that environment variable is set in Supabase dashboard
2. Verify the variable name is exactly `VITE_MAPBOX_TOKEN`
3. Redeploy your app after setting environment variables
4. Check Supabase logs for any environment variable issues 