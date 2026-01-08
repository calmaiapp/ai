import { supabase } from './supabase.js'
import { hashSecurityAnswer, handleSupabaseError } from './auth-helpers.js'

// ========== PASSWORD RESET & SECURITY ==========

export async function getSecurityQuestion(username) {
    try {
        // Check if account is locked
        const lockCheck = await checkAccountLock(username)
        if (lockCheck.locked) {
            return { 
                success: false, 
                error: `Account locked. Try again in ${lockCheck.timeLeft} minutes`,
                locked: true 
            }
        }

        // Get security question
        const { data, error } = await supabase
            .from('profiles')
            .select('security_question, security_answer_hash')
            .eq('username', username)
            .single()

        if (error) {
            return { 
                success: false, 
                error: 'User not found or no security question set.',
                locked: false 
            }
        }

        return { 
            success: true, 
            question: data.security_question,
            hasSecurity: !!data.security_question && !!data.security_answer_hash
        }
    } catch (error) {
        console.error('Get security question error:', error)
        return { 
            success: false, 
            error: 'Failed to get security question.',
            locked: false 
        }
    }
}

export async function resetPasswordWithSecurity(username, answer, newPassword) {
    try {
        // Check lock status
        const lockCheck = await checkAccountLock(username)
        if (lockCheck.locked) {
            return { 
                success: false, 
                error: `Account locked. Try again in ${lockCheck.timeLeft} minutes`,
                locked: true 
            }
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, security_answer_hash')
            .eq('username', username)
            .single()

        if (profileError) {
            return { 
                success: false, 
                error: 'User not found.',
                locked: false 
            }
        }

        if (!profile.security_answer_hash) {
            return { 
                success: false, 
                error: 'No security question set for this account.',
                locked: false 
            }
        }

        // Verify answer
        const answerHash = await hashSecurityAnswer(answer)
        if (!answerHash || answerHash !== profile.security_answer_hash) {
            // Track failed attempt
            const attemptResult = await trackFailedAttempt(username)
            
            if (attemptResult.locked) {
                return { 
                    success: false, 
                    error: 'Too many attempts. Account locked for 30 minutes.',
                    locked: true 
                }
            }
            
            return { 
                success: false, 
                error: `Wrong answer. ${attemptResult.attemptsLeft} attempts left.`,
                locked: false 
            }
        }

        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            profile.id,
            { password: newPassword }
        )

        if (updateError) {
            console.error('Password update error:', updateError)
            return handleSupabaseError(updateError)
        }

        // Reset attempts on success
        await resetSecurityAttempts(username)
        
        return { success: true }
    } catch (error) {
        console.error('Reset password error:', error)
        return handleSupabaseError(error)
    }
}

export async function updateSecurityQuestion(username, question, answer) {
    try {
        const answerHash = await hashSecurityAnswer(answer)
        
        if (!answerHash) {
            return { 
                success: false, 
                error: 'Failed to process security answer.' 
            }
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                security_question: question,
                security_answer_hash: answerHash,
                updated_at: new Date()
            })
            .eq('username', username)

        if (error) {
            console.error('Update security question error:', error)
            return handleSupabaseError(error)
        }

        return { success: true }
    } catch (error) {
        console.error('Update security question error:', error)
        return handleSupabaseError(error)
    }
}

// ========== ACCOUNT LOCK HELPERS ==========

async function checkAccountLock(username) {
    try {
        // Check security_attempts table
        const { data: attempt, error: attemptError } = await supabase
            .from('security_attempts')
            .select('locked_until, attempt_count')
            .eq('username', username)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        
        if (!attemptError && attempt && attempt.locked_until) {
            const lockTime = new Date(attempt.locked_until)
            if (lockTime > new Date()) {
                return { 
                    locked: true, 
                    until: lockTime,
                    timeLeft: Math.ceil((lockTime - new Date()) / 60000)
                }
            }
        }
        
        // Check profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('locked_until, failed_attempts')
            .eq('username', username)
            .single()
        
        if (!profileError && profile && profile.locked_until) {
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
        console.error('Lock check error:', error)
        return { locked: false }
    }
}

async function trackFailedAttempt(username, ip = '') {
    try {
        // Check existing attempts
        const { data: existing, error: fetchError } = await supabase
            .from('security_attempts')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        
        if (fetchError && fetchError.code !== 'PGRST116') {
            console.warn('Fetch attempt error:', fetchError)
        }
        
        if (existing && existing.locked_until && new Date(existing.locked_until) > new Date()) {
            return { 
                locked: true, 
                until: new Date(existing.locked_until),
                attemptsLeft: 0
            }
        }
        
        // Update or create attempt record
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
        console.error('Track attempt error:', error)
        return { locked: false, attemptsLeft: 3 }
    }
}

async function resetSecurityAttempts(username) {
    try {
        await supabase
            .from('security_attempts')
            .delete()
            .eq('username', username)
        
        await supabase
            .from('profiles')
            .update({
                failed_attempts: 0,
                locked_until: null,
                last_failed_attempt: null
            })
            .eq('username', username)
    } catch (error) {
        console.error('Reset attempts error:', error)
    }
}