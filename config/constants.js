// Application constants and configuration

export const APP_CONFIG = {
    // App Information
    APP_NAME: 'Calm',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'Peaceful conversations • Mindful moments',
    APP_AUTHOR: 'Calm Team',
    
    // API Configuration
    API_BASE_URL: '', // Leave empty for relative paths
    API_TIMEOUT: 30000, // 30 seconds
    API_MAX_RETRIES: 3,
    
    // Supabase Configuration (to be set via environment variables)
    SUPABASE_URL: 'https://modjpklljhkwesysezvc.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZGpwa2xsamhrd2VzeXNlenZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODA1MTQsImV4cCI6MjA4MzM1NjUxNH0.KW4rzrHBFY73HlYMK2MtCELjeFpQzBWE9iheT6JGiO8',
    
    // Feature Flags
    FEATURES: {
        CHAT: true,
        MEDITATION: true,
        ACHIEVEMENTS: true,
        NOTIFICATIONS: true,
        OFFLINE_MODE: true,
        THEMES: true,
        EXPORT_DATA: true
    },
    
    // UI Configuration
    UI: {
        DEFAULT_THEME: 'light',
        THEMES: ['light', 'dark'],
        ANIMATION_DURATION: 300,
        MESSAGE_LIMIT: 1000,
        IDLE_TIMEOUT: 30000, // 30 seconds
        TYPING_INDICATOR_DELAY: 1000
    },
    
    // Chat Configuration
    CHAT: {
        MAX_MESSAGE_LENGTH: 1000,
        MESSAGE_HISTORY_LIMIT: 100,
        AUTO_RESPONSE_DELAY: { min: 500, max: 2000 },
        TYPING_INDICATOR_DURATION: 2000
    },
    
    // Meditation Configuration
    MEDITATION: {
        MIN_GOAL: 1, // minutes
        MAX_GOAL: 120, // minutes
        DEFAULT_GOAL: 10,
        SESSION_HISTORY_LIMIT: 100
    },
    
    // Security Configuration
    SECURITY: {
        PASSWORD_MIN_LENGTH: 6,
        USERNAME_MIN_LENGTH: 3,
        USERNAME_MAX_LENGTH: 30,
        RATE_LIMIT_WINDOW: 60000, // 1 minute
        MAX_LOGIN_ATTEMPTS: 3,
        ACCOUNT_LOCK_DURATION: 1800000 // 30 minutes
    },
    
    // Storage Configuration
    STORAGE: {
        PREFIX: 'calm_',
        CACHE_TTL: 300000, // 5 minutes
        SESSION_TIMEOUT: 604800000 // 7 days
    },
    
    // Notification Configuration
    NOTIFICATIONS: {
        ENABLED_BY_DEFAULT: true,
        REMINDER_INTERVAL: 3600000, // 1 hour
        ACHIEVEMENT_SOUND: true
    },
    
    // Analytics Events (for tracking user engagement)
    EVENTS: {
        USER_SIGNUP: 'user_signup',
        USER_LOGIN: 'user_login',
        USER_LOGOUT: 'user_logout',
        MESSAGE_SENT: 'message_sent',
        MEDITATION_STARTED: 'meditation_started',
        MEDITATION_COMPLETED: 'meditation_completed',
        ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
        SETTING_CHANGED: 'setting_changed'
    },
    
    // Achievement Definitions
    ACHIEVEMENTS: {
        WELCOME: {
            id: 'welcome',
            title: 'Welcome to Calm',
            description: 'Started your meditation journey',
            icon: '🎉'
        },
        FIRST_MESSAGE: {
            id: 'first_message',
            title: 'First Words',
            description: 'Sent your first message',
            icon: '💬'
        },
        DAILY_STREAK_3: {
            id: 'daily_streak_3',
            title: 'Consistent Practice',
            description: '3-day meditation streak',
            icon: '🔥'
        },
        DAILY_STREAK_7: {
            id: 'daily_streak_7',
            title: 'Weekly Warrior',
            description: '7-day meditation streak',
            icon: '🌟'
        },
        DAILY_STREAK_30: {
            id: 'daily_streak_30',
            title: 'Monthly Master',
            description: '30-day meditation streak',
            icon: '🏆'
        },
        CHATTERBOX: {
            id: 'chatterbox',
            title: 'Chatterbox',
            description: 'Sent 100 messages',
            icon: '🗣️'
        },
        LISTENER: {
            id: 'listener',
            title: 'Good Listener',
            description: 'Received 100 responses',
            icon: '👂'
        },
        EARLY_BIRD: {
            id: 'early_bird',
            title: 'Early Bird',
            description: 'Meditated before 8 AM',
            icon: '🌅'
        },
        NIGHT_OWL: {
            id: 'night_owl',
            title: 'Night Owl',
            description: 'Meditated after 10 PM',
            icon: '🌙'
        },
        MARATHON: {
            id: 'marathon',
            title: 'Marathon',
            description: 'Completed a 60-minute session',
            icon: '⏳'
        }
    },
    
    // Error Messages
    ERRORS: {
        NETWORK: 'Network error. Please check your connection.',
        UNAUTHORIZED: 'Session expired. Please login again.',
        FORBIDDEN: 'You do not have permission to perform this action.',
        NOT_FOUND: 'The requested resource was not found.',
        RATE_LIMIT: 'Too many requests. Please wait a minute.',
        VALIDATION: 'Please check your input and try again.',
        SERVER: 'Server error. Please try again later.',
        UNKNOWN: 'An unknown error occurred.'
    },
    
    // Success Messages
    SUCCESS: {
        SIGNUP: 'Account created successfully!',
        LOGIN: 'Login successful!',
        LOGOUT: 'Logged out successfully',
        MESSAGE_SENT: 'Message sent',
        SETTING_UPDATED: 'Setting updated',
        GOAL_UPDATED: 'Goal updated',
        DATA_EXPORTED: 'Data exported successfully',
        ACHIEVEMENT_UNLOCKED: 'Achievement unlocked!'
    },
    
    // Localization (future support for multiple languages)
    LOCALIZATION: {
        DEFAULT_LANGUAGE: 'en',
        SUPPORTED_LANGUAGES: ['en'],
        TRANSLATIONS: {
            en: {
                welcome: 'Welcome to Calm',
                tagline: 'Peaceful conversations • Mindful moments',
                sign_in: 'Sign In',
                sign_up: 'Sign Up',
                logout: 'Logout',
                send: 'Send',
                typing: 'Typing...',
                online: 'Online',
                offline: 'Offline',
                settings: 'Settings',
                profile: 'Profile',
                help: 'Help',
                about: 'About'
            }
        }
    },
    
    // Routes (for client-side routing if implemented)
    ROUTES: {
        HOME: '/',
        LOGIN: '/login',
        SIGNUP: '/auth',
        CHAT: '/home',
        PROFILE: '/profile',
        SETTINGS: '/settings',
        MEDITATION: '/meditation'
    },
    
    // SEO Metadata
    SEO: {
        TITLE: 'Calm • Peaceful Conversations',
        DESCRIPTION: 'Find peace through guided meditations, peaceful conversations, and mindful moments.',
        KEYWORDS: 'meditation, mindfulness, calm, peace, chat, mental health, wellness',
        OG_IMAGE: '/og-image.png',
        TWITTER_CARD: 'summary_large_image'
    }
}

