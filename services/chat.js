// Chat service for handling real-time messaging and conversations

import api from './api.js'
import { Storage } from '../utils/storage.js'
import { showMessage, showError } from '../components/messages.js'

class ChatService {
    constructor() {
        this.messages = []
        this.conversations = []
        this.activeConversation = null
        this.websocket = null
        this.messageListeners = []
        this.statusListeners = []
        this.isConnected = false
        
        this.loadFromStorage()
    }
    
    // ========== MESSAGE MANAGEMENT ==========
    
    async sendMessage(content, conversationId = null) {
        try {
            // Validate message
            if (!content || content.trim().length === 0) {
                throw new Error('Message cannot be empty')
            }
            
            if (content.length > 1000) {
                throw new Error('Message is too long (max 1000 characters)')
            }
            
            const message = {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: content.trim(),
                sender: 'user',
                timestamp: new Date().toISOString(),
                conversationId: conversationId || this.activeConversation?.id || 'default',
                status: 'sending'
            }
            
            // Add to local storage immediately for instant feedback
            this.addMessage(message)
            
            // If we have WebSocket connection, send via WebSocket
            if (this.websocket && this.isConnected) {
                this.sendViaWebSocket(message)
            } else {
                // Otherwise send via HTTP API
                await this.sendViaHTTP(message)
            }
            
            return message
        } catch (error) {
            showError(error.message)
            throw error
        }
    }
    
    async sendViaHTTP(message) {
        try {
            const response = await api.post('/api/messages', {
                content: message.content,
                conversationId: message.conversationId
            })
            
            // Update message with server response
            this.updateMessage(message.id, {
                id: response.data.id || message.id,
                timestamp: response.data.timestamp || message.timestamp,
                status: 'sent'
            })
            
            // Check if we should trigger an AI response
            if (this.shouldTriggerAIResponse(message)) {
                setTimeout(() => {
                    this.generateAIResponse(message)
                }, 500 + Math.random() * 1000)
            }
            
        } catch (error) {
            this.updateMessage(message.id, {
                status: 'failed',
                error: error.message
            })
            throw error
        }
    }
    
    sendViaWebSocket(message) {
        if (!this.websocket || !this.isConnected) {
            throw new Error('WebSocket not connected')
        }
        
        this.websocket.send(JSON.stringify({
            type: 'message',
            data: message
        }))
    }
    
    addMessage(message) {
        // Add to memory
        this.messages.push(message)
        
        // Add to conversation if exists
        if (this.activeConversation) {
            if (!this.activeConversation.messages) {
                this.activeConversation.messages = []
            }
            this.activeConversation.messages.push(message)
        }
        
        // Save to storage
        this.saveToStorage()
        
        // Notify listeners
        this.notifyMessageListeners('add', message)
        
        return message
    }
    
    updateMessage(messageId, updates) {
        const index = this.messages.findIndex(msg => msg.id === messageId)
        if (index === -1) return null
        
        const oldMessage = this.messages[index]
        const updatedMessage = { ...oldMessage, ...updates }
        
        this.messages[index] = updatedMessage
        
        // Update in conversation if exists
        if (this.activeConversation?.messages) {
            const convIndex = this.activeConversation.messages.findIndex(msg => msg.id === messageId)
            if (convIndex > -1) {
                this.activeConversation.messages[convIndex] = updatedMessage
            }
        }
        
        // Save to storage
        this.saveToStorage()
        
        // Notify listeners
        this.notifyMessageListeners('update', updatedMessage, oldMessage)
        
        return updatedMessage
    }
    
    deleteMessage(messageId) {
        const index = this.messages.findIndex(msg => msg.id === messageId)
        if (index === -1) return false
        
        const deletedMessage = this.messages[index]
        this.messages.splice(index, 1)
        
        // Remove from conversation if exists
        if (this.activeConversation?.messages) {
            const convIndex = this.activeConversation.messages.findIndex(msg => msg.id === messageId)
            if (convIndex > -1) {
                this.activeConversation.messages.splice(convIndex, 1)
            }
        }
        
        // Save to storage
        this.saveToStorage()
        
        // Notify listeners
        this.notifyMessageListeners('delete', deletedMessage)
        
        return true
    }
    
    getMessages(conversationId = null) {
        if (conversationId) {
            return this.messages.filter(msg => msg.conversationId === conversationId)
        }
        return this.messages
    }
    
    getMessage(messageId) {
        return this.messages.find(msg => msg.id === messageId)
    }
    
