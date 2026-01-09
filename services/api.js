// API service for Calm AI
class ApiService {
    constructor() {
        // Your Calm AI function URL
        this.functionURL = 'https://modjpklljhkwesysezvc.supabase.co/functions/v1/calm-ai'
    }

    async getAIResponse(message) {
        try {
            console.log('📨 Sending to Calm AI:', message.substring(0, 50) + '...')
            
            const response = await fetch(this.functionURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message: message 
                })
            })

            const data = await response.json()
            console.log('💭 Calm AI responded:', data.success ? '✓' : '✗')
            
            if (data.success) {
                return {
                    success: true,
                    message: data.message,
                    isSimulated: data.isSimulated || false,
                    responseType: data.responded_to || 'general'
                }
            } else {
                // Fallback gentle response
                return {
                    success: false,
                    message: "I'm here with you. Let's breathe together for a moment.",
                    isSimulated: true,
                    responseType: 'fallback'
                }
            }
            
        } catch (error) {
            console.error('🔴 Calm AI Error:', error)
            return {
                success: false,
                message: "The connection is quiet. I'm still here with you. Let's breathe together.",
                isSimulated: true,
                responseType: 'error'
            }
        }
    }
    
    // Test the connection
    async testConnection() {
        try {
            const testResult = await this.getAIResponse('Hello')
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

// Create and export singleton
const apiService = new ApiService()
export default apiService