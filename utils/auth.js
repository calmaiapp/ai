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

// Get user profile
export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        
        if (error) throw error
        
        return { success: true, profile: data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Update user profile
export async function updateProfile(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
        
        if (error) throw error
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Get user settings
export async function getUserSettings(userId) {
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single()
        
        if (error) throw error
        
        return { success: true, settings: data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Update user settings
export async function updateUserSettings(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .update(updates)
            .eq('user_id', userId)
        
        if (error) throw error
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Save meditation session
export async function saveMeditationSession(userId, sessionData) {
    try {
        const { data, error } = await supabase
            .from('meditation_sessions')
            .insert({
                user_id: userId,
                duration_minutes: sessionData.duration,
                mood_before: sessionData.moodBefore,
                mood_after: sessionData.moodAfter,
                notes: sessionData.notes,
                session_type: sessionData.type || 'meditation'
            })
        
        if (error) throw error
        
        // Update total minutes in profile
        const profileResult = await getUserProfile(userId)
        if (profileResult.success) {
            const currentTotal = profileResult.profile.total_minutes_meditated || 0
            await updateProfile(userId, {
                total_minutes_meditated: currentTotal + sessionData.duration,
                last_active: new Date()
            })
        }
        
        // Check for achievements
        await checkAchievements(userId)
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Get meditation history
export async function getMeditationHistory(userId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('meditation_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)
        
        if (error) throw error
        
        return { success: true, sessions: data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Get user achievements
export async function getUserAchievements(userId) {
    try {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId)
            .order('earned_at', { ascending: false })
        
        if (error) throw error
        
        return { success: true, achievements: data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Check and award achievements
async function checkAchievements(userId) {
    try {
        // Get user data
        const [profileResult, sessionsResult] = await Promise.all([
            getUserProfile(userId),
            getMeditationHistory(userId, 1000)
        ])
        
        if (!profileResult.success || !sessionsResult.success) return
        
        const profile = profileResult.profile
        const sessions = sessionsResult.sessions
        const totalMinutes = profile.total_minutes_meditated || 0
        const sessionCount = sessions.length
        
        // Check for achievements
        const achievementsToAdd = []
        
        // First session achievement
        if (sessionCount === 1) {
            achievementsToAdd.push({
                user_id: userId,
                achievement_type: 'first_session',
                title: 'First Step',
                description: 'Completed your first meditation session'
            })
        }
        
        // 100 minutes achievement
        if (totalMinutes >= 100) {
            achievementsToAdd.push({
                user_id: userId,
                achievement_type: '100_minutes',
                title: 'Century',
                description: 'Meditated for 100 total minutes'
            })
        }
        
        // 7 day streak achievement
        // (You would implement streak logic here)
        
        // Add new achievements
        if (achievementsToAdd.length > 0) {
            // Check if achievements already exist
            const existingAch = await getUserAchievements(userId)
            if (existingAch.success) {
                const existingTypes = existingAch.achievements.map(a => a.achievement_type)
                const newAchievements = achievementsToAdd.filter(
                    a => !existingTypes.includes(a.achievement_type)
                )
                
                if (newAchievements.length > 0) {
                    await supabase
                        .from('achievements')
                        .insert(newAchievements)
                }
            }
        }
    } catch (error) {
        console.log('Achievement check error:', error.message)
    }
}

// Reset password
export async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/ai/auth/index.html?reset'
        })
        
        if (error) throw error
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Update password
export async function updatePassword(newPassword) {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })
        
        if (error) throw error
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Check if user exists
export async function checkUserExists(email) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', email.split('@')[0])
            .maybeSingle()
        
        if (error) throw error
        
        return { success: true, exists: !!data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}
