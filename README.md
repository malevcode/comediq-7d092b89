# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a8910b23-961d-4052-9e5f-aa1fc519789f

## Environment Variables

This project uses several environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration (already configured)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox Configuration (for map functionality)
VITE_MAPBOX_TOKEN=your_mapbox_public_token
```

### Getting API Keys

**Supabase**: 
- Go to [supabase.com](https://supabase.com) and create a project
- Find your project URL and anon key in the project settings

**Mapbox**: 
- Go to [mapbox.com](https://mapbox.com) and create a free account
- Create a new token with public scope
- Use the public token (starts with `pk.`)

### Development vs Production

- **Development**: You can manually enter the Mapbox token in the app, and it will be stored in localStorage
- **Production**: Set `VITE_MAPBOX_TOKEN` in your environment variables for automatic configuration

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a8910b23-961d-4052-9e5f-aa1fc519789f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Create environment variables file
cp .env.example .env
# Edit .env with your API keys

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend)
- Mapbox (Maps)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a8910b23-961d-4052-9e5f-aa1fc519789f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
