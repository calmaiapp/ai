// Chat service for handling real-time messaging and conversations
import apiService from './api.js'
import { Storage } from '../utils/storage.js'
import { showMessage, showError } from '../components/messages.js'

class ChatService {
    constructor() {
        this.messages = []
        this.conversations = []
        this.activeConversation = null
        this.messageListeners = []
        this.statusListeners = []
        this.isGenerating = false
        
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
            
            // Update to sent status
            this.updateMessage(message.id, {
                status: 'sent'
            })
            
            // Generate AI response
            await this.generateAIResponse(message)
            
            return message
        } catch (error) {
            showError(error.message)
            throw error
        }
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
    
    // ========== AI RESPONSE GENERATION ==========
    
    async generateAIResponse(userMessage) {
        if (this.isGenerating) return
        
        this.isGenerating = true
        
        try {
            // Create AI response placeholder
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
            
            // Get conversation history for context
            const recentMessages = this.getRecentMessages(userMessage.conversationId, 6)
            const conversationHistory = recentMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
            
            // Call OpenAI API via our apiService
            const response = await apiService.getAIResponse(userMessage.content, conversationHistory)
            
            // Update message with response
            this.updateMessage(aiResponse.id, {
                content: response.message,
                status: 'sent',
                isTyping: false,
                timestamp: new Date().toISOString(),
                isFallback: response.isFallback
            })
            
        } catch (error) {
            console.error('AI response error:', error)
            // Show gentle error
            this.updateMessage(aiResponse.id, {
                content: "Let's breathe together for a moment. The connection is quiet.",
                status: 'sent',
                isTyping: false,
                isFallback: true
            })
        } finally {
            this.isGenerating = false
        }
    }
    
    getRecentMessages(conversationId, limit = 6) {
        const filtered = this.messages.filter(msg => 
            msg.conversationId === conversationId
        )
        return filtered.slice(-limit)
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
        this.saveToStorage()
        
        return conversation
    }
    
    getConversation(conversationId) {
        return this.conversations.find(conv => conv.id === conversationId)
    }
    
    getConversations(includeArchived = false) {
        if (includeArchived) {
            return this.conversations
        }
        return this.conversations.filter(conv => !conv.isArchived)
    }
    
    getMessages(conversationId = null) {
        if (conversationId) {
            return this.messages.filter(msg => msg.conversationId === conversationId)
        }
        return this.messages
    }
    
    // ========== UTILITY METHODS ==========
    
    getStatistics() {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const messagesToday = this.messages.filter(msg => 
            new Date(msg.timestamp) >= today && msg.sender === 'user'
        ).length
        
        return {
            totalMessages: this.messages.length,
            userMessages: this.messages.filter(msg => msg.sender === 'user').length,
            aiMessages: this.messages.filter(msg => msg.sender === 'ai').length,
            conversations: this.conversations.length,
            messagesToday
        }
    }
    
    clearChat() {
        Storage.remove('chat_messages')
        Storage.remove('chat_conversations')
        Storage.remove('active_conversation')
        
        this.messages = []
        this.conversations = []
        this.activeConversation = null
        
        // Create new default conversation
        this.createConversation('Welcome')
        
        return true
    }
}

// Create singleton instance
const chatService = new ChatService()

// Export singleton
export default chatService
