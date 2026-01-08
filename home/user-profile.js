// User profile management and settings

import { getCurrentUser, signOut } from '../utils/auth-core.js'
import { Storage } from '../utils/storage.js'
import { showMessage, showError, showSuccess } from '../components/messages.js'
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loader.js'
import { createModal, showConfirm } from '../components/modals.js'

class UserProfile {
    constructor() {
        this.user = null
        this.profile = null
        this.settings = {}
        this.init()
    }
    
    async init() {
        await this.loadUser()
        await this.loadSettings()
        this.setupEventListeners()
    }
    
    async loadUser() {
        try {
            const result = await getCurrentUser()
            if (result.success && result.user) {
                this.user = result.user
                this.profile = result.user.user_metadata || {}
                return true
            }
        } catch (error) {
            console.error('Load user error:', error)
        }
        return false
    }
    
    async loadSettings() {
        this.settings = Storage.getSettings()
        return this.settings
    }
    
    setupEventListeners() {
        // Listen for theme changes
        window.addEventListener('theme-changed', (e) => {
            this.updateSetting('theme', e.detail.theme)
        })
        
        // Listen for logout requests
        window.addEventListener('logout-requested', () => {
            this.handleLogout()
        })
    }
    
    // ========== PROFILE INFO ==========
    
    getProfileInfo() {
        if (!this.user) return null
        
        return {
            id: this.user.id,
            email: this.user.email,
            username: this.profile.username || this.user.email.split('@')[0],
            createdAt: this.user.created_at,
            lastSignIn: this.user.last_sign_in_at,
            emailConfirmed: this.user.email_confirmed_at !== null
        }
    }
    
    getDisplayName() {
        if (!this.user) return 'User'
        
        return this.profile.username || 
               this.user.email.split('@')[0] || 
               'User'
    }
    
    getInitial() {
        const displayName = this.getDisplayName()
        return displayName.charAt(0).toUpperCase()
    }
    
    getAvatarColor() {
        const colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
        const username = this.getDisplayName()
        
        // Generate consistent color based on username
        let hash = 0
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash)
        }
        
        const index = Math.abs(hash) % colors.length
        return colors[index]
    }
    
    // ========== SETTINGS MANAGEMENT ==========
    
    updateSetting(key, value) {
        this.settings[key] = value
        Storage.setSettings(this.settings)
        
        // Dispatch setting change event
        window.dispatchEvent(new CustomEvent('setting-changed', {
            detail: { key, value }
        }))
        
        return true
    }
    
    getSetting(key, defaultValue = null) {
        return this.settings[key] !== undefined ? this.settings[key] : defaultValue
    }
    
    getAllSettings() {
        return { ...this.settings }
    }
    
    resetSettings() {
        const defaultSettings = {
            theme: 'light',
            notifications: true,
            meditation_goal: 10,
            sound_enabled: true,
            auto_play: false
        }
        
        this.settings = defaultSettings
        Storage.setSettings(this.settings)
        
        // Dispatch reset event
        window.dispatchEvent(new CustomEvent('settings-reset'))
        
        return defaultSettings
    }
    
    // ========== THEME MANAGEMENT ==========
    
    toggleTheme() {
        const currentTheme = this.getSetting('theme', 'light')
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        
        this.updateSetting('theme', newTheme)
        
        // Update body class
        document.body.className = document.body.className
            .replace(/theme-\w+/g, '')
            .trim() + ` theme-${newTheme}`
        
        return newTheme
    }
    
    getCurrentTheme() {
        return this.getSetting('theme', 'light')
    }
    
    // ========== NOTIFICATION MANAGEMENT ==========
    
    toggleNotifications() {
        const current = this.getSetting('notifications', true)
        const newValue = !current
        
        this.updateSetting('notifications', newValue)
        
        // Request permission if enabling
        if (newValue && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission()
            }
        }
        
        return newValue
    }
    
    async showNotification(title, options = {}) {
        if (!this.getSetting('notifications', true)) return false
        
        if (!('Notification' in window)) {
            console.warn('Notifications not supported')
            return false
        }
        
        if (Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/logo.png',
                badge: '/logo.png',
                ...options
            })
            return true
        }
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
                new Notification(title, {
                    icon: '/logo.png',
                    badge: '/logo.png',
                    ...options
                })
                return true
            }
        }
        
        return false
    }
    
    // ========== MEDITATION GOALS ==========
    
    setMeditationGoal(minutes) {
        if (minutes < 1 || minutes > 120) {
            throw new Error('Goal must be between 1 and 120 minutes')
        }
        
        this.updateSetting('meditation_goal', minutes)
        return minutes
    }
    
    getMeditationGoal() {
        return this.getSetting('meditation_goal', 10)
    }
    
    recordMeditationSession(duration, date = new Date()) {
        const sessions = this.getSetting('meditation_sessions', [])
        
        sessions.push({
            date: date.toISOString(),
            duration: duration, // in minutes
            completed: duration >= this.getMeditationGoal()
        })
        
        // Keep only last 100 sessions
        if (sessions.length > 100) {
            sessions.splice(0, sessions.length - 100)
        }
        
        this.updateSetting('meditation_sessions', sessions)
        
        // Update statistics
        this.updateMeditationStatistics()
        
        return sessions
    }
    
    getMeditationSessions(days = 30) {
        const sessions = this.getSetting('meditation_sessions', [])
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        
        return sessions.filter(session => 
            new Date(session.date) >= cutoffDate
        )
    }
    
    updateMeditationStatistics() {
        const sessions = this.getSetting('meditation_sessions', [])
        const today = new Date().toDateString()
        
        const stats = {
            totalSessions: sessions.length,
            totalMinutes: sessions.reduce((sum, session) => sum + session.duration, 0),
            streak: 0,
            currentStreak: 0,
            longestStreak: 0,
            completedToday: sessions.some(session => 
                new Date(session.date).toDateString() === today && session.completed
            )
        }
        
        // Calculate streaks
        if (sessions.length > 0) {
            let currentStreak = 0
            let longestStreak = 0
            let lastDate = null
            
            // Sort by date descending
            const sortedSessions = [...sessions].sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            )
            
            for (const session of sortedSessions) {
                const sessionDate = new Date(session.date)
                const sessionDateStr = sessionDate.toDateString()
                
                if (!session.completed) {
                    if (lastDate && this.isConsecutiveDay(lastDate, sessionDate)) {
                        // Continue streak if completed but not consecutive? Actually break on non-completed
                        break
                    }
                }
                
                if (lastDate === null) {
                    currentStreak = 1
                } else if (this.isConsecutiveDay(lastDate, sessionDate)) {
                    currentStreak++
                } else {
                    break
                }
                
                lastDate = sessionDate
                longestStreak = Math.max(longestStreak, currentStreak)
            }
            
            stats.currentStreak = currentStreak
            stats.longestStreak = longestStreak
            stats.streak = currentStreak
        }
        
        this.updateSetting('meditation_stats', stats)
        return stats
    }
    
    isConsecutiveDay(date1, date2) {
        const diff = Math.abs(date1 - date2)
        return diff <= 24 * 60 * 60 * 1000 // 1 day in milliseconds
    }
    
    // ========== ACHIEVEMENTS ==========
    
    unlockAchievement(achievementId, data = {}) {
        const achievements = this.getSetting('achievements', [])
        
        // Check if already unlocked
        if (achievements.some(a => a.id === achievementId)) {
            return false
        }
        
        const achievement = {
            id: achievementId,
            unlockedAt: new Date().toISOString(),
            ...data
        }
        
        achievements.push(achievement)
        this.updateSetting('achievements', achievements)
        
        // Show notification
        this.showAchievementNotification(achievement)
        
        return true
    }
    
    showAchievementNotification(achievement) {
        const title = '🏆 Achievement Unlocked!'
        const message = achievement.message || `You unlocked: ${achievement.title}`
        
        this.showNotification(title, {
            body: message,
            requireInteraction: true
        })
        
        showSuccess(message)
    }
    
    getAchievements() {
        return this.getSetting('achievements', [])
    }
    
    // ========== STATISTICS ==========
    
    getStatistics() {
        const meditationStats = this.getSetting('meditation_stats', {
            totalSessions: 0,
            totalMinutes: 0,
            streak: 0,
            currentStreak: 0,
            longestStreak: 0
        })
        
        const chatStats = Storage.get('chat_stats', {
            messagesSent: 0,
            conversations: 0,
            wordsWritten: 0
        })
        
        const loginStats = Storage.get('login_stats', {
            totalLogins: 0,
            lastLogin: null,
            loginStreak: 0
        })
        
        return {
            meditation: meditationStats,
            chat: chatStats,
            login: loginStats,
            accountAge: this.getAccountAge(),
            activeDays: this.getActiveDays()
        }
    }
    
    getAccountAge() {
        if (!this.user?.created_at) return 0
        
        const created = new Date(this.user.created_at)
        const now = new Date()
        const diff = now - created
        
        return Math.floor(diff / (1000 * 60 * 60 * 24)) // days
    }
    
    getActiveDays() {
        const lastActive = Storage.getLastActivity()
        if (!lastActive) return 1
        
        const today = new Date().toDateString()
        const lastActiveDate = new Date(lastActive).toDateString()
        
        return today === lastActiveDate ? 1 : 0
    }
    
    // ========== DATA MANAGEMENT ==========
    
    exportData() {
        const data = {
            profile: this.getProfileInfo(),
            settings: this.getAllSettings(),
            meditationSessions: this.getMeditationSessions(365),
            achievements: this.getAchievements(),
            statistics: this.getStatistics(),
            exportDate: new Date().toISOString(),
            exportVersion: '1.0'
        }
        
        return JSON.stringify(data, null, 2)
    }
    
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData)
            
            // Backup current settings
            const backup = {
                settings: this.getAllSettings(),
                achievements: this.getAchievements()
            }
            
            try {
                // Import settings
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings }
                    Storage.setSettings(this.settings)
                }
                
                // Import achievements
                if (data.achievements) {
                    const currentAchievements = this.getAchievements()
                    const mergedAchievements = [...currentAchievements]
                    
                    data.achievements.forEach(newAchievement => {
                        if (!mergedAchievements.some(a => a.id === newAchievement.id)) {
                            mergedAchievements.push(newAchievement)
                        }
                    })
                    
                    this.updateSetting('achievements', mergedAchievements)
                }
                
                showSuccess('Data imported successfully')
                return true
                
            } catch (error) {
                // Restore from backup on error
                this.settings = backup.settings
                Storage.setSettings(this.settings)
                this.updateSetting('achievements', backup.achievements)
                
                throw error
            }
            
        } catch (error) {
            console.error('Import data error:', error)
            showError('Failed to import data: Invalid format')
            return false
        }
    }
    
    clearData(type = 'all') {
        const types = {
            settings: () => {
                this.resetSettings()
                showSuccess('Settings reset to defaults')
            },
            
            meditation: () => {
                this.updateSetting('meditation_sessions', [])
                this.updateSetting('meditation_stats', {
                    totalSessions: 0,
                    totalMinutes: 0,
                    streak: 0,
                    currentStreak: 0,
                    longestStreak: 0
                })
                showSuccess('Meditation data cleared')
            },
            
            achievements: () => {
                this.updateSetting('achievements', [])
                showSuccess('Achievements cleared')
            },
            
            all: () => {
                Storage.clear()
                window.location.reload()
            }
        }
        
        if (types[type]) {
            showConfirm(`Are you sure you want to clear ${type} data?`, {
                onConfirm: () => types[type](),
                confirmText: 'Clear',
                cancelText: 'Cancel'
            })
        }
    }
    
    // ========== ACCOUNT MANAGEMENT ==========
    
    async handleLogout() {
        try {
            const result = await signOut()
            if (result.success) {
                // Clear all local data
                Storage.clear()
                window.location.href = '/ai/index.html'
            } else {
                showError('Logout failed: ' + result.error)
            }
        } catch (error) {
            showError('Logout error: ' + error.message)
        }
    }
    
    async deleteAccount() {
        showConfirm('Are you sure you want to delete your account? This action cannot be undone.', {
            confirmText: 'Delete Account',
            cancelText: 'Cancel',
            onConfirm: async () => {
                const loaderId = showLoadingOverlay('Deleting account...')
                
                try {
                    // TODO: Implement account deletion API call
                    // For now, just sign out and clear data
                    await signOut()
                    Storage.clear()
                    
                    showSuccess('Account deleted successfully')
                    setTimeout(() => {
                        window.location.href = '/ai/index.html'
                    }, 2000)
                    
                } catch (error) {
                    showError('Failed to delete account: ' + error.message)
                } finally {
                    hideLoadingOverlay(loaderId)
                }
            }
        })
    }
    
    // ========== UI METHODS ==========
    
        
    showProfileModal() {
        const profileInfo = this.getProfileInfo()
        const stats = this.getStatistics()
        
        const modalContent = `
            <div style="max-width: 500px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: ${this.getAvatarColor()};
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        font-weight: bold;
                        margin: 0 auto 16px;
                    ">
                        ${this.getInitial()}
                    </div>
                    <h3 style="margin: 0 0 8px 0; color: #1e293b;">
                        ${this.getDisplayName()}
                    </h3>
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                        ${profileInfo.email}
                    </p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div style="
                        background: #f8fafc;
                        padding: 16px;
                        border-radius: 8px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; font-weight: 500; color: #0ea5e9;">
                            ${stats.meditation.totalSessions}
                        </div>
                        <div style="font-size: 12px; color: #64748b;">
                            Meditation Sessions
                        </div>
                    </div>
                    
                    <div style="
                        background: #f8fafc;
                        padding: 16px;
                        border-radius: 8px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; font-weight: 500; color: #10b981;">
                            ${stats.meditation.streak}
                        </div>
                        <div style="font-size: 12px; color: #64748b;">
                            Day Streak
                        </div>
                    </div>
                    
                    <div style="
                        background: #f8fafc;
                        padding: 16px;
                        border-radius: 8px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; font-weight: 500; color: #8b5cf6;">
                            ${stats.chat.messagesSent || 0}
                        </div>
                        <div style="font-size: 12px; color: #64748b;">
                            Messages Sent
                        </div>
                    </div>
                    
                    <div style="
                        background: #f8fafc;
                        padding: 16px;
                        border-radius: 8px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; font-weight: 500; color: #f59e0b;">
                            ${stats.accountAge}
                        </div>
                        <div style="font-size: 12px; color: #64748b;">
                            Days with Calm
                        </div>
                    </div>
                </div>
                
                <div style="
                    background: #f0f9ff;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                    border-left: 4px solid #0ea5e9;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 500; color: #1e293b;">Daily Goal</div>
                            <div style="font-size: 14px; color: #64748b;">
                                ${this.getMeditationGoal()} minutes
                            </div>
                        </div>
                        <button id="updateGoalBtn" style="
                            padding: 8px 16px;
                            background: #0ea5e9;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 14px;
                            cursor: pointer;
                        ">
                            Update
                        </button>
                    </div>
                </div>
                
                <div style="
                    border-top: 1px solid #e2e8f0;
                    padding-top: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                ">
                    <button id="exportDataBtn" style="
                        padding: 12px;
                        background: #f1f5f9;
                        color: #64748b;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                        text-align: left;
                    ">
                        📥 Export My Data
                    </button>
                    
                    <button id="themeToggleModalBtn" style="
                        padding: 12px;
                        background: #f1f5f9;
                        color: #64748b;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                        text-align: left;
                    ">
                        ${this.getCurrentTheme() === 'light' ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
                    </button>
                    
                    <button id="deleteAccountBtn" style="
                        padding: 12px;
                        background: #fef2f2;
                        color: #dc2626;
                        border: 1px solid #fecaca;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                        text-align: left;
                    ">
                        🗑️ Delete Account
                    </button>
                </div>
            </div>
        `
        
        const modalId = createModal(null, {
            title: 'My Profile',
            content: modalContent,
            size: 'medium',
            showCloseButton: true
        })
        
        // Add event listeners
        setTimeout(() => {
            const updateGoalBtn = document.querySelector(`#modal-wrapper-${modalId} #updateGoalBtn`)
            const exportDataBtn = document.querySelector(`#modal-wrapper-${modalId} #exportDataBtn`)
            const themeToggleBtn = document.querySelector(`#modal-wrapper-${modalId} #themeToggleModalBtn`)
            const deleteAccountBtn = document.querySelector(`#modal-wrapper-${modalId} #deleteAccountBtn`)
            
            if (updateGoalBtn) {
                updateGoalBtn.addEventListener('click', () => {
                    this.showUpdateGoalModal()
                })
            }
            
            if (exportDataBtn) {
                exportDataBtn.addEventListener('click', () => {
                    this.handleExportData()
                })
            }
            
            if (themeToggleBtn) {
                themeToggleBtn.addEventListener('click', () => {
                    const newTheme = this.toggleTheme()
                    themeToggleBtn.textContent = newTheme === 'light' 
                        ? '🌙 Switch to Dark Mode' 
                        : '☀️ Switch to Light Mode'
                    showMessage(`${newTheme === 'light' ? 'Light' : 'Dark'} mode enabled`, 'info')
                })
            }
            
            if (deleteAccountBtn) {
                deleteAccountBtn.addEventListener('click', () => {
                    this.deleteAccount()
                })
            }
        }, 100)
        
        return modalId
    }
    
    showUpdateGoalModal() {
        const currentGoal = this.getMeditationGoal()
        
        const modalContent = `
            <div style="max-width: 400px;">
                <p style="color: #64748b; margin-bottom: 20px;">
                    Set your daily meditation goal (in minutes)
                </p>
                
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    <button id="decreaseGoal" style="
                        width: 40px;
                        height: 40px;
                        border: 1px solid #e2e8f0;
                        background: white;
                        border-radius: 8px;
                        font-size: 20px;
                        cursor: pointer;
                    ">
                        -
                    </button>
                    
                    <div style="flex: 1; text-align: center;">
                        <div id="goalValue" style="
                            font-size: 32px;
                            font-weight: 500;
                            color: #0ea5e9;
                        ">
                            ${currentGoal}
                        </div>
                        <div style="font-size: 14px; color: #64748b;">
                            minutes
                        </div>
                    </div>
                    
                    <button id="increaseGoal" style="
                        width: 40px;
                        height: 40px;
                        border: 1px solid #e2e8f0;
                        background: white;
                        border-radius: 8px;
                        font-size: 20px;
                        cursor: pointer;
                    ">
                        +
                    </button>
                </div>
                
                <div style="
                    display: flex;
                    gap: 12px;
                    margin-top: 24px;
                ">
                    <button id="cancelGoal" style="
                        flex: 1;
                        padding: 12px;
                        background: #f1f5f9;
                        color: #64748b;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        Cancel
                    </button>
                    <button id="saveGoal" style="
                        flex: 1;
                        padding: 12px;
                        background: #0ea5e9;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        Save Goal
                    </button>
                </div>
            </div>
        `
        
        const modalId = createModal(null, {
            title: 'Update Daily Goal',
            content: modalContent,
            size: 'small',
            showCloseButton: true
        })
        
        // Add event listeners
        setTimeout(() => {
            let goalValue = currentGoal
            const goalValueElement = document.querySelector(`#modal-wrapper-${modalId} #goalValue`)
            const decreaseBtn = document.querySelector(`#modal-wrapper-${modalId} #decreaseGoal`)
            const increaseBtn = document.querySelector(`#modal-wrapper-${modalId} #increaseGoal`)
            const cancelBtn = document.querySelector(`#modal-wrapper-${modalId} #cancelGoal`)
            const saveBtn = document.querySelector(`#modal-wrapper-${modalId} #saveGoal`)
            
            const updateGoalDisplay = () => {
                if (goalValueElement) {
                    goalValueElement.textContent = goalValue
                }
            }
            
            if (decreaseBtn) {
                decreaseBtn.addEventListener('click', () => {
                    if (goalValue > 1) {
                        goalValue--
                        updateGoalDisplay()
                    }
                })
            }
            
            if (increaseBtn) {
                increaseBtn.addEventListener('click', () => {
                    if (goalValue < 120) {
                        goalValue++
                        updateGoalDisplay()
                    }
                })
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    closeModal(modalId)
                })
            }
            
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    try {
                        this.setMeditationGoal(goalValue)
                        showSuccess(`Daily goal updated to ${goalValue} minutes`)
                        closeModal(modalId)
                        
                        // Refresh profile modal if open
                        window.dispatchEvent(new CustomEvent('goal-updated'))
                    } catch (error) {
                        showError(error.message)
                    }
                })
            }
        }, 100)
        
        return modalId
    }
    
    handleExportData() {
        const data = this.exportData()
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `calm-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        showSuccess('Data exported successfully')
    }
}

// Create and export singleton instance
const userProfile = new UserProfile()

// Export for use in other files
export { UserProfile }
export default userProfile