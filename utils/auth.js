import { supabase } from './supabase.js'

// Sign up function (with username)
export async function signUp(email, password, fullName, username) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    username: username,
                    email: email
                }
            }
        })
        
        if (error) throw error
        
        // Create entries in all tables
        if (data.user) {
            // 1. Insert into profiles
            await supabase.from('profiles').insert({
                id: data.user.id,
                username: username,
                full_name: fullName,
                created_at: new Date()
            })
            
            // 2. Insert into user_settings
            await supabase.from('user_settings').insert({
                user_id: data.user.id,
                theme: 'light',
                notifications_enabled: true,
                meditation_goal_minutes: 10
            })
            
            // 3. Create first achievement
            await supabase.from('achievements').insert({
                user_id: data.user.id,
                achievement_type: 'welcome',
                title: 'Welcome to Calm',
                description: 'Started your meditation journey'
            })
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Sign in with username or email
export async function signIn(identifier, password) {
    try {
        // First, check if identifier is username or email
        let email = identifier;
        
        // If it contains '@', it's email, otherwise check if it's username
        if (!identifier.includes('@')) {
            // Query profiles table to get email from username
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', identifier)
                .single()
            
            if (profileError) {
                // If username not found, try as email anyway
                console.log('Username not found, trying as email')
            } else if (profile) {
                // Get user email from auth.users
                const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
                if (userData && userData.user) {
                    email = userData.user.email
                }
            }
        }
        
        // Sign in with email
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (error) throw error
        
        // Update last active in profiles
        await supabase
            .from('profiles')
            .update({ last_active: new Date() })
            .eq('id', data.user.id)
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Google Sign In
export async function signInWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/ai/home/index.html'
            }
        })
        
        if (error) throw error
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Handle OAuth callback
export async function handleOAuthCallback() {
    try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (data.session) {
            // Check if profile exists, create if not
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.session.user.id)
                .single()
            
            if (profileError || !profile) {
                // Create profile for OAuth user
                const username = data.session.user.email.split('@')[0] + Math.floor(Math.random() * 1000)
                
                await supabase.from('profiles').insert({
                    id: data.session.user.id,
                    username: username,
                    full_name: data.session.user.user_metadata.full_name || data.session.user.email.split('@')[0],
                    avatar_url: data.session.user.user_metadata.avatar_url,
                    created_at: new Date()
                })
                
                // Create default settings
                await supabase.from('user_settings').insert({
                    user_id: data.session.user.id,
                    theme: 'light',
                    notifications_enabled: true,
                    meditation_goal_minutes: 10
                })
            }
        }
        
        return { success: true, session: data.session }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Sign out function
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Get current session
export async function getSession() {
    try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        
        return { success: true, session: data.session }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Get current user
export async function getUser() {
    try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        
        return { success: true, user: data.user }
    } catch (error) {
        return { success: false, error: error.message }
    }
}
