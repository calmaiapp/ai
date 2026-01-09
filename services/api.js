// services/api.js - UPDATED WITH AUTH
import { supabase } from '../utils/supabase.js'

class ApiService {
    constructor() {
        this.functionURL = 'https://modjpklljhkwesysezvc.supabase.co/functions/v1/calm-ai'
    }

    async getAIResponse(message) {
        try {
            console.log('📨 Sending to Calm AI:', message.substring(0, 50) + '...')
            
            // Get current session for auth
            const { data: { session } } = await supabase.auth.getSession()
            
            const headers = {
                'Content-Type': 'application/json'
            }
            
            // Add authorization if we have a session
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`
            }
            
            const response = await fetch(this.functionURL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                    message: message 
                })
            })

            console.log('📡 Response status:', response.status, response.statusText)
            
            // Check if unauthorized
            if (response.status === 401) {
                console.warn('⚠️ 401 Unauthorized - Function needs auth or JWT disabled')
                return this.getFallbackResponse(message)
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            console.log('💭 Calm AI responded:', data.success ? '✓' : '✗')
            
            if (data.success) {
                return {
                    success: true,
                    message: data.message,
                    isSimulated: data.isSimulated || false
                }
            } else {
                return this.getFallbackResponse(message)
            }
            
        } catch (error) {
            console.error('🔴 Calm AI Error:', error)
            return this.getFallbackResponse(message)
        }
    }
    
    getFallbackResponse(message) {
        const userMessage = message.toLowerCase()
        
        // Creator questions
        if (userMessage.includes('who created') || 
            userMessage.includes('who made you') ||
            userMessage.includes('your creator')) {
            return {
                success: false,
                message: "I was created by Zeeshan Khan.",
                isSimulated: true
            }
        }
        
        // Common topics
        if (userMessage.includes('anxiety') || userMessage.includes('anxious')) {
            return {
                success: false,
                message: "Anxiety is like a worried feeling that stays. It's your body saying it needs gentle care.",
                isSimulated: true
            }
        }
        
        if (userMessage.includes('stress') || userMessage.includes('stressed')) {
            return {
                success: false,
                message: "Stress is when you feel too much pressure. Let's breathe together.",
                isSimulated: true
            }
        }
        
        if (userMessage.includes('sad') || userMessage.includes('depress')) {
            return {
                success: false,
                message: "I'm here with you. It's okay to feel this way.",
                isSimulated: true
            }
        }
        
        // General responses
        const responses = [
            "I hear you. I'm here with you.",
            "Thank you for sharing that.",
            "Let's take a moment together.",
            "I'm listening.",
            "That sounds difficult. I'm here with you.",
            "I understand. Let's breathe through this.",
            "You're not alone.",
            "I'm here. However you feel is okay.",
            "Let's pause together.",
            "I hear what you're saying."
        ]
        
        return {
            success: false,
            message: responses[Math.floor(Math.random() * responses.length)],
            isSimulated: true
        }
    }
    
    async testConnection() {
        try {
            console.log('🔍 Testing connection to Calm AI...')
            
            // Try simple OPTIONS request first
            const optionsResponse = await fetch(this.functionURL, {
                method: 'OPTIONS'
            })
            
            console.log('🟢 OPTIONS test:', optionsResponse.status, optionsResponse.ok)
            
            // Try POST with minimal data
            const testResult = await this.getAIResponse('test')
            
            return {
                connected: testResult.success,
                message: testResult.message,
                isSimulated: testResult.isSimulated
            }
        } catch (error) {
            return {
                connected: false,
                message: 'Connection test failed',
                error: error.message
            }
        }
    }
}

const apiService = new ApiService()
export default apiService
