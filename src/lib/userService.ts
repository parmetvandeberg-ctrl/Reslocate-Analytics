import { supabase, supabaseAdmin } from './supabase'

interface CreateUserResponse {
  user?: any
  error?: Error
}

interface UserData {
  id: string
  email: string
  created_at: string
}

export interface AddedEmail {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}


// Generate a random secure password
export function generatePassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$'
  let password = ''
  const charsetLength = charset.length
  const cryptoArray = new Uint8Array(length)
  crypto.getRandomValues(cryptoArray)
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(cryptoArray[i] % charsetLength)
  }
  return password
}

// Create user with email confirmation bypass
export async function createUserWithEmail(
  email: string, 
  password: string, 
  profileData?: {
    first_name?: string
    last_name?: string
    phone_number?: string
    role?: 'Learner' | 'Parent' | 'Tutor' | 'Other'
  }
): Promise<CreateUserResponse> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    console.log('📝 Creating user with email:', email)

    // Use admin client to create user with service role key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { created_by_admin: true }
    })

    if (authError) {
      console.error('❌ Auth Error:', authError)
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        throw new Error('User with this email already exists')
      }
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Failed to create user - no user data returned')
    }

    console.log('✅ User created in auth system:', authData.user.id)

    // Create corresponding profile entry using the regular client
    const profileInsertData = {
      id: authData.user.id,
      email: email.toLowerCase(),
      role: profileData?.role || 'Learner',
      first_name: profileData?.first_name || '',
      last_name: profileData?.last_name || '',
      phone_number: profileData?.phone_number || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileInsertData, {
        onConflict: 'id'
      })

    if (profileError) {
      console.warn('⚠️ Profile creation warning:', profileError)
      // Don't throw here since user was created successfully in auth
    } else {
      console.log('✅ Profile created successfully')
    }

    // Insert into AddedEmail table to track user creation
    const addedEmailData = {
      email: email.toLowerCase(),
      first_name: profileData?.first_name || null,
      last_name: profileData?.last_name || null,
      created_by: authData.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: addedEmailError } = await supabase
      .from('AddedEmail')
      .insert(addedEmailData)

    if (addedEmailError) {
      console.warn('⚠️ AddedEmail tracking warning:', addedEmailError)
      // Don't throw here since user was created successfully
    } else {
      console.log('✅ AddedEmail record created successfully')
    }

    return { user: authData.user }
  } catch (error: any) {
    console.error('❌ User Creation Error:', error)
    return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
  }
}

// Fetch recently created users (last 10)
export async function getRecentUsers(): Promise<UserData[]> {
  try {
    console.log('📝 Fetching recent users...')
    
    // Check if user is authenticated (for debugging)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('⚠️ No session found - user not authenticated')
      console.log('Please ensure you are logged in to access user data')
    }

    console.log('📝 Fetching profiles from database via admin client...');

    // Use admin client to fetch users - this requires service role key permissions
    const { data: users, error }: { data: UserData[] | null, error: any } = await supabaseAdmin
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Database Error:', error)
      throw error
    }

    console.log(`✅ Retrieved ${users?.length || 0} users`)
    return users || []
  } catch (error: any) {
    console.error('❌ Error fetching recent users:', error)
    
    // Provide more specific error message
    const errorMessage = error.message || error.details || JSON.stringify(error)
    console.error('❌ Error details:', errorMessage)
    
    return []
  }
}

// Get all user profiles
export async function getUserProfile(): Promise<any[]> {
  try {
    console.log('📝 Fetching all user profiles...')
    
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching profiles:', error)
      throw error
    }

    console.log(`✅ Retrieved ${profiles?.length || 0} profiles`)
    return profiles || []
  } catch (error) {
    console.error('❌ Error in getUserProfile:', error)
    return []
  }
}

// Update user profile
export async function updateUserProfile(profileId: string, profileData: any): Promise<void> {
  try {
    console.log('📝 Updating profile:', profileId)
    
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)

    if (error) {
      console.error('❌ Error updating profile:', error)
      throw error
    }

    console.log('✅ Profile updated successfully')
  } catch (error) {
    console.error('❌ Error in updateUserProfile:', error)
    throw error
  }
}

// Add email to AddedEmail table
export async function addEmailToAddedEmail(email: string, firstName?: string, lastName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📝 Adding email to AddedEmail:', email)
    
    const { data: { user } } = await supabase.auth.getUser()
    const addedEmailData = {
      email: email.toLowerCase(),
      first_name: firstName || null,
      last_name: lastName || null,
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('AddedEmail')
      .insert(addedEmailData)

    if (error) {
      console.error('❌ Error adding to AddedEmail:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email added to AddedEmail successfully')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error in addEmailToAddedEmail:', error)
    return { success: false, error: error.message }
  }
}

// Get all added emails
export async function getAllAddedEmails(): Promise<AddedEmail[]> {
  try {
    console.log('📝 Fetching all added emails...')
    
    const { data: addedEmails, error } = await supabaseAdmin
      .from('AddedEmail')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching added emails:', error)
      throw error
    }

    console.log(`✅ Retrieved ${addedEmails?.length || 0} added emails`)
    return addedEmails || []
  } catch (error) {
    console.error('❌ Error in getAllAddedEmails:', error)
    return []
  }
}

// Copy to clipboard utility
export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return Promise.resolve(successful)
    } catch {
      document.body.removeChild(textArea)
      return Promise.resolve(false)
    }
  }
}