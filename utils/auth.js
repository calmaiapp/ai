import { supabase } from './supabase.js'

// Sign up function (with username and security question)
export async function signUp(email, password, username, securityQuestion, securityAnswer) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    email: email,
                    security_question: securityQuestion,
                    security_answer: securityAnswer
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
                security_question: securityQuestion,
                security_answer: securityAnswer,
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

// Sign in with username or email (FIXED - no @ requirement)
export async function signIn(identifier, password) {
    try {
        let email = identifier;
        
        // If it doesn't contain '@', try to find email from username
        if (!identifier.includes('@')) {
            // Query profiles table to get user ID from username
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', identifier)
                .single()
            
            if (profileError || !profile) {
                // Try to find email in auth.users metadata
                const { data: usersData } = await supabase.auth.admin.listUsers()
                const user = usersData.users.find(u => 
                    u.user_metadata?.username === identifier || 
                    u.email === identifier
                )
                
                if (user) {
                    email = user.email
                } else {
                    throw new Error('User not found')
                }
            } else {
                // Get user by ID to get email
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

// Get security question by username
export async function getSecurityQuestion(username) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('security_question, security_answer')
            .eq('username', username)
            .single()
        
        if (error) throw error
        
        return { 
            success: true, 
            question: data.security_question,
            hasSecurity: !!data.security_question
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Verify security answer and reset password
export async function resetPasswordWithSecurity(username, answer, newPassword) {
    try {
        // Get user profile to verify answer
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, security_answer')
            .eq('username', username)
            .single()
        
        if (profileError) throw profileError
        
        // Verify security answer
        if (!profile.security_answer || profile.security_answer.toLowerCase() !== answer.toLowerCase()) {
            throw new Error('Incorrect security answer')
        }
        
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
        if (!userData || !userData.user) {
            throw new Error('User not found')
        }
        
        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            profile.id,
            { password: newPassword }
        )
        
        if (updateError) throw updateError
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Google Sign In (Coming Soon)
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