    // ========== CONVERSATION MANAGEMENT ==========
    
    async createConversation(title = null) {
        try {
            const conversation = {
                id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: title || `Conversation ${this.conversations.length + 1}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [],
                unreadCount: 0,
                isArchived: false
            }
            
            this.conversations.push(conversation)
            this.saveToStorage()
            
            return conversation
        } catch (error) {
            console.error('Create conversation error:', error)
            throw error
        }
    }
    
    async setActiveConversation(conversationId) {
        const conversation = this.conversations.find(conv => conv.id === conversationId)
        if (!conversation) {
            throw new Error('Conversation not found')
        }
        
        this.activeConversation = conversation
        
        // Mark messages as read
        this.markConversationAsRead(conversationId)
        
        // Save to storage
        this.saveToStorage()
        
        return conversation
    }
    
    async deleteConversation(conversationId) {
        const index = this.conversations.findIndex(conv => conv.id === conversationId)
        if (index === -1) return false
        
        // Remove conversation
        this.conversations.splice(index, 1)
        
        // Remove associated messages
        this.messages = this.messages.filter(msg => msg.conversationId !== conversationId)
        
        // If active conversation was deleted, clear it
        if (this.activeConversation?.id === conversationId) {
            this.activeConversation = null
        }
        
        // Save to storage
        this.saveToStorage()
        
        return true
    }
    
    async archiveConversation(conversationId) {
        const conversation = this.conversations.find(conv => conv.id === conversationId)
        if (!conversation) return false
        
        conversation.isArchived = true
        conversation.updatedAt = new Date().toISOString()
        
        this.saveToStorage()
        return true
    }
    
    async unarchiveConversation(conversationId) {
        const conversation = this.conversations.find(conv => conv.id === conversationId)
        if (!conversation) return false
        
        conversation.isArchived = false
        conversation.updatedAt = new Date().toISOString()
        
        this.saveToStorage()
        return true
    }
    
    updateConversationTitle(conversationId, newTitle) {
        const conversation = this.conversations.find(conv => conv.id === conversationId)
        if (!conversation) return false
        
        conversation.title = newTitle
        conversation.updatedAt = new Date().toISOString()
        
        this.saveToStorage()
        return true
    }
    
    markConversationAsRead(conversationId) {
        const conversation = this.conversations.find(conv => conv.id === conversationId)
        if (!conversation) return false
        
        conversation.unreadCount = 0
        conversation.updatedAt = new Date().toISOString()
        
        // Also mark messages as read
        this.messages.forEach(msg => {
            if (msg.conversationId === conversationId && !msg.read) {
                msg.read = true
                msg.readAt = new Date().toISOString()
            }
        })
        
        this.saveToStorage()
        return true
    }
    
    getConversations(includeArchived = false) {
        if (includeArchived) {
            return this.conversations
        }
        return this.conversations.filter(conv => !conv.isArchived)
    }
    
    getConversation(conversationId) {
        return this.conversations.find(conv => conv.id === conversationId)
    }
    
    // ========== AI RESPONSE GENERATION ==========
    
    shouldTriggerAIResponse(message) {
        // Don't respond to AI messages
        if (message.sender === 'ai') return false
        
        // Only respond to user messages in active conversation
        if (message.conversationId !== this.activeConversation?.id) return false
        
        // Add some randomness to responses
        return Math.random() > 0.3
    }
    
    async generateAIResponse(userMessage) {
        try {
            // Create AI response object
            const aiResponse = {
                id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: '',
                sender: 'ai',
                timestamp: new Date().toISOString(),
                conversationId: userMessage.conversationId,
                status: 'generating',
                isTyping: true
            }
            
            // Add typing indicator
            this.addMessage(aiResponse)
            
            // Generate response (simulated delay)
            setTimeout(() => {
                const response = this.generateResponseContent(userMessage.content)
                
                this.updateMessage(aiResponse.id, {
                    content: response,
                    status: 'sent',
                    isTyping: false,
                    timestamp: new Date().toISOString()
                })
                
            }, 1000 + Math.random() * 2000)
            
        } catch (error) {
            console.error('AI response error:', error)
        }
    }
    
    generateResponseContent(userMessage) {
        // Simple AI response generation
        const responses = [
            "I understand how you feel.",
            "That's interesting. Tell me more.",
            "I'm here to listen.",
            "How does that make you feel?",
            "Thank you for sharing that with me.",
            "That sounds challenging.",
            "I appreciate you opening up.",
            "What do you think about that?",
            "I'm listening.",
            "That's a good point.",
            "How are you coping with that?",
            "That must be difficult.",
            "I can relate to that feeling.",
            "What would help you right now?",
            "Take a deep breath.",
            "You're doing great by talking about this.",
            "That's a valid perspective.",
            "I'm here for you.",
            "What's the next step for you?",
            "Thank you for being honest."
        ]
        
        // Add some context-aware responses
        const lowerMessage = userMessage.toLowerCase()
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            const greetings = ["Hello!", "Hi there!", "Hey!", "Hello, how are you?"]
            return greetings[Math.floor(Math.random() * greetings.length)]
        }
        
        if (lowerMessage.includes('thank')) {
            return "You're welcome. I'm glad I could be here for you."
        }
        
        if (lowerMessage.includes('sad') || lowerMessage.includes('unhappy') || lowerMessage.includes('depressed')) {
            return "I'm sorry you're feeling that way. It's okay to feel sad sometimes. Would you like to talk about what's bothering you?"
        }
        
        if (lowerMessage.includes('happy') || lowerMessage.includes('excited') || lowerMessage.includes('good')) {
            return "That's wonderful to hear! I'm glad you're feeling good. What's making you feel this way?"
        }
        
        if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
            return "Stress and anxiety can be overwhelming. Remember to breathe. Would you like to try a quick breathing exercise?"
        }
        
        if (lowerMessage.includes('love') || lowerMessage.includes('relationship')) {
            return "Relationships can be complex. It's important to communicate openly and honestly."
        }
        
        if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('career')) {
            return "Work can be a source of both satisfaction and stress. Finding balance is key."
        }
        
        if (lowerMessage.includes('?') && userMessage.length < 30) {
            const questions = [
                "That's an interesting question.",
                "I'm not sure, but what do you think?",
                "That depends on how you look at it.",
                "What's your perspective on that?",
                "I'd love to hear your thoughts first."
            ]
            return questions[Math.floor(Math.random() * questions.length)]
        }
        
        // Return random response
        return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // ========== WEBSOCKET MANAGEMENT ==========
    
    connectWebSocket() {
        try {
            // Create WebSocket connection (adjust URL as needed)
            const wsUrl = 'wss://your-websocket-server.com/chat'
            this.websocket = new WebSocket(wsUrl)
            
            this.websocket.onopen = () => {
                this.isConnected = true
                this.notifyStatusListeners('connected')
                console.log('WebSocket connected')
            }
            
            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    this.handleWebSocketMessage(data)
                } catch (error) {
                    console.error('WebSocket message parse error:', error)
                }
            }
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error)
                this.isConnected = false
                this.notifyStatusListeners('error', error)
            }
            
            this.websocket.onclose = () => {
                this.isConnected = false
                this.notifyStatusListeners('disconnected')
                console.log('WebSocket disconnected')
                
                // Attempt reconnection after delay
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.connectWebSocket()
                    }
                }, 3000)
            }
            
        } catch (error) {
            console.error('WebSocket connection error:', error)
            this.isConnected = false
        }
    }
    
    disconnectWebSocket() {
        if (this.websocket) {
            this.websocket.close()
            this.websocket = null
            this.isConnected = false
        }
    }
    
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'message':
                this.handleIncomingMessage(data.data)
                break
                
            case 'message_update':
                this.updateMessage(data.data.id, data.data.updates)
                break
                
            case 'typing_indicator':
                this.handleTypingIndicator(data.data)
                break
                
            case 'presence':
                this.handlePresenceUpdate(data.data)
                break
                
            default:
                console.log('Unknown WebSocket message type:', data.type)
        }
    }
    
    handleIncomingMessage(message) {
        // Check if message already exists
        const existing = this.getMessage(message.id)
        if (existing) {
            this.updateMessage(message.id, message)
        } else {
            this.addMessage(message)
        }
    }
    
    handleTypingIndicator(data) {
        // Notify listeners about typing status
        this.notifyMessageListeners('typing', data)
    }
    
    handlePresenceUpdate(data) {
        // Handle user presence updates
        this.notifyStatusListeners('presence', data)
    }
    
    // ========== EVENT LISTENERS ==========
    
    addMessageListener(callback) {
        this.messageListeners.push(callback)
        return () => {
            this.messageListeners = this.messageListeners.filter(cb => cb !== callback)
        }
    }
    
    addStatusListener(callback) {
        this.statusListeners.push(callback)
        return () => {
            this.statusListeners = this.statusListeners.filter(cb => cb !== callback)
        }
    }
    
    notifyMessageListeners(event, data, oldData = null) {
        this.messageListeners.forEach(callback => {
            try {
                callback(event, data, oldData)
            } catch (error) {
                console.error('Message listener error:', error)
            }
        })
    }
    
    notifyStatusListeners(event, data = null) {
        this.statusListeners.forEach(callback => {
            try {
                callback(event, data)
            } catch (error) {
                console.error('Status listener error:', error)
            }
        })
    }
    
    // ========== STORAGE MANAGEMENT ==========
    
      
    loadFromStorage() {
        try {
            const savedMessages = Storage.get('chat_messages', [])
            const savedConversations = Storage.get('chat_conversations', [])
            const savedActiveConversation = Storage.get('active_conversation')
            
            this.messages = savedMessages
            this.conversations = savedConversations
            
            if (savedActiveConversation) {
                this.activeConversation = this.getConversation(savedActiveConversation.id) || savedActiveConversation
            }
            
            // Create default conversation if none exists
            if (this.conversations.length === 0) {
                this.createConversation('Welcome')
            }
            
        } catch (error) {
            console.error('Load from storage error:', error)
            // Initialize with empty data
            this.messages = []
            this.conversations = []
            this.createConversation('Welcome')
        }
    }
    
    saveToStorage() {
        try {
            Storage.set('chat_messages', this.messages)
            Storage.set('chat_conversations', this.conversations)
            
            if (this.activeConversation) {
                Storage.set('active_conversation', this.activeConversation)
            }
        } catch (error) {
            console.error('Save to storage error:', error)
        }
    }
    
    clearStorage() {
        Storage.remove('chat_messages')
        Storage.remove('chat_conversations')
        Storage.remove('active_conversation')
        
        this.messages = []
        this.conversations = []
        this.activeConversation = null
        
        // Create default conversation
        this.createConversation('Welcome')
    }
    
    // ========== UTILITY METHODS ==========
    
    getUnreadCount(conversationId = null) {
        if (conversationId) {
            const conversation = this.getConversation(conversationId)
            return conversation?.unreadCount || 0
        }
        
        return this.conversations.reduce((total, conv) => total + conv.unreadCount, 0)
    }
    
    searchMessages(query) {
        if (!query || query.trim().length === 0) {
            return []
        }
        
        const searchTerm = query.toLowerCase().trim()
        return this.messages.filter(msg => 
            msg.content.toLowerCase().includes(searchTerm) &&
            msg.sender === 'user'
        )
    }
    
    exportConversation(conversationId, format = 'json') {
        const conversation = this.getConversation(conversationId)
        if (!conversation) return null
        
        const messages = this.getMessages(conversationId)
        
        if (format === 'json') {
            return JSON.stringify({
                conversation,
                messages,
                exportDate: new Date().toISOString()
            }, null, 2)
        } else if (format === 'text') {
            let text = `Conversation: ${conversation.title}\n`
            text += `Exported: ${new Date().toLocaleString()}\n\n`
            
            messages.forEach(msg => {
                const sender = msg.sender === 'user' ? 'You' : 'Calm'
                const time = new Date(msg.timestamp).toLocaleTimeString()
                text += `[${time}] ${sender}: ${msg.content}\n`
            })
            
            return text
        }
        
        return null
    }
    
    // ========== STATISTICS ==========
    
    getStatistics() {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const messagesToday = this.messages.filter(msg => 
            new Date(msg.timestamp) >= today && msg.sender === 'user'
        ).length
        
        const totalWords = this.messages
            .filter(msg => msg.sender === 'user')
            .reduce((total, msg) => total + (msg.content.split(' ').length), 0)
        
        const avgMessageLength = this.messages.length > 0 
            ? Math.round(totalWords / this.messages.filter(msg => msg.sender === 'user').length)
            : 0
        
        return {
            totalMessages: this.messages.length,
            userMessages: this.messages.filter(msg => msg.sender === 'user').length,
            aiMessages: this.messages.filter(msg => msg.sender === 'ai').length,
            conversations: this.conversations.length,
            activeConversationDays: this.getActiveConversationDays(),
            messagesToday,
            totalWords,
            avgMessageLength
        }
    }
    
    getActiveConversationDays() {
        if (this.messages.length === 0) return 0
        
        const dates = new Set()
        this.messages.forEach(msg => {
            const date = new Date(msg.timestamp).toDateString()
            dates.add(date)
        })
        
        return dates.size
    }
}

// Create singleton instance
const chatService = new ChatService()

// Export singleton
export default chatService