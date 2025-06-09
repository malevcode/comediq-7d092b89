
# Comediq - Complete Build Instructions

## Overview
Comediq is a React-based web application for comedians to find open mics, track their sets, and grow their comedy careers. This guide will walk you through building the entire application from scratch.

## Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Routing**: React Router DOM
- **State Management**: TanStack React Query
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Form Handling**: React Hook Form with Zod validation

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Git
- Supabase account (for backend functionality)

## Project Setup

### 1. Initialize the Project
```bash
# Create new Vite React TypeScript project
npm create vite@latest comediq -- --template react-ts
cd comediq
npm install
```

### 2. Install Core Dependencies
```bash
# UI and Styling
npm install tailwindcss @tailwindcss/typography tailwindcss-animate
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-label
npm install @radix-ui/react-select @radix-ui/react-toast
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Icons and Charts
npm install lucide-react recharts

# Routing and State Management
npm install react-router-dom @tanstack/react-query

# Forms and Validation
npm install react-hook-form @hookform/resolvers zod

# Backend Integration
npm install @supabase/supabase-js

# Additional UI Components
npm install sonner vaul input-otp
npm install date-fns react-day-picker
npm install embla-carousel-react
npm install next-themes
npm install cmdk
npm install react-resizable-panels
```

### 3. Configure Tailwind CSS
```bash
npx tailwindcss init -p
```

Update `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 4. Setup shadcn/ui
```bash
npx shadcn-ui@latest init
```

Install required shadcn/ui components:
```bash
npx shadcn-ui@latest add button input label select toast
npx shadcn-ui@latest add card dialog dropdown-menu
npx shadcn-ui@latest add form textarea checkbox
npx shadcn-ui@latest add navigation-menu tabs
```

## Application Structure

### 5. Create Project Structure
```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── BottomNavigation.tsx
│   ├── Hero.tsx
│   ├── Navigation.tsx
│   ├── Features.tsx
│   ├── Pricing.tsx
│   └── WaitlistForm.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── use-toast.ts
│   ├── useOpenMics.ts
│   └── useMicRatings.ts
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── types.ts
├── lib/
│   └── utils.ts
├── pages/
│   ├── Index.tsx
│   ├── OpenMics.tsx
│   ├── TrackSets.tsx
│   ├── Auth.tsx
│   ├── Profile.tsx
│   └── NotFound.tsx
├── types/
│   └── openMic.ts
├── App.tsx
└── main.tsx
```

### 6. Setup Supabase Integration

Create `src/integrations/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Create environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 7. Database Schema

Create these tables in Supabase:

**waitlist table:**
```sql
CREATE TABLE waitlist (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  instagram_handle TEXT,
  phone TEXT,
  years_in_comedy TEXT NOT NULL,
  open_mics_per_month INTEGER DEFAULT 0,
  monthly_spend INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**profiles table:**
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. Core Components

#### Main App Component (`src/App.tsx`)
```typescript
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import OpenMics from "./pages/OpenMics";
import TrackSets from "./pages/TrackSets";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import BottomNavigation from "./components/BottomNavigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/open-mics" element={<OpenMics />} />
            <Route path="/track-sets" element={<TrackSets />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNavigation />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
```

#### Landing Page (`src/pages/Index.tsx`)
- Hero section with main value proposition
- Features section highlighting key capabilities
- Pricing section (free plan focus)
- Waitlist form for early access

#### Open Mics Page (`src/pages/OpenMics.tsx`)
- Search and filter functionality
- Grid layout showing mic information
- Location-based filtering
- Date/time filtering

### 9. Key Features Implementation

#### Authentication Context
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### Data Fetching Hooks
```typescript
// src/hooks/useOpenMics.ts
import { useQuery } from '@tanstack/react-query';

export const useOpenMics = () => {
  return useQuery({
    queryKey: ['openMics'],
    queryFn: async () => {
      // Fetch open mics data
      return [];
    },
  });
};
```

### 10. Styling Guidelines

- Use Tailwind CSS for all styling
- Implement responsive design (mobile-first approach)
- Orange (#f97316) as primary brand color
- Clean, modern design with rounded corners
- Consistent spacing using Tailwind's spacing scale
- Use semantic color tokens from the design system

### 11. Mobile Responsiveness

- Bottom navigation for mobile users
- Grid layouts that adapt to screen size
- Touch-friendly button sizes
- Optimized form layouts for mobile input

### 12. Development Workflow

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 13. Deployment

The application can be deployed to various platforms:
- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag and drop build folder or Git integration
- **Lovable**: Use built-in publishing feature

### 14. Environment Configuration

Required environment variables:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 15. Testing Strategy

- Component testing with React Testing Library
- Integration testing for user flows
- E2E testing with Playwright or Cypress
- Manual testing on multiple devices/browsers

## Key Design Principles

1. **Mobile-First**: Design for mobile users primarily
2. **Performance**: Optimize loading times and user experience
3. **Accessibility**: Ensure WCAG compliance
4. **User-Centric**: Focus on comedian's actual needs
5. **Scalable**: Architecture that supports future growth

## Additional Considerations

- **SEO**: Meta tags and structured data for open mics
- **Analytics**: User behavior tracking
- **Error Handling**: Graceful error states and fallbacks
- **Offline Support**: Progressive Web App features
- **Security**: Input validation and XSS prevention

This guide provides the foundation for building Comediq. Each component should be built incrementally, tested thoroughly, and optimized for the target user experience.
