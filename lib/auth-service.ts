import { supabase } from './supabase'
import type { Database } from './supabase'

export type User = {
  id: string
  email: string
  name: string
  avatar_url?: string
}

export class AuthService {
  static async signUp(email: string, password: string, name: string): Promise<{ user: User; needsEmailVerification: boolean }> {
    console.log('Starting sign up process for:', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (error) {
      console.error('Supabase auth signup error:', error)
      throw new Error(`Signup failed: ${error.message}`)
    }

    if (!data.user) {
      console.error('No user data returned from signup')
      throw new Error('Failed to create user - no user data returned')
    }

    console.log('User created successfully:', data.user.id)

    // Create profile in profiles table (handle case where table doesn't exist yet)
    try {
      console.log('Attempting to create profile for user:', data.user.id)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: name,
        })

      if (profileError) {
        console.error('Profile creation error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          fullError: JSON.stringify(profileError)
        })
        // Don't throw here as the user was created successfully
      } else {
        console.log('Profile created successfully')
      }
    } catch (error) {
      console.error('Profile table may not exist yet:', error)
      // Don't throw here as the user was created successfully
    }

    // Check if email verification is required
    const needsEmailVerification = !data.session && data.user && !data.user.email_confirmed_at

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name,
      },
      needsEmailVerification
    }
  }

  static async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.user) {
      throw new Error('Failed to sign in')
    }

    // Get user profile (handle case where profiles table doesn't exist yet)
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile fetch error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          fullError: JSON.stringify(profileError)
        })
        
        // If it's a 406 error, the table might not be set up correctly
        if (profileError.code === '406') {
          console.warn('Profiles table may not be properly configured. Skipping profile fetch.')
        }
      } else {
        profile = profileData
      }
    } catch (error) {
      console.error('Profile table may not exist yet:', error)
    }

    // For Google OAuth users, get avatar from user metadata
    const googleAvatar = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture
    const googleName = data.user.user_metadata?.full_name || data.user.user_metadata?.name

    return {
      id: data.user.id,
      email: data.user.email!,
      name: profile?.full_name || googleName || data.user.user_metadata?.full_name || email.split('@')[0],
      avatar_url: profile?.avatar_url || googleAvatar,
    }
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
    
    // Clear any local storage that might contain auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      console.log('AuthService: Getting current user session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('AuthService: Error getting session:', sessionError)
        throw sessionError
      }

      if (!session?.user) {
        console.log('AuthService: No active session found')
        return null
      }

      const user = session.user
      console.log(`AuthService: Session found for user ${user.id}, fetching profile...`)

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        // Log the error but don't throw, as we can still return partial user data
        console.error('AuthService: Error fetching profile:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
        })
      }

      const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name

      const userData: User = {
        id: user.id,
        email: user.email!,
        name: profile?.full_name || googleName || user.email!.split('@')[0],
        avatar_url: profile?.avatar_url || googleAvatar,
      }
      
      console.log('AuthService: Returning user data:', { id: userData.id, email: userData.email, name: userData.name })
      return userData
      
    } catch (error) {
      console.error('AuthService: A critical error occurred in getCurrentUser:', error)
      // For any unexpected errors, return null to ensure the app doesn't crash
      return null
    }
  }

  // Test method to check if profiles table is accessible
  static async testProfilesTable(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('Profiles table test failed:', error)
        return false
      }
      
      console.log('Profiles table is accessible')
      return true
    } catch (error) {
      console.error('Profiles table test error:', error)
      return false
    }
  }

  static async signInWithGoogle(): Promise<void> {
    // Use the production URL directly for OAuth redirect
    const redirectUrl = 'https://orphion-2.vercel.app/auth/callback'

    console.log('Google OAuth redirect URL:', redirectUrl)
    console.log('Current window location:', typeof window !== 'undefined' ? window.location.origin : 'N/A')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      },
    })

    if (error) {
      console.error('Google OAuth error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        details: error
      })
      throw new Error(`Google OAuth failed: ${error.message}`)
    }

    console.log('OAuth initiated successfully:', data?.url ? 'Redirect URL generated' : 'No redirect URL')
  }

  static async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  static async updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string }): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Profile table may not exist yet:', error)
      throw new Error('Profile table not available')
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('AuthService: Auth state change event:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('AuthService: User signed in, fetching user data...')
          const user = await this.getCurrentUser()
          callback(user)
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthService: User signed out')
          callback(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('AuthService: Token refreshed, fetching user data...')
          const user = await this.getCurrentUser()
          callback(user)
        } else {
          console.log('AuthService: Other auth event:', event)
          // For other events, don't call getCurrentUser to avoid unnecessary requests
          if (session?.user) {
            // Create a basic user object from session data
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
              avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            }
            callback(userData)
          } else {
            callback(null)
          }
        }
      } catch (error) {
        console.error('AuthService: Error in auth state change handler:', error)
        // Don't call callback with error to avoid breaking the auth flow
        // Instead, try to get basic user info from session
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          }
          callback(userData)
        } else {
          callback(null)
        }
      }
    })
  }
}