// Environment detection
export const ENV = {
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    IS_PRODUCTION: !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
    IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    IS_TOUCH: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    IS_OFFLINE: !navigator.onLine
}

// Export individual constants for easier access
export const {
    APP_NAME,
    APP_VERSION,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    FEATURES,
    UI,
    CHAT,
    MEDITATION,
    SECURITY,
    STORAGE,
    NOTIFICATIONS,
    EVENTS,
    ACHIEVEMENTS,
    ERRORS,
    SUCCESS,
    LOCALIZATION,
    ROUTES,
    SEO
} = APP_CONFIG

export const {
    IS_DEVELOPMENT,
    IS_PRODUCTION,
    IS_MOBILE,
    IS_TOUCH,
    IS_OFFLINE
} = ENV

// Utility function to get translated text
export function getText(key, language = 'en') {
    const translations = LOCALIZATION.TRANSLATIONS[language] || LOCALIZATION.TRANSLATIONS.en
    return translations[key] || key
}

// Utility function to get achievement by ID
export function getAchievement(id) {
    return ACHIEVEMENTS[id] || {
        id,
        title: id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: 'Achievement unlocked!',
        icon: '🏆'
    }
}

// Utility function to get error message by type
export function getErrorMessage(type) {
    return ERRORS[type] || ERRORS.UNKNOWN
}

// Utility function to get success message by type
export function getSuccessMessage(type) {
    return SUCCESS[type] || 'Success!'
}

// Feature flag check
export function isFeatureEnabled(feature) {
    return FEATURES[feature] !== false
}

// Environment-based configuration
export function getConfig() {
    const baseConfig = { ...APP_CONFIG }
    
    // Override for development
    if (IS_DEVELOPMENT) {
        baseConfig.API_BASE_URL = 'http://localhost:3000/api'
        baseConfig.UI.ANIMATION_DURATION = 0 // Disable animations for faster testing
    }
    
    // Override for production
    if (IS_PRODUCTION) {
        baseConfig.API_BASE_URL = 'https://api.calmapp.com'
    }
    
    // Override for mobile
    if (IS_MOBILE) {
        baseConfig.UI.IDLE_TIMEOUT = 45000 // 45 seconds for mobile
    }
    
    return baseConfig
}

// Default export
export default getConfig()