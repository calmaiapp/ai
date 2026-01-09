// Core chat functionality for the home page

import { getCurrentUser, signOut } from '../utils/auth-core.js'
import chatService from '../services/chat.js'
import { showMessage, showError } from '../components/messages.js'
import { createModal, showConfirm } from '../components/modals.js'

class ChatCore {
    constructor() {
        this.user = null
        this.isInitialized = false
        this.elements = {}
        this.messageListeners = []
        this.idleTimer = null
        this.idleTimeout = 30000 // 30 seconds
    }

    async init() {
        if (this.isInitialized) return

        try {
            // Check authentication
            this.user = await this.checkAuth()
            if (!this.user) return

            // Get DOM elements
            this.getElements()

            // Initialize chat service
            await this.initChatService()

            // Setup event listeners
            this.setupEventListeners()

            // Load initial data
            await this.loadInitialData()

            // Setup idle timer (SAFE VERSION)
            this.setupIdleTimer()

            this.isInitialized = true

            // Show welcome message if first time
            this.showWelcomeIfNeeded()

        } catch (error) {
            console.error('Chat core initialization error:', error)
            showError('Failed to initialize chat')
        }
    }

    async checkAuth() {
        try {
            const result = await getCurrentUser()

            if (!result.success || !result.user) {
                // Redirect to login
                window.location.href = '/ai/login/index.html'
                return null
            }

            return result.user
        } catch (error) {
            console.error('Auth check error:', error)
            window.location.href = '/ai/login/index.html'
            return null
        }
    }

    getElements() {
        this.elements = {
            // Input area
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendBtn'),

            // Containers
            welcomeScreen: document.getElementById('welcomeScreen'),
            messagesContainer: document.getElementById('messagesContainer'),

            // Navigation
            menuButton: document.querySelector('.menu-btn'),
            infoButton: document.querySelector('.info-btn'),
            logoutButton: document.getElementById('logoutBtn'),

            // Menu
            simpleMenu: document.getElementById('simpleMenu'),
            menuClose: document.getElementById('menuClose'),
            userDetails: document.getElementById('userDetails'),
            userAvatar: document.getElementById('userAvatar')
        }
    }

    async initChatService() {
        // Load existing messages
        const messages = chatService.getMessages()

        // If we have existing messages, show them
        if (messages.length > 0) {
            this.showMessagesContainer()
            this.displayExistingMessages(messages)
        }

        // Setup chat service listeners
        this.setupChatListeners()
    }

    setupEventListeners() {
        // Send message
        if (this.elements.sendButton) {
            this.elements.sendButton.addEventListener('click', () => this.sendMessage())
        }

        // Enter key to send
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    this.sendMessage()
                }
            })
        }

        // Menu
        if (this.elements.menuButton) {
            this.elements.menuButton.addEventListener('click', () => this.toggleMenu())
        }

        if (this.elements.menuClose) {
            this.elements.menuClose.addEventListener('click', () => this.closeMenu())
        }

        // Info button
        if (this.elements.infoButton) {
            this.elements.infoButton.addEventListener('click', () => this.showInfo())
        }

        // Logout
        if (this.elements.logoutButton) {
            this.elements.logoutButton.addEventListener('click', () => this.handleLogout())
        }

        // Close menu on outside click
        if (this.elements.simpleMenu) {
            this.elements.simpleMenu.addEventListener('click', (e) => {
                if (e.target === this.elements.simpleMenu) {
                    this.closeMenu()
                }
            })
        }

        // Window events
        window.addEventListener('beforeunload', () => this.handleBeforeUnload())
        window.addEventListener('online', () => this.handleOnlineStatus())
        window.addEventListener('offline', () => this.handleOfflineStatus())
    }

    setupChatListeners() {
        // Listen for new messages
        chatService.addMessageListener((event, message, oldMessage) => {
            switch (event) {
                case 'add':
                    this.displayMessage(message)
                    break

                case 'update':
                    this.updateMessageDisplay(message, oldMessage)
                    break

                case 'delete':
                    this.removeMessageDisplay(message.id)
                    break

                case 'typing':
                    this.showTypingIndicator(message)
                    break
            }
        })

        // Listen for connection status
        chatService.addStatusListener((event, data) => {
            switch (event) {
                case 'connected':
                    this.showConnectionStatus('Connected', 'success')
                    break

                case 'disconnected':
                    this.showConnectionStatus('Disconnected', 'error')
                    break

                case 'error':
                    this.showConnectionStatus('Connection error', 'error')
                    break
            }
        })
    }

    async loadInitialData() {
        // Update user info
        this.updateUserInfo()

        // Update user details in menu
        this.updateUserDetails()

        // Focus input
        if (this.elements.messageInput) {
            setTimeout(() => {
                this.elements.messageInput.focus()
            }, 100)
        }
    }

    // ========== MESSAGE HANDLING ==========

    async sendMessage() {
        const input = this.elements.messageInput
        if (!input) return

        const content = input.value.trim()
        if (!content) return

        // Clear input
        input.value = ''

        try {
            // Send message via chat service
            await chatService.sendMessage(content)

        } catch (error) {
            console.error('Send message error:', error)
            showError('Failed to send message')

            // Restore message if sending failed
            input.value = content
            input.focus()
        }
    }

    displayMessage(message) {
        // Hide welcome screen if this is the first message
        if (this.elements.welcomeScreen && !this.elements.welcomeScreen.classList.contains('hidden')) {
            this.showMessagesContainer()
        }

        // Create message element
        const messageElement = this.createMessageElement(message)

        // Add to container
        if (this.elements.messagesContainer) {
            this.elements.messagesContainer.appendChild(messageElement)

            // Scroll to bottom
            this.scrollToBottom()
        }

        // Reset idle timer
        this.resetIdleTimer()
    }

    createMessageElement(message) {
        const div = document.createElement('div')
        div.id = `message-${message.id}`
        div.className = `message ${message.sender === 'user' ? 'user-message' : 'response-message'}`

        if (message.isTyping) {
            div.classList.add('typing')
            div.innerHTML = `
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `
        } else {
            div.textContent = message.content

            // Add timestamp if available
            if (message.timestamp) {
                const time = new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })

                const timeSpan = document.createElement('span')
                timeSpan.className = 'message-time'
                timeSpan.textContent = time
                timeSpan.style.cssText = `
                    display: block;
                    font-size: 11px;
                    opacity: 0.7;
                    margin-top: 4px;
                    text-align: ${message.sender === 'user' ? 'right' : 'left'};
                `
                div.appendChild(timeSpan)
            }
        }

        // Add message status
        if (message.sender === 'user' && message.status) {
            const statusSpan = document.createElement('span')
            statusSpan.className = `message-status ${message.status}`

            let statusText = ''
            let statusIcon = ''

            switch (message.status) {
                case 'sending':
                    statusText = 'Sending'
                    statusIcon = '⏳'
                    break
                case 'sent':
                    statusText = 'Sent'
                    statusIcon = '✓'
                    break
                case 'failed':
                    statusText = 'Failed'
                    statusIcon = '✗'
                    break
            }

            statusSpan.textContent = `${statusIcon} ${statusText}`
            statusSpan.style.cssText = `
                display: block;
                font-size: 10px;
                opacity: 0.7;
                margin-top: 2px;
                text-align: right;
            `
            div.appendChild(statusSpan)
        }

        return div
    }

    updateMessageDisplay(message, oldMessage) {
        const element = document.getElementById(`message-${message.id}`)
        if (!element) return

        // Update content if changed
        if (oldMessage?.content !== message.content || oldMessage?.isTyping !== message.isTyping) {
            if (message.isTyping) {
                element.classList.add('typing')
                element.innerHTML = `
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                `
            } else {
                element.classList.remove('typing')
                element.textContent = message.content

                // Add back timestamp if it was removed
                if (!element.querySelector('.message-time') && message.timestamp) {
                    const time = new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })

                    const timeSpan = document.createElement('span')
                    timeSpan.className = 'message-time'
                    timeSpan.textContent = time
                    timeSpan.style.cssText = `
                        display: block;
                        font-size: 11px;
                        opacity: 0.7;
                        margin-top: 4px;
                        text-align: ${message.sender === 'user' ? 'right' : 'left'};
                    `
                    element.appendChild(timeSpan)
                }
            }
        }

        // Update status if changed
        if (oldMessage?.status !== message.status && message.sender === 'user') {
            let statusElement = element.querySelector('.message-status')

            if (!statusElement) {
                statusElement = document.createElement('span')
                statusElement.className = 'message-status'
                statusElement.style.cssText = `
                    display: block;
                    font-size: 10px;
                    opacity: 0.7;
                    margin-top: 2px;
                    text-align: right;
                `
                element.appendChild(statusElement)
            }

            let statusText = ''
            let statusIcon = ''

            switch (message.status) {
                case 'sending':
                    statusText = 'Sending'
                    statusIcon = '⏳'
                    break
                case 'sent':
                    statusText = 'Sent'
                    statusIcon = '✓'
                    break
                case 'failed':
                    statusText = 'Failed'
                    statusIcon = '✗'
                    break
            }

            statusElement.textContent = `${statusIcon} ${statusText}`
            statusElement.className = `message-status ${message.status}`
        }
    }

    removeMessageDisplay(messageId) {
        const element = document.getElementById(`message-${messageId}`)
        if (element) {
            element.remove()
        }
    }

    displayExistingMessages(messages) {
        if (!this.elements.messagesContainer) return

        // Clear container
        this.elements.messagesContainer.innerHTML = ''

        // Display all messages
        messages.forEach(message => {
            const element = this.createMessageElement(message)
            this.elements.messagesContainer.appendChild(element)
        })

        // Scroll to bottom
        this.scrollToBottom()
    }

    showTypingIndicator(data) {
        // Show typing indicator for other users
        // Implement based on your needs
    }

    // ========== UI CONTROLS ==========

    showMessagesContainer() {
        if (!this.elements.welcomeScreen || !this.elements.messagesContainer) return

        // Start transition effect
        this.elements.welcomeScreen.classList.add('blurred')

        // After blur animation, hide welcome screen
        setTimeout(() => {
            this.elements.welcomeScreen.classList.add('hidden')

            // Show messages container
            setTimeout(() => {
                this.elements.messagesContainer.style.display = 'flex'
            }, 100)
        }, 800)
    }

    scrollToBottom() {
        if (this.elements.messagesContainer) {
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight
        }
    }

    toggleMenu() {
        if (this.elements.simpleMenu) {
            this.elements.simpleMenu.classList.toggle('active')
        }
    }

    closeMenu() {
        if (this.elements.simpleMenu) {
            this.elements.simpleMenu.classList.remove('active')
        }
    }

    showInfo() {
        const infoMessage = "This is Calm. A peaceful place to think and talk. Just type what's on your mind."
        chatService.sendMessage(infoMessage)
    }

    // ========== USER MANAGEMENT ==========

    updateUserInfo() {
        if (!this.user) return

        // Update avatar
        if (this.elements.userAvatar) {
            const username = this.user.user_metadata?.username || this.user.email.split('@')[0]
            this.elements.userAvatar.textContent = username.charAt(0).toUpperCase()

            // Set random background color
            const colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]
            this.elements.userAvatar.style.backgroundColor = randomColor
        }
    }

    updateUserDetails() {
        if (!this.elements.userDetails || !this.user) return

        const username = this.user.user_metadata?.username || this.user.email.split('@')[0]

        this.elements.userDetails.innerHTML = `
            <div style="margin-bottom: 15px;">
                <div style="font-weight: 500; color: #1e293b; margin-bottom: 5px;">${username}</div>
                <div style="font-size: 14px; color: #64748b;">${this.user.email}</div>
            </div>
            <div style="font-size: 12px; color: #94a3b8;">
                <div>Active now</div>
                <div style="margin-top: 10px;">
                    <button id="clearChatBtn" style="
                        padding: 8px 12px;
                        background: #f1f5f9;
                        color: #64748b;
                        border: none;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        width: 100%;
                    ">
                        Clear Chat History
                    </button>
                </div>
            </div>
        `

        // Add clear chat button listener
        setTimeout(() => {
            const clearChatBtn = document.getElementById('clearChatBtn')
            if (clearChatBtn) {
                clearChatBtn.addEventListener('click', () => this.handleClearChat())
            }
        }, 100)
    }

    async handleLogout() {
        try {
            const result = await signOut()
            if (result.success) {
                window.location.href = '/ai/index.html'
            } else {
                showError('Logout failed: ' + result.error)
            }
        } catch (error) {
            showError('Logout error: ' + error.message)
        }
    }

    async handleClearChat() {
        showConfirm('Clear all chat history? This action cannot be undone.', {
            onConfirm: () => {
                chatService.clearChat()
                showMessage('Chat history cleared', 'success')
                window.location.reload()
            },
            onCancel: () => {
                // Do nothing
            }
        })
    }

    // ========== IDLE TIMER ==========

    setupIdleTimer() {
        // SAFE VERSION: Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            console.warn('Not in browser environment, skipping idle timer setup')
            return
        }

        this.resetIdleTimer()

        // SAFE VERSION: Use try-catch and check for event support
        const events = ['keydown', 'mousedown']
        
        // Only add touchstart if supported (mobile devices)
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            events.push('touchstart')
        }

        events.forEach(event => {
            try {
                document.addEventListener(event, () => this.resetIdleTimer())
            } catch (error) {
                console.warn(`Could not add ${event} listener:`, error)
            }
        })
    }

    resetIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer)
        }

        this.idleTimer = setTimeout(() => {
            this.handleIdleTimeout()
        }, this.idleTimeout)
    }

    handleIdleTimeout() {
        // Send idle message if conversation has messages
        const messages = chatService.getMessages()
        if (messages.length > 0) {
            const idleMessages = [
                "Still there?",
                "Take your time.",
                "I'm here when you're ready.",
                "Whenever you want to continue...",
                "No rush."
            ]

            const randomMessage = idleMessages[Math.floor(Math.random() * idleMessages.length)]
            chatService.sendMessage(randomMessage)
        }
    }

    // ========== WELCOME & INITIALIZATION ==========

    showWelcomeIfNeeded() {
        const messages = chatService.getMessages()

        if (messages.length === 0 && this.elements.welcomeScreen) {
            // Show welcome screen
            this.elements.welcomeScreen.classList.remove('hidden', 'blurred')
            this.elements.messagesContainer.style.display = 'none'
        }
    }

    showConnectionStatus(message, type) {
        showMessage(message, type)
    }

    // ========== EVENT HANDLERS ==========

    handleBeforeUnload() {
        // Save any pending data
        chatService.saveToStorage()
    }

    handleOnlineStatus() {
        showMessage('Back online', 'success')
    }

    handleOfflineStatus() {
        showMessage('You are offline', 'warning')
    }

    // ========== PUBLIC METHODS ==========

    async start() {
        await this.init()
    }

    getMessages() {
        return chatService.getMessages()
    }

    getConversations() {
        return chatService.getConversations()
    }

    setActiveConversation(conversationId) {
        return chatService.setActiveConversation(conversationId)
    }

    clearHistory() {
        chatService.clearChat()
        window.location.reload()
    }
}

// Create and export singleton instance
const chatCore = new ChatCore()

// Export for use in other files
export { ChatCore }
export default chatCore