# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be ready

## 2. Get Your Credentials

1. Go to Settings → API
2. Copy your `Project URL` and `anon public` key
3. Add them to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 3. Set Up Database Schema

Run this SQL in your Supabase SQL Editor (Settings → SQL Editor):

```sql
-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
```

## 4. Configure Authentication

1. Go to Authentication → Settings
2. Enable Email/Password authentication
3. Go to Authentication → Providers
4. Enable Google OAuth:
   - Get your Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Add your Google Client ID and Secret
   - Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

## 5. Test the Setup

1. Visit `/test-db` in your app to check if the profiles table is accessible
2. Try signing up with email/password
3. Try signing in with Google

## Troubleshooting

### Profile fetch error
If you see "Profile fetch error" messages:
1. Make sure you've run the SQL script above
2. Check that RLS policies are enabled
3. Verify your environment variables are correct

### 406 Error
If you see a 406 error when fetching profiles:
1. The profiles table might not be properly configured
2. RLS policies might be missing
3. Run the SQL script again to ensure proper setup

### Google OAuth Issues
1. Make sure Google OAuth is enabled in Supabase
2. Check that your redirect URLs are correct
3. Verify your Google OAuth credentials
