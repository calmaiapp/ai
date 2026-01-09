import { supabase } from './supabase.js'

// ========== MAIN AUTH FUNCTIONS ==========

export async function signUp(email, password, username) {
    try {
        console.log('📝 Signup attempt:', { email, username })
        
        // Rate limit check
        if (await isRateLimited('signup', email)) {
            return {
                success: false,
                error: 'Too many attempts. Please wait 60 seconds.',
                rateLimited: true
            }
        }

        // Sign up with Supabase Auth (NO email confirmation)
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    email: email,
                    created_at: new Date().toISOString()
                },
                // Disable email confirmation
                emailRedirectTo: window.location.origin
            }
        })

        if (signupError) {
            console.error('❌ Signup error:', signupError)
            await trackRateLimit('signup', email)
            return {
                success: false,
                error: signupError.message
            }
        }

        console.log('✅ Auth signup successful, creating profile...')

        // Create user profile
        const profileResult = await createUserProfile(signupData.user, username)
        
        if (!profileResult.success) {
            console.warn('⚠️ Profile creation warning:', profileResult.error)
            // Continue anyway - user can log in
        }

        // Auto login after signup (since email confirmation is off)
        const loginResult = await autoLoginAfterSignup(email, password)
        
        if (loginResult.success) {
            await clearRateLimit('signup', email)
            return {
                success: true,
                data: loginResult.data,
                autoLoggedIn: true,
                message: 'Account created successfully!'
            }
        }

        return {
            success: true,
            autoLoggedIn: false,
            message: 'Account created! You can now login.'
        }
    } catch (error) {
        console.error('🔥 Signup error:', error)
        return {
            success: false,
            error: error.message || 'Signup failed'
        }
    }
}

export async function signIn(identifier, password) {
    try {
        console.log('🔑 Login attempt for:', identifier)
        
        // Rate limit check
        if (await isRateLimited('login', identifier)) {
            return {
                success: false,
                error: 'Too many attempts. Please wait 30 seconds.',
                rateLimited: true
            }
        }

        let email = identifier
        
        // Try username lookup if not email
        if (!identifier.includes('@')) {
            const userEmail = await getEmailFromUsername(identifier)
            if (userEmail) {
                email = userEmail
                console.log('📧 Found email for username:', email)
            }
        }

        console.log('🔐 Attempting login with:', email)
        
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (error) {
            console.error('❌ Login error:', error.message)
            await trackRateLimit('login', identifier)
            
            // User-friendly error messages
            if (error.message.includes('Invalid login credentials')) {
                return {
                    success: false,
                    error: 'Email/username or password is incorrect'
                }
            }
            
            if (error.message.includes('Email not confirmed')) {
                return {
                    success: false,
                    error: 'Please check your email to confirm your account'
                }
            }
            
            return {
                success: false,
                error: error.message || 'Login failed'
            }
        }

        console.log('✅ Login successful for:', data.user.id)
        
        // Update last active
        await updateLastActive(data.user.id)

        await clearRateLimit('login', identifier)
        return { 
            success: true, 
            data,
            user: data.user
        }
    } catch (error) {
        console.error('🔥 Login error:', error)
        return {
            success: false,
            error: error.message || 'Login failed'
        }
    }
}

export async function signOut() {
    try {
        // Clear all local data
        clearLocalAuthData()
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        return { success: true }
    } catch (error) {
        console.error('Signout error:', error)
        return { success: false, error: error.message }
    }
}

// ========== PASSWORD RESET FUNCTIONS ==========

export async function resetPasswordWithSecurity(username, securityAnswer, newPassword) {
    try {
        // Verify security answer first
        const verifyResult = await verifySecurityAnswer(username, securityAnswer)
        
        if (!verifyResult.success || !verifyResult.correct) {
            return {
                success: false,
                error: 'Security answer is incorrect'
            }
        }

        // Get user email from username
        const userEmail = await getEmailFromUsername(username)
        if (!userEmail) {
            return {
                success: false,
                error: 'User not found'
            }
        }

        // Reset password with Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
            redirectTo: `${window.location.origin}/ai/auth/reset-password.html`
        })

        if (error) {
            return { success: false, error: error.message }
        }

        return {
            success: true,
            message: 'Password reset email sent. Check your inbox.'
        }
    } catch (error) {
        console.error('Reset password error:', error)
        return {
            success: false,
            error: error.message || 'Failed to reset password'
        }
    }
}

export async function updatePassword(newPassword) {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error('Update password error:', error)
        return { success: false, error: error.message }
    }
}

// ========== SECURITY FUNCTIONS ==========

export async function getSecurityQuestion(username) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('security_question')
            .eq('username', username)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'User not found' }
            }
            throw error
        }

        return { 
            success: true, 
            question: data.security_question 
        }
    } catch (error) {
        console.error('Get security question error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateSecurityQuestion(username, question, answer) {
    try {
        // Get user ID from username
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single()

        if (profileError) {
            return { success: false, error: 'User not found' }
        }

        // Update security question and answer
        const { error } = await supabase
            .from('profiles')
            .update({
                security_question: question,
                security_answer_hash: btoa(answer), // Simple encoding
                updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error('Update security question error:', error)
        return { success: false, error: error.message }
    }
}

export async function verifySecurityAnswer(username, answer) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('security_answer_hash')
            .eq('username', username)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'User not found' }
            }
            throw error
        }

        if (!data.security_answer_hash) {
            return { 
                success: false, 
                error: 'No security question set for this user' 
            }
        }

        // Compare encoded answers
        const isCorrect = btoa(answer) === data.security_answer_hash
        return { 
            success: true, 
            correct: isCorrect 
        }
    } catch (error) {
        console.error('Verify security answer error:', error)
        return { success: false, error: error.message }
    }
}

// ========== SESSION & USER MANAGEMENT ==========

export async function getSession() {
    try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        
        // Store session data
        if (data.session) {
            storeSessionData(data.session)
        }
        
        return { success: true, session: data.session }
    } catch (error) {
        console.error('Get session error:', error)
        return { success: false, error: error.message }
    }
}

export async function getUser() {
    try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        
        if (data.user) {
            // Update user metadata
            await updateUserMetadata(data.user)
        }
        
        return { success: true, user: data.user }
    } catch (error) {
        console.error('Get user error:', error)
        return { success: false, error: error.message }
    }
}

export async function getCurrentUser() {
    try {
        const sessionResult = await getSession()
        if (!sessionResult.success || !sessionResult.session) {
            return { success: false, user: null }
        }

        const userResult = await getUser()
        return userResult
    } catch (error) {
        console.error('Get current user error:', error)
        return { success: false, user: null, error: error.message }
    }
}

// ========== HELPER FUNCTIONS ==========

async function createUserProfile(user, username) {
    try {
        console.log('👤 Creating profile for user:', user.id)
        
        const { error } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                username: username,
                email: user.email, // Store email for username lookup
                created_at: new Date().toISOString(),
                last_active: new Date().toISOString()
            })

        if (error) {
            console.error('❌ Profile creation error:', error)
            // If it's a duplicate error, that's okay - profile already exists
            if (!error.message.includes('duplicate')) {
                return { success: false, error: error.message }
            }
        }

        console.log('✅ Profile created/updated')

        // Create user settings
        await supabase
            .from('user_settings')
            .insert({
                user_id: user.id,
                theme: 'light',
                notifications_enabled: true,
                meditation_goal_minutes: 10,
                created_at: new Date().toISOString()
            })

        // Create welcome achievement
        await supabase
            .from('achievements')
            .insert({
                user_id: user.id,
                achievement_type: 'welcome',
                title: 'Welcome to Calm',
                description: 'Started your meditation journey',
                created_at: new Date().toISOString()
            })

        return { success: true }
    } catch (error) {
        console.warn('⚠️ User profile creation error:', error)
        return { success: false, error: error.message }
    }
}

async function autoLoginAfterSignup(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (error) {
            return { success: false, error: error.message }
        }

        await updateLastActive(data.user.id)
        return { success: true, data }
    } catch (error) {
        console.warn('Auto-login warning:', error)
        return { success: false, error: error.message }
    }
}

async function getEmailFromUsername(username) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', username)
            .single()

        if (error) {
            console.log('Username lookup failed:', error.message)
            return null
        }

        return profile.email
    } catch (error) {
        console.warn('Username lookup error:', error)
        return null
    }
}

async function updateLastActive(userId) {
    try {
        await supabase
            .from('profiles')
            .update({ 
                last_active: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
    } catch (error) {
        console.warn('Last active update error:', error)
    }
}

async function updateUserMetadata(user) {
    // Store user data in localStorage for quick access
    localStorage.setItem('user_metadata', JSON.stringify({
        username: user.user_metadata?.username,
        email: user.email,
        userId: user.id,
        lastUpdated: new Date().toISOString()
    }))
}

function storeSessionData(session) {
    localStorage.setItem('session_expiry', session.expires_at)
    localStorage.setItem('session_token', session.access_token)
}

function clearLocalAuthData() {
    localStorage.removeItem('session_expiry')
    localStorage.removeItem('session_token')
    localStorage.removeItem('user_metadata')
    localStorage.removeItem('rememberMe')
}

// Rate limiting functions
async function isRateLimited(type, identifier) {
    const key = `${type}_limit_${identifier}`
    const limitData = localStorage.getItem(key)
    
    if (!limitData) return false
    
    const { count, timestamp } = JSON.parse(limitData)
    const now = Date.now()
    const timeWindow = type === 'signup' ? 60000 : 30000
    
    if (now - timestamp < timeWindow && count >= 3) {
        return true
    }
    
    return false
}

async function trackRateLimit(type, identifier) {
    const key = `${type}_limit_${identifier}`
    const limitData = localStorage.getItem(key)
    const now = Date.now()
    const timeWindow = type === 'signup' ? 60000 : 30000
    
    if (limitData) {
        const { count, timestamp } = JSON.parse(limitData)
        
        if (now - timestamp < timeWindow) {
            localStorage.setItem(key, JSON.stringify({
                count: count + 1,
                timestamp: now
            }))
        } else {
            // Reset if outside time window
            localStorage.setItem(key, JSON.stringify({
                count: 1,
                timestamp: now
            }))
        }
    } else {
        localStorage.setItem(key, JSON.stringify({
            count: 1,
            timestamp: now
        }))
    }
}

async function clearRateLimit(type, identifier) {
    const key = `${type}_limit_${identifier}`
    localStorage.removeItem(key)
}