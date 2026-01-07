// Normalize and hash answer
async function hashSecurityAnswer(answer) {
    // 1. Normalize
    const normalized = answer
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' '); // Remove extra spaces
    
    // 2. Hash with bcrypt (using Web Crypto API)
    const encoder = new TextEncoder()
    const data = encoder.encode(normalized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex
}

// Track failed attempts
async function trackFailedAttempt(username, ip = '') {
    // 1. Check existing attempts
    const { data: existing } = await supabase
        .from('security_attempts')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    
    if (existing && existing.locked_until > new Date()) {
        // Already locked
        return { locked: true, until: existing.locked_until }
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
            attemptsLeft: 3 - attemptCount,
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
}

// Reset attempts on success
async function resetSecurityAttempts(username) {
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
}

// Check if account is locked
async function isAccountLocked(username) {
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
}

// Get security question with attempt check
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
        
        // 2. Get security question
        const { data, error } = await supabase
            .from('profiles')
            .select('security_question, security_answer_hash')
            .eq('username', username)
            .single()
        
        if (error) throw error
        
        return { 
            success: true, 
            question: data.security_question,
            hasSecurity: !!data.security_question && !!data.security_answer_hash
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Verify security answer with hashing
export async function verifySecurityAnswer(username, answer, ip = '') {
    try {
        // 1. Check lock status
        const lockCheck = await isAccountLocked(username)
        if (lockCheck.locked) {
            throw new Error(`Account locked. Try again in ${lockCheck.timeLeft} minutes`)
        }
        
        // 2. Get stored hash
        const { data, error } = await supabase
            .from('profiles')
            .select('security_answer_hash')
            .eq('username', username)
            .single()
        
        if (error) throw error
        
        if (!data.security_answer_hash) {
            throw new Error('No security question set')
        }
        
        // 3. Hash the provided answer
        const answerHash = await hashSecurityAnswer(answer)
        
        // 4. Compare hashes
        if (answerHash !== data.security_answer_hash) {
            // Wrong answer - track attempt
            const attemptResult = await trackFailedAttempt(username, ip)
            
            if (attemptResult.locked) {
                throw new Error(`Too many attempts. Account locked for 30 minutes.`)
            } else {
                throw new Error(`Wrong answer. ${attemptResult.attemptsLeft} attempts left.`)
            }
        }
        
        // 5. Correct answer - reset attempts
        await resetSecurityAttempts(username)
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Update signUp function to hash security answer
export async function signUp(email, password, username, securityQuestion, securityAnswer) {
    try {
        let securityAnswerHash = null
        
        // Hash security answer if provided
        if (securityQuestion && securityAnswer) {
            securityAnswerHash = await hashSecurityAnswer(securityAnswer)
        }
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    email: email
                }
            }
        })
        
        if (error) throw error
        
        if (data.user) {
            // Insert into profiles with hashed answer
            await supabase.from('profiles').insert({
                id: data.user.id,
                username: username,
                security_question: securityQuestion || null,
                security_answer_hash: securityAnswerHash,
                created_at: new Date()
            })
            
            // ... rest of signup code
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}
