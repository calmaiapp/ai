import { supabase } from './supabase.js'

// Sign up function
export async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    email: email
                }
            }
        })
        
        if (error) throw error
        
        // Create entries in all tables
        if (data.user) {
            const username = email.split('@')[0] + Math.floor(Math.random() * 1000)
            
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

// Sign in function
export async function signIn(email, password) {
    try {
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
