import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const supabaseUrl = 'https://modjpklljhkwesysezvc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZGpwa2xsamhrd2VzeXNlenZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODA1MTQsImV4cCI6MjA4MzM1NjUxNH0.KW4rzrHBFY73HlYMK2MtCELjeFpQzBWE9iheT6JGiO8'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to check if Supabase is initialized
export function isSupabaseInitialized() {
    return !!supabase
}

// Get user ID from session
export async function getUserId() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        return user?.id || null
    } catch (error) {
        console.error('Get user ID error:', error)
        return null
    }
}

// Get user profile data
export async function getUserProfile(userId = null) {
    try {
        const targetUserId = userId || await getUserId()
        if (!targetUserId) return null

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // Profile doesn't exist yet
                return null
            }
            throw error
        }

        return data
    } catch (error) {
        console.error('Get user profile error:', error)
        return null
    }
}

// Create or update user profile
export async function upsertUserProfile(profileData) {
    try {
        const userId = await getUserId()
        if (!userId) throw new Error('User not authenticated')

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                ...profileData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Upsert profile error:', error)
        return { success: false, error: error.message }
    }
}

// Get user settings
export async function getUserSettings() {
    try {
        const userId = await getUserId()
        if (!userId) return null

        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // Create default settings
                const defaultSettings = {
                    user_id: userId,
                    theme: 'light',
                    notifications_enabled: true,
                    meditation_goal_minutes: 10,
                    created_at: new Date().toISOString()
                }
                
                const { data: newSettings } = await supabase
                    .from('user_settings')
                    .insert(defaultSettings)
                    .select()
                    .single()
                
                return newSettings
            }
            throw error
        }

        return data
    } catch (error) {
        console.error('Get user settings error:', error)
        return null
    }
}

// Update user settings
export async function updateUserSettings(settings) {
    try {
        const userId = await getUserId()
        if (!userId) throw new Error('User not authenticated')

        const { data, error } = await supabase
            .from('user_settings')
            .update({
                ...settings,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Update settings error:', error)
        return { success: false, error: error.message }
    }
}

// Save message to database
export async function saveMessage(content, conversationId = 'default', sender = 'user') {
    try {
        const userId = await getUserId()
        if (!userId) throw new Error('User not authenticated')

        const message = {
            user_id: userId,
            conversation_id: conversationId,
            content: content,
            sender: sender,
            created_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('messages')
            .insert(message)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Save message error:', error)
        return { success: false, error: error.message }
    }
}

// Get user messages
export async function getUserMessages(limit = 50, conversationId = null) {
    try {
        const userId = await getUserId()
        if (!userId) return []

        let query = supabase
            .from('messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

        if (conversationId) {
            query = query.eq('conversation_id', conversationId)
        }

        if (limit) {
            query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Get messages error:', error)
        return []
    }
}

// Clear user messages
export async function clearUserMessages(conversationId = null) {
    try {
        const userId = await getUserId()
        if (!userId) throw new Error('User not authenticated')

        let query = supabase
            .from('messages')
            .delete()
            .eq('user_id', userId)

        if (conversationId) {
            query = query.eq('conversation_id', conversationId)
        }

        const { error } = await query

        if (error) throw error
        return { success: true }
    } catch (error) {
        console.error('Clear messages error:', error)
        return { success: false, error: error.message }
    }
}

// Get user achievements
export async function getUserAchievements() {
    try {
        const userId = await getUserId()
        if (!userId) return []

        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Get achievements error:', error)
        return []
    }
}

// Add achievement
export async function addAchievement(achievementType, title, description) {
    try {
        const userId = await getUserId()
        if (!userId) throw new Error('User not authenticated')

        const achievement = {
            user_id: userId,
            achievement_type: achievementType,
            title: title,
            description: description,
            created_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('achievements')
            .insert(achievement)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Add achievement error:', error)
        return { success: false, error: error.message }
    }
}

// Health check
export async function checkSupabaseHealth() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)

        if (error) throw error
        return { success: true, connected: true }
    } catch (error) {
        console.error('Supabase health check error:', error)
        return { success: false, connected: false, error: error.message }
    }
}