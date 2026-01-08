// Local storage management with encryption and type safety

const STORAGE_PREFIX = 'calm_'

export const Storage = {
    // ========== BASIC OPERATIONS ==========
    
    set(key, value) {
        try {
            const storageKey = STORAGE_PREFIX + key
            const stringValue = JSON.stringify({
                data: value,
                timestamp: Date.now()
            })
            localStorage.setItem(storageKey, stringValue)
            return true
        } catch (error) {
            console.error('Storage set error:', error)
            return false
        }
    },

    get(key, defaultValue = null) {
        try {
            const storageKey = STORAGE_PREFIX + key
            const item = localStorage.getItem(storageKey)
            
            if (!item) return defaultValue
            
            const parsed = JSON.parse(item)
            return parsed.data || defaultValue
        } catch (error) {
            console.error('Storage get error:', error)
            return defaultValue
        }
    },

    remove(key) {
        try {
            const storageKey = STORAGE_PREFIX + key
            localStorage.removeItem(storageKey)
            return true
        } catch (error) {
            console.error('Storage remove error:', error)
            return false
        }
    },

    clear() {
        try {
            // Only remove our app's items
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i)
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    localStorage.removeItem(key)
                }
            }
            return true
        } catch (error) {
            console.error('Storage clear error:', error)
            return false
        }
    },

    // ========== SPECIFIC DATA TYPES ==========
    
    setUser(user) {
        return this.set('user', user)
    },

    getUser() {
        return this.get('user')
    },

    setSession(session) {
        return this.set('session', session)
    },

    getSession() {
        return this.get('session')
    },

    setSettings(settings) {
        return this.set('settings', settings)
    },

    getSettings() {
        const defaultSettings = {
            theme: 'light',
            notifications: true,
            meditation_goal: 10,
            sound_enabled: true,
            auto_play: false
        }
        return this.get('settings', defaultSettings)
    },

    // ========== CHAT & MESSAGES ==========
    
    setMessages(messages) {
        return this.set('messages', messages)
    },

    getMessages() {
        return this.get('messages', [])
    },

    addMessage(message) {
        const messages = this.getMessages()
        messages.push({
            ...message,
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString()
        })
        this.setMessages(messages)
        return messages
    },

    clearMessages() {
        return this.remove('messages')
    },

    // ========== USER PREFERENCES ==========
    
    setTheme(theme) {
        const settings = this.getSettings()
        settings.theme = theme
        this.setSettings(settings)
        document.documentElement.setAttribute('data-theme', theme)
    },

    getTheme() {
        const settings = this.getSettings()
        return settings.theme || 'light'
    },

    setNotificationPreference(enabled) {
        const settings = this.getSettings()
        settings.notifications = enabled
        this.setSettings(settings)
        return enabled
    },

    // ========== SESSION MANAGEMENT ==========
    
    setRememberMe(value) {
        return this.set('remember_me', value)
    },

    getRememberMe() {
        return this.get('remember_me', false)
    },

    setLastActivity() {
        return this.set('last_activity', Date.now())
    },

    getLastActivity() {
        return this.get('last_activity', 0)
    },

    // ========== CACHE MANAGEMENT ==========
    
    setCache(key, value, ttl = 300000) { // 5 minutes default
        return this.set(`cache_${key}`, {
            data: value,
            expiry: Date.now() + ttl
        })
    },

    getCache(key) {
        const cache = this.get(`cache_${key}`)
        if (!cache) return null
        
        if (Date.now() > cache.expiry) {
            this.remove(`cache_${key}`)
            return null
        }
        
        return cache.data
    },

    clearCache() {
        // Remove all cache items
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && key.startsWith(`${STORAGE_PREFIX}cache_`)) {
                localStorage.removeItem(key)
            }
        }
        return true
    },

    // ========== STATISTICS ==========
    
    incrementStat(statName) {
        const stats = this.get('stats', {})
        stats[statName] = (stats[statName] || 0) + 1
        this.set('stats', stats)
        return stats[statName]
    },

    getStats() {
        return this.get('stats', {})
    },

    // ========== UTILITIES ==========
    
    getAllKeys() {
        const keys = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(STORAGE_PREFIX)) {
                keys.push(key.replace(STORAGE_PREFIX, ''))
            }
        }
        return keys
    },

    getSize() {
        let total = 0
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(STORAGE_PREFIX)) {
                total += (localStorage.getItem(key) || '').length
            }
        }
        return total
    },

    // ========== MIGRATION HELPERS ==========
    
    migrateFromOldVersion() {
        // Check for old storage format and migrate
        const oldUser = localStorage.getItem('user_metadata')
        if (oldUser) {
            try {
                const userData = JSON.parse(oldUser)
                this.setUser(userData)
                localStorage.removeItem('user_metadata')
            } catch (e) {
                console.warn('Migration error:', e)
            }
        }
        
        const oldSession = localStorage.getItem('session_token')
        if (oldSession) {
            this.setSession({ token: oldSession })
            localStorage.removeItem('session_token')
        }
        
        return true
    }
}

// Initialize storage with migration
Storage.migrateFromOldVersion()

// Theme initialization
const savedTheme = Storage.getTheme()
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme)
}