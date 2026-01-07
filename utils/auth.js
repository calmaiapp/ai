import { supabase } from './supabase.js'

// ========== HELPER FUNCTIONS ==========

// Hash security answer
async function hashSecurityAnswer(answer) {
    if (!answer) return null
    
    // Normalize: lowercase, trim, remove extra spaces
    const normalized = answer
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
    
    // Simple hash using SHA-256
    const encoder = new TextEncoder()
    const data = encoder.encode(normalized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex
}

// Check if account is locked
async function isAccountLocked(username) {
    try {
        // Check security_attempts table first
        const { data: attempt } = await supabase
            .from('security_attempts')
            .select('locked_until, attempt_count')
            .eq('username', username)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        
        if (attempt && attempt.locked_until) {
            const lockTime = new Date(attempt.locked_until)
            if (lockTime > new Date()) {
                return { 
                    locked: true, 
                    until: lockTime,
                    timeLeft: Math.ceil((lockTime - new Date()) / 60000) // minutes
                }
            }
        }
        
        // Check profiles table as backup
        const { data: profile } = await supabase
            .from('profiles')
            .select('locked_until, failed_attempts')
            .eq('username', username)
            .single()
        
        if (profile && profile.locked_until) {
            const lockTime = new Date(profile.locked_until)
            if (lockTime > new Date()) {
                return { 
                    locked: true, 
                    until: lockTime,
                    timeLeft: Math.ceil((lockTime - new Date()) / 60000)
                }
            }
        }
        
        return { locked: false }
    } catch (error) {
        return { locked: false }
    }
}

// Track failed attempts
async function trackFailedAttempt(username, ip = '') {
    try {
        // 1. Check existing attempts
        const { data: existing } = await supabase
            .from('security_attempts')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        
        if (existing && existing.locked_until && new Date(existing.locked_until) > new Date()) {
            // Already locked
            return { 
                locked: true, 
                until: new Date(existing.locked_until),
                attemptsLeft: 0
            }
        }
        
        // 2. Update or create attempt record
        if (existing) {
            const attemptCount = existing.attempt_count + 1
            const lockedUntil = attemptCount >= 3 
                ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
                : null
            
            await supabase
                .from('security_attempts')
                .update({
                    attempt_count: attemptCount,
                    last_attempt: new Date(),
                    locked_until: lockedUntil,
                    ip_address: ip
                })
                .eq('id', existing.id)
            
            return { 
                locked: attemptCount >= 3,
                attemptsLeft: Math.max(0, 3 - attemptCount),
                lockedUntil 
            }
        } else {
            // First attempt
            await supabase
                .from('security_attempts')
                .insert({
                    username: username,
                    attempt_count: 1,
                    last_attempt: new Date(),
                    ip_address: ip,
                    locked_until: null
                })
            
            return { locked: false, attemptsLeft: 2 }
        }
    } catch (error) {
        console.log('Track attempt error:', error)
        return { locked: false, attemptsLeft: 3 }
    }
}

// Reset attempts on success
async function resetSecurityAttempts(username) {
    try {
        await supabase
            .from('security_attempts')
            .delete()
            .eq('username', username)
        
        // Also reset in profiles table
        await supabase
            .from('profiles')
            .update({
                failed_attempts: 0,
                locked_until: null,
                last_failed_attempt: null
            })
            .eq('username', username)
    } catch (error) {
        console.log('Reset attempts error:', error)
    }
}

// ========== MAIN AUTH FUNCTIONS ==========

// Sign up function (without security question initially)
export async function signUp(email, password, username) {
    try {
        // 1. First sign up with Supabase Auth
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    email: email
                }
            }
        })
        
        if (signupError) throw signupError
        
        // 2. If signup successful, create profile
        if (signupData.user) {
            // Create profile in database
            const { error: profileError } = await supabase.from('profiles').insert({
                id: signupData.user.id,
                username: username,
                created_at: new Date()
            })
            
            if (profileError) {
                console.log('Profile creation warning:', profileError.message)
                // Continue anyway - profile can be created later
            }
            
            // Create user settings
            await supabase.from('user_settings').insert({
                user_id: signupData.user.id,
                theme: 'light',
                notifications_enabled: true,
                meditation_goal_minutes: 10
            }).catch(err => console.log('Settings warning:', err.message))
            
            // Create first achievement
            await supabase.from('achievements').insert({
                user_id: signupData.user.id,
                achievement_type: 'welcome',
                title: 'Welcome to Calm',
                description: 'Started your meditation journey'
            }).catch(err => console.log('Achievement warning:', err.message))
            
            // 3. Immediately log the user in
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            })
            
            if (loginError) {
                console.log('Auto-login warning:', loginError.message)
                // If auto-login fails, still return success
                return { 
                    success: true, 
                    data: signupData,
                    autoLoggedIn: false,
                    message: 'Account created! Please login manually.'
                }
            }
            
            // Update last active in profiles
            await supabase
                .from('profiles')
                .update({ last_active: new Date() })
                .eq('id', loginData.user.id)
                .catch(err => console.log('Last active update warning:', err.message))
            
            return { 
                success: true, 
                data: loginData,
                autoLoggedIn: true,
                message: 'Account created and logged in successfully!'
            }
        }
        
        return { 
            success: true, 
            data: signupData,
            autoLoggedIn: false,
            message: 'Account created! Please check your email.'
        }
    } catch (error) {
        return { 
            success: false, 
            error: error.message,
            autoLoggedIn: false 
        }
    }
}

// Update security question after account creation
export async function updateSecurityQuestion(username, question, answer) {
    try {
        // 1. Hash the security answer
        const answerHash = await hashSecurityAnswer(answer)
        
        // 2. Update the profile
        const { error } = await supabase
            .from('profiles')
            .update({
                security_question: question,
                security_answer_hash: answerHash,
                updated_at: new Date()
            })
            .eq('username', username)
        
        if (error) throw error
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Sign in with username or email
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
export async function getSecurityQuestion(username, ip = '') {
    try {
        // 1. Check if account is locked
        const lockCheck = await isAccountLocked(username)
        if (lockCheck.locked) {
            return { 
                success: false, 
                error: `Account locked. Try again in ${lockCheck.timeLeft} minutes`,
                locked: true 
            }
        }
        
        // 2. Get security question from profiles table
        const { data, error } = await supabase
            .from('profiles')
            .select('security_question, security_answer_hash')
            .eq('username', username)
            .single()
        
        if (error) {
            // User not found
            return { 
                success: false, 
                error: 'User not found',
                locked: false 
            }
        }
        
        return { 
            success: true, 
            question: data.security_question,
            hasSecurity: !!data.security_question && !!data.security_answer_hash
        }
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Failed to get security question',
            locked: false 
        }
    }
}

// Verify security answer and reset password
export async function resetPasswordWithSecurity(username, answer, newPassword) {
    try {
        // 1. Check lock status
        const lockCheck = await isAccountLocked(username)
        if (lockCheck.locked) {
            throw new Error(`Account locked. Try again in ${lockCheck.timeLeft} minutes`)
        }
        
        // 2. Get stored hash
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, security_answer_hash')
            .eq('username', username)
            .single()
        
        if (profileError) throw new Error('User not found')
        
        if (!profile.security_answer_hash) {
            throw new Error('No security question set for this account')
        }
        
        // 3. Hash the provided answer
        const answerHash = await hashSecurityAnswer(answer)
        
        // 4. Compare hashes
        if (answerHash !== profile.security_answer_hash) {
            // Wrong answer - track attempt
            const attemptResult = await trackFailedAttempt(username)
            
            if (attemptResult.locked) {
                throw new Error(`Too many attempts. Account locked for 30 minutes.`)
            } else {
                throw new Error(`Wrong answer. ${attemptResult.attemptsLeft} attempts left.`)
            }
        }
        
        // 5. Get user email to update password
        const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
        if (!userData || !userData.user) {
            throw new Error('User not found')
        }
        
        // 6. Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            profile.id,
            { password: newPassword }
        )
        
        if (updateError) throw updateError
        
        // 7. Reset attempts on success
        await resetSecurityAttempts(username)
        
        return { success: true }
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
