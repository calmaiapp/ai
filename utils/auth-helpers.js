// Error handling and security utilities

export function handleSupabaseError(error) {
    console.error('Supabase Error:', error)
    
    if (!error.message) {
        return {
            success: false,
            error: 'An unknown error occurred.'
        }
    }
    
    if (error.message.includes('rate limit') || 
        error.message.includes('39 seconds') ||
        error.message.includes('too many requests')) {
        return {
            success: false,
            error: 'Too many requests. Please wait a minute before trying again.',
            rateLimited: true
        }
    }
    
    if (error.message.includes('already exists') ||
        error.message.includes('duplicate key')) {
        return {
            success: false,
            error: 'Username or email already exists.',
            duplicate: true
        }
    }
    
    if (error.message.includes('password') ||
        error.message.includes('Invalid login')) {
        return {
            success: false,
            error: 'Invalid email or password.',
            authError: true
        }
    }
    
    if (error.message.includes('network') ||
        error.message.includes('fetch')) {
        return {
            success: false,
            error: 'Network error. Please check your connection.',
            networkError: true
        }
    }
    
    return {
        success: false,
        error: error.message || 'Something went wrong. Please try again.'
    }
}

export async function hashSecurityAnswer(answer) {
    if (!answer) return null
    
    try {
        // Normalize answer
        const normalized = answer
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
        
        // Hash using SHA-256
        const encoder = new TextEncoder()
        const data = encoder.encode(normalized)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        
        return hashHex
    } catch (error) {
        console.error('Hash error:', error)
        return null
    }
}

// Simple validation helpers
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

export function validatePassword(password) {
    return password.length >= 6
}

export function validateUsername(username) {
    return username.length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(username)
}

// Password strength checker
export function checkPasswordStrength(password) {
    let strength = 0
    let feedback = []
    
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    if (password.length < 6) {
        feedback.push('Password too short (min 6 characters)')
    }
    if (password.length >= 6 && password.length < 8) {
        feedback.push('Consider using at least 8 characters')
    }
    if (!/[A-Z]/.test(password)) {
        feedback.push('Add uppercase letters')
    }
    if (!/[0-9]/.test(password)) {
        feedback.push('Add numbers')
    }
    
    return {
        strength,
        feedback,
        isStrong: strength >= 3
    }
}