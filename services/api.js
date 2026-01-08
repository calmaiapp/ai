// API service for making HTTP requests with error handling and retries
import { showError, showMessage } from '../components/messages.js'

class ApiService {
    constructor() {
        this.baseURL = 'https://modjpklljhkwesysezvc.supabase.co/functions/v1'
        this.retryAttempts = 3
        this.retryDelay = 1000
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        }

        const config = { ...defaultOptions, ...options }

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, config)
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }
                
                const data = await response.json()
                return { success: true, data }
                
            } catch (error) {
                if (attempt === this.retryAttempts) {
                    return {
                        success: false,
                        error: error.message,
                        status: error.status
                    }
                }
                
                // Wait before retrying
                await new Promise(resolve => 
                    setTimeout(resolve, this.retryDelay * attempt)
                )
            }
        }
    }

    // OpenAI API call
    async getAIResponse(message, conversationHistory = []) {
        try {
            const response = await this.request('/calm-ai', {
                method: 'POST',
                body: JSON.stringify({
                    message: message,
                    history: conversationHistory
                })
            })

            if (response.success) {
                return {
                    success: true,
                    message: response.data.message || response.data.response,
                    tokens: response.data.tokens_used
                }
            } else {
                // Fallback to local response if API fails
                return {
                    success: false,
                    message: this.getFallbackResponse(message),
                    isFallback: true
                }
            }
        } catch (error) {
            return {
                success: false,
                message: "Let's take a gentle breath together. The connection is quiet right now.",
                error: error.message,
                isFallback: true
            }
        }
    }

    // Local fallback responses (used when API is unavailable)
    getFallbackResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase()
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello. I'm here. How are you feeling today?"
        }
        
        if (lowerMessage.includes('stress') || lowerMessage.includes('anxious')) {
            return "I hear you're feeling stressed. Let's take three deep breaths together."
        }
        
        if (lowerMessage.includes('sad') || lowerMessage.includes('unhappy')) {
            return "I'm here with you. It's okay to feel this way. Would you like to talk about it?"
        }
        
        if (lowerMessage.includes('thank')) {
            return "You're welcome. I'm glad to be here for you."
        }
        
        const responses = [
            "I understand. Tell me more.",
            "I'm listening.",
            "How does that feel for you?",
            "Thank you for sharing that.",
            "Let's breathe together for a moment.",
            "I'm here with you.",
            "What's present for you right now?",
            "Take your time. I'm here."
        ]
        
        return responses[Math.floor(Math.random() * responses.length)]
    }

    // Test API connection
    async testConnection() {
        const result = await this.getAIResponse('Test connection')
        return result.success
    }

    // Get conversation history from database
    async getConversationHistory(conversationId = 'default', limit = 10) {
        try {
            const response = await this.request(`/conversations/${conversationId}?limit=${limit}`)
            return response
        } catch (error) {
            console.error('Get conversation error:', error)
            return { success: false, data: [] }
        }
    }

    // Save message to database
    async saveMessage(messageData) {
        try {
            const response = await this.request('/messages', {
                method: 'POST',
                body: JSON.stringify(messageData)
            })
            return response
        } catch (error) {
            console.error('Save message error:', error)
            return { success: false }
        }
    }
}

// Create singleton instance
const apiService = new ApiService()

// Export singleton
export default apiService
