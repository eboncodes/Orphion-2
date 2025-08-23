import { supabase } from './supabase'

export async function checkDatabaseSetup(): Promise<{
  profilesTableExists: boolean
  error?: string
}> {
  try {
    // Try to query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.message.includes('relation "profiles" does not exist')) {
        return {
          profilesTableExists: false,
          error: 'Profiles table does not exist. Please run the SQL schema setup in your Supabase dashboard.'
        }
      }
      return {
        profilesTableExists: false,
        error: error.message
      }
    }

    return {
      profilesTableExists: true
    }
  } catch (error) {
    return {
      profilesTableExists: false,
      error: error instanceof Error ? error.message : 'Unknown error checking database setup'
    }
  }
}

export async function createProfilesTableIfNotExists(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // This is a simplified version - in practice, you'd want to run the full SQL setup
    // For now, we'll just check if it exists
    const { profilesTableExists, error } = await checkDatabaseSetup()
    
    if (profilesTableExists) {
      return { success: true }
    }

    return {
      success: false,
      error: error || 'Profiles table does not exist. Please run the SQL schema setup in your Supabase dashboard.'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
