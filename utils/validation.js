// Comprehensive validation utilities for the entire app

export const Validation = {
    // ========== USER INPUT VALIDATION ==========
    
    email(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Email is required' }
        }
        
        const trimmed = email.trim()
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        
        if (!re.test(trimmed)) {
            return { valid: false, error: 'Please enter a valid email address' }
        }
        
        if (trimmed.length > 254) {
            return { valid: false, error: 'Email is too long' }
        }
        
        return { valid: true, value: trimmed }
    },

    username(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, error: 'Username is required' }
        }
        
        const trimmed = username.trim()
        
        if (trimmed.length < 3) {
            return { valid: false, error: 'Username must be at least 3 characters' }
        }
        
        if (trimmed.length > 30) {
            return { valid: false, error: 'Username cannot exceed 30 characters' }
        }
        
        const validChars = /^[a-zA-Z0-9_.-]+$/
        if (!validChars.test(trimmed)) {
            return { valid: false, error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' }
        }
        
        // Check for reserved usernames
        const reserved = [
            'admin', 'administrator', 'moderator', 'support', 'help',
            'contact', 'info', 'calm', 'system', 'root', 'test'
        ]
        if (reserved.includes(trimmed.toLowerCase())) {
            return { valid: false, error: 'This username is reserved' }
        }
        
        return { valid: true, value: trimmed }
    },

    password(password, options = {}) {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: 'Password is required' }
        }
        
        const requirements = {
            minLength: 6,
            requireUppercase: false,
            requireLowercase: false,
            requireNumbers: false,
            requireSpecial: false,
            ...options
        }
        
        const errors = []
        const suggestions = []
        
        if (password.length < requirements.minLength) {
            errors.push(`Password must be at least ${requirements.minLength} characters`)
        }
        
        if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter')
            suggestions.push('Add an uppercase letter (A-Z)')
        }
        
        if (requirements.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter')
            suggestions.push('Add a lowercase letter (a-z)')
        }
        
        if (requirements.requireNumbers && !/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number')
            suggestions.push('Add a number (0-9)')
        }
        
        if (requirements.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
            errors.push('Password must contain at least one special character')
            suggestions.push('Add a special character (!@#$%^&*)')
        }
        
        if (errors.length > 0) {
            return {
                valid: false,
                error: errors.join('. '),
                suggestions
            }
        }
        
        return { valid: true, value: password }
    },

    // ========== FORM VALIDATION ==========
    
    form(formData, rules) {
        const errors = {}
        const values = {}
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field]
            
            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = rule.message || `${field} is required`
                continue
            }
            
            if (value && rule.type) {
                let validationResult
                
                switch (rule.type) {
                    case 'email':
                        validationResult = this.email(value)
                        break
                    case 'username':
                        validationResult = this.username(value)
                        break
                    case 'password':
                        validationResult = this.password(value, rule.options)
                        break
                    case 'text':
                        validationResult = this.text(value, rule.options)
                        break
                    case 'number':
                        validationResult = this.number(value, rule.options)
                        break
                    default:
                        validationResult = { valid: true, value }
                }
                
                if (!validationResult.valid) {
                    errors[field] = validationResult.error
                } else {
                    values[field] = validationResult.value
                }
            } else if (value) {
                values[field] = value.trim()
            }
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors,
            values
        }
    },

    // ========== DATA TYPE VALIDATION ==========
    
    text(text, options = {}) {
        if (text === undefined || text === null) {
            return { valid: false, error: 'Text is required' }
        }
        
        const str = String(text).trim()
        
        if (options.minLength && str.length < options.minLength) {
            return { valid: false, error: `Must be at least ${options.minLength} characters` }
        }
        
        if (options.maxLength && str.length > options.maxLength) {
            return { valid: false, error: `Cannot exceed ${options.maxLength} characters` }
        }
        
        if (options.pattern && !options.pattern.test(str)) {
            return { valid: false, error: options.message || 'Invalid format' }
        }
        
        return { valid: true, value: str }
    },

    number(number, options = {}) {
        if (number === undefined || number === null || number === '') {
            return { valid: false, error: 'Number is required' }
        }
        
        const num = Number(number)
        
        if (isNaN(num)) {
            return { valid: false, error: 'Must be a valid number' }
        }
        
        if (options.min !== undefined && num < options.min) {
            return { valid: false, error: `Must be at least ${options.min}` }
        }
        
        if (options.max !== undefined && num > options.max) {
            return { valid: false, error: `Cannot exceed ${options.max}` }
        }
        
        if (options.integer && !Number.isInteger(num)) {
            return { valid: false, error: 'Must be a whole number' }
        }
        
        return { valid: true, value: num }
    },

    // ========== MESSAGE VALIDATION ==========
    
    message(message) {
        if (!message || typeof message !== 'string') {
            return { valid: false, error: 'Message cannot be empty' }
        }
        
        const trimmed = message.trim()
        
        if (trimmed.length === 0) {
            return { valid: false, error: 'Message cannot be empty' }
        }
        
        if (trimmed.length > 1000) {
            return { valid: false, error: 'Message is too long (max 1000 characters)' }
        }
        
        // Check for spam patterns
        const spamPatterns = [
            /(http|https):\/\/[^\s]+/g, // URLs
            /[A-Z]{5,}/g, // Excessive caps
            /\!{3,}/g, // Multiple exclamation marks
        ]
        
        for (const pattern of spamPatterns) {
            if (pattern.test(trimmed)) {
                return { valid: false, error: 'Message contains suspicious content' }
            }
        }
        
        return { valid: true, value: trimmed }
    },

    // ========== SECURITY VALIDATION ==========
    
    securityAnswer(answer) {
        const validation = this.text(answer, {
            minLength: 2,
            maxLength: 100
        })
        
        if (!validation.valid) {
            return validation
        }
        
        // Check for common weak answers
        const weakAnswers = [
            'password', '123456', 'qwerty', 'admin',
            'test', 'answer', 'none', 'no', 'yes'
        ]
        
        if (weakAnswers.includes(validation.value.toLowerCase())) {
            return {
                valid: false,
                error: 'Please choose a more secure answer'
            }
        }
        
        return validation
    },

    // ========== UTILITY FUNCTIONS ==========
    
    sanitizeInput(input) {
        if (typeof input !== 'string') return input
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
    },

    validatePhone(phone) {
        if (!phone) return { valid: false, error: 'Phone number is required' }
        
        const cleaned = phone.replace(/\D/g, '')
        
        if (cleaned.length < 10) {
            return { valid: false, error: 'Phone number is too short' }
        }
        
        if (cleaned.length > 15) {
            return { valid: false, error: 'Phone number is too long' }
        }
        
        return { valid: true, value: cleaned }
    },

    // ========== BATCH VALIDATION ==========
    
    batchValidate(items, validator) {
        const results = {
            valid: true,
            items: [],
            errors: []
        }
        
        for (const item of items) {
            const validation = validator(item)
            results.items.push(validation)
            
            if (!validation.valid) {
                results.valid = false
                results.errors.push(validation.error)
            }
        }
        
        return results
    },

    // ========== REAL-TIME VALIDATION ==========
    
    createLiveValidator(validator) {
        let timeout = null
        
        return (value, callback) => {
            clearTimeout(timeout)
            
            timeout = setTimeout(() => {
                const result = validator(value)
                callback(result)
            }, 300) // Debounce 300ms
        }
    },

    // ========== VALIDATION RULE TEMPLATES ==========
    
    get rules() {
        return {
            signup: {
                username: {
                    required: true,
                    type: 'username',
                    message: 'Please enter a valid username'
                },
                email: {
                    required: true,
                    type: 'email',
                    message: 'Please enter a valid email'
                },
                password: {
                    required: true,
                    type: 'password',
                    options: { minLength: 6 }
                }
            },
            login: {
                identifier: {
                    required: true,
                    type: 'text',
                    message: 'Please enter your username or email'
                },
                password: {
                    required: true,
                    type: 'password',
                    message: 'Please enter your password'
                }
            },
            message: {
                content: {
                    required: true,
                    type: 'message',
                    message: 'Please enter a message'
                }
            }
        }
    }
}

// Export validation rule templates
export const validationRules = Validation.rules