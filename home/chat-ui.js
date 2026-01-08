// UI components and styling for the chat interface

import { showMessage } from '../components/messages.js'
import { createModal, showConfirm } from '../components/modals.js'

class ChatUI {
    constructor() {
        this.stylesInjected = false
        this.theme = 'light'
        this.init()
    }
    
    init() {
        this.injectStyles()
        this.setupTheme()
        this.setupResponsive()
    }
    
    injectStyles() {
        if (this.stylesInjected) return
        
        const styles = document.createElement('style')
        styles.id = 'chat-ui-styles'
        styles.textContent = this.getChatStyles()
        document.head.appendChild(styles)
        
        this.stylesInjected = true
    }
    
    getChatStyles() {
        return `
            /* Chat Container */
            .chat-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                background: #f8fafc;
                position: relative;
                overflow: hidden;
            }
            
            /* Top Bar */
            .chat-top-bar {
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 20px;
                background: white;
                border-bottom: 1px solid #e2e8f0;
                flex-shrink: 0;
                z-index: 10;
            }
            
            .chat-menu-btn {
                width: 40px;
                height: 40px;
                border: none;
                background: none;
                cursor: pointer;
                padding: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: all 0.2s;
            }
            
            .chat-menu-btn:hover {
                background: #f1f5f9;
            }
            
            .chat-menu-icon {
                display: flex;
                flex-direction: column;
                gap: 4px;
                width: 20px;
            }
            
            .chat-menu-icon span {
                height: 2px;
                background: #0ea5e9;
                width: 100%;
                border-radius: 1px;
                transition: all 0.3s;
            }
            
            .chat-menu-icon span:nth-child(2) {
                width: 70%;
            }
            
            .chat-menu-icon span:nth-child(3) {
                width: 85%;
            }
            
            .chat-title {
                font-size: 24px;
                font-weight: 400;
                color: #0ea5e9;
                letter-spacing: -0.5px;
                user-select: none;
            }
            
            .chat-info-btn {
                width: 40px;
                height: 40px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 24px;
                color: #0ea5e9;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: all 0.2s;
            }
            
            .chat-info-btn:hover {
                background: #f1f5f9;
            }
            
            /* Messages Area */
            .chat-messages-area {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                background: #f8fafc;
                position: relative;
            }
            
            .chat-welcome-screen {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8fafc;
                transition: all 0.8s ease;
                backdrop-filter: blur(10px);
                z-index: 5;
            }
            
            .chat-welcome-screen.blurred {
                backdrop-filter: blur(20px);
                opacity: 0;
            }
            
            .chat-welcome-screen.hidden {
                display: none;
            }
            
            .chat-welcome-content {
                text-align: center;
                padding: 40px;
                max-width: 400px;
            }
            
            .chat-welcome-title {
                font-size: 32px;
                font-weight: 300;
                line-height: 1.3;
                color: #0ea5e9;
                margin-bottom: 24px;
                letter-spacing: -0.5px;
            }
            
            .chat-welcome-subtitle {
                font-size: 18px;
                color: #64748b;
                line-height: 1.6;
                font-weight: 300;
            }
            
            /* Messages */
            .chat-message {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                font-size: 16px;
                line-height: 1.4;
                animation: chatMessageSlideIn 0.3s ease;
                word-wrap: break-word;
                position: relative;
            }
            
            .chat-user-message {
                align-self: flex-end;
                background: #0ea5e9;
                color: white;
                border-bottom-right-radius: 4px;
            }
            
            .chat-ai-message {
                align-self: flex-start;
                background: #f1f5f9;
                color: #1e293b;
                border-bottom-left-radius: 4px;
            }
            
            .chat-message.typing {
                background: #f1f5f9;
                padding: 16px 20px;
            }
            
            .chat-message-time {
                font-size: 11px;
                opacity: 0.7;
                margin-top: 4px;
                text-align: inherit;
            }
            
            .chat-message-status {
                font-size: 10px;
                opacity: 0.7;
                margin-top: 2px;
                text-align: right;
            }
            
            .chat-message-status.sending {
                color: #f59e0b;
            }
            
            .chat-message-status.sent {
                color: #10b981;
            }
            
            .chat-message-status.failed {
                color: #ef4444;
            }
            
            /* Typing Indicator */
            .chat-typing-indicator {
                display: flex;
                gap: 4px;
                padding: 10px 0;
            }
            
            .chat-typing-indicator span {
                width: 8px;
                height: 8px;
                background: #94a3b8;
                border-radius: 50%;
                animation: chatTypingBounce 1.4s infinite ease-in-out;
            }
            
            .chat-typing-indicator span:nth-child(1) {
                animation-delay: -0.32s;
            }
            
            .chat-typing-indicator span:nth-child(2) {
                animation-delay: -0.16s;
            }
            
            /* Input Area */
            .chat-input-area {
                height: 70px;
                padding: 0 20px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                gap: 12px;
                background: white;
                flex-shrink: 0;
                z-index: 10;
            }
            
            .chat-input {
                flex: 1;
                height: 48px;
                border: 1px solid #e2e8f0;
                border-radius: 24px;
                padding: 0 20px;
                font-size: 16px;
                font-family: inherit;
                color: #1e293b;
                background: #f8fafc;
                transition: all 0.2s;
                resize: none;
            }
            
            .chat-input:focus {
                outline: none;
                border-color: #0ea5e9;
                background: white;
                box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
            }
            
            .chat-input::placeholder {
                color: #94a3b8;
            }
            
            .chat-send-btn {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: none;
                background: #0ea5e9;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            
            .chat-send-btn:hover:not(:disabled) {
                background: #0284c7;
                transform: translateY(-1px);
            }
            
            .chat-send-btn:active:not(:disabled) {
                transform: translateY(0);
            }
            
            .chat-send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            /* User Info */
            .chat-user-info {
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 100;
            }
            
            .chat-user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #0ea5e9;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 18px;
                user-select: none;
            }
            
            .chat-logout-btn {
                background: none;
                border: none;
                color: #0ea5e9;
                cursor: pointer;
                font-size: 14px;
                padding: 5px 10px;
                border-radius: 5px;
                transition: all 0.2s;
            }
            
            .chat-logout-btn:hover {
                background: #f0f9ff;
            }
            
            /* Menu */
            .chat-menu {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 100;
            }
            
            .chat-menu.active {
                display: flex;
            }
            
            .chat-menu-content {
                max-width: 300px;
                padding: 40px;
                text-align: center;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            }
            
            .chat-menu-close {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                border: none;
                background: none;
                font-size: 24px;
                color: #0ea5e9;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.2s;
            }
            
            .chat-menu-close:hover {
                background: #f1f5f9;
            }
            
            .chat-menu-title {
                font-size: 28px;
                color: #0ea5e9;
                margin-bottom: 12px;
                font-weight: 300;
            }
            
            .chat-menu-subtitle {
                color: #64748b;
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 20px;
            }
            
            .chat-user-details {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
            }
            
            /* Connection Status */
            .chat-connection-status {
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                z-index: 1000;
                backdrop-filter: blur(10px);
                animation: chatStatusSlideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .chat-connection-status.online {
                background: rgba(16, 185, 129, 0.9);
                color: white;
            }
            
            .chat-connection-status.offline {
                background: rgba(239, 68, 68, 0.9);
                color: white;
            }
            
            /* Animations */
            @keyframes chatMessageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes chatTypingBounce {
                0%, 80%, 100% {
                    transform: scale(0);
                }
                40% {
                    transform: scale(1);
                }
            }
            
            @keyframes chatStatusSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            /* Scrollbar */
            .chat-messages-area::-webkit-scrollbar {
                width: 4px;
            }
            
            .chat-messages-area::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .chat-messages-area::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 2px;
            }
            
            .chat-messages-area::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .chat-top-bar {
                    height: 56px;
                    padding: 0 16px;
                }
                
                .chat-title {
                    font-size: 20px;
                }
                
                .chat-messages-area {
                    padding: 16px;
                }
                
                .chat-welcome-title {
                    font-size: 28px;
                }
                
                .chat-welcome-subtitle {
                    font-size: 16px;
                }
                
                .chat-input-area {
                    height: 64px;
                    padding: 0 16px;
                }
                
                .chat-input {
                    height: 44px;
                    font-size: 15px;
                }
                
                .chat-send-btn {
                    width: 44px;
                    height: 44px;
                    font-size: 18px;
                }
                
                .chat-user-info {
                    top: 16px;
                    right: 16px;
                }
                
                .chat-user-avatar {
                    width: 36px;
                    height: 36px;
                    font-size: 16px;
                }
            }
            
            @media (max-width: 480px) {
                .chat-message {
                    max-width: 90%;
                    font-size: 15px;
                    padding: 10px 14px;
                }
                
                .chat-welcome-content {
                    padding: 20px;
                }
                
                .chat-welcome-title {
                    font-size: 24px;
                }
                
                .chat-welcome-subtitle {
                    font-size: 15px;
                }
            }
            
            /* Dark Theme */
            .theme-dark .chat-container {
                background: #0f172a;
            }
            
            .theme-dark .chat-top-bar {
                background: #1e293b;
                border-bottom-color: #334155;
            }
            
            .theme-dark .chat-messages-area {
                background: #0f172a;
            }
            
            .theme-dark .chat-welcome-screen {
                background: #0f172a;
            }
            
            .theme-dark .chat-title {
                color: #38bdf8;
            }
            
            .theme-dark .chat-menu-btn,
            .theme-dark .chat-info-btn {
                color: #38bdf8;
            }
            
            .theme-dark .chat-menu-btn:hover,
            .theme-dark .chat-info-btn:hover {
                background: #1e293b;
            }
            
            .theme-dark .chat-ai-message {
                background: #1e293b;
                color: #e2e8f0;
            }
            
            .theme-dark .chat-input-area {
                background: #1e293b;
                border-top-color: #334155;
            }
            
            .theme-dark .chat-input {
                background: #0f172a;
                border-color: #334155;
                color: #e2e8f0;
            }
            
            .theme-dark .chat-input:focus {
                border-color: #38bdf8;
                background: #0f172a;
                box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
            }
            
            .theme-dark .chat-input::placeholder {
                color: #64748b;
            }
            
            .theme-dark .chat-menu {
                background: rgba(15, 23, 42, 0.95);
            }
            
            .theme-dark .chat-menu-content {
                background: #1e293b;
                color: #e2e8f0;
            }
            
            .theme-dark .chat-menu-title {
                color: #38bdf8;
            }
            
            .theme-dark .chat-menu-subtitle {
                color: #94a3b8;
            }
            
            .theme-dark .chat-user-details {
                border-top-color: #334155;
            }
            
            .theme-dark .chat-messages-area::-webkit-scrollbar-thumb {
                background: #475569;
            }
        `
    }
    
    setupTheme() {
        // Check for saved theme
        const savedTheme = localStorage.getItem('calm_theme') || 'light'
        this.setTheme(savedTheme)
        
        // Listen for theme changes
        window.addEventListener('theme-change', (e) => {
            this.setTheme(e.detail.theme)
        })
    }
    
    setTheme(theme) {
        this.theme = theme
        
        // Update body class
        document.body.className = document.body.className
            .replace(/theme-\w+/g, '')
            .trim() + ` theme-${theme}`
        
        // Save to localStorage
        localStorage.setItem('calm_theme', theme)
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme }
        }))
    }
    
    setupResponsive() {
        // Handle viewport changes
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768
            document.body.classList.toggle('is-mobile', isMobile)
        }
        
        handleResize()
        window.addEventListener('resize', handleResize)
    }
    
    // UI Component Creation Methods
    
    createChatContainer() {
        const container = document.createElement('div')
        container.className = 'chat-container'
        
        // Create top bar
        const topBar = this.createTopBar()
        container.appendChild(topBar)
        
        // Create messages area
        const messagesArea = this.createMessagesArea()
        container.appendChild(messagesArea)
        
        // Create input area
        const inputArea = this.createInputArea()
        container.appendChild(inputArea)
        
        return container
    }
    
    createTopBar() {
        const topBar = document.createElement('div')
        topBar.className = 'chat-top-bar'
        
        // Menu button
        const menuBtn = document.createElement('button')
        menuBtn.className = 'chat-menu-btn'
        menuBtn.setAttribute('aria-label', 'Menu')
        menuBtn.innerHTML = `
            <div class="chat-menu-icon">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `
        topBar.appendChild(menuBtn)
        
        // Title
        const title = document.createElement('div')
        title.className = 'chat-title'
        title.textContent = 'Calm'
        topBar.appendChild(title)
        
        // Info button
        const infoBtn = document.createElement('button')
        infoBtn.className = 'chat-info-btn'
        infoBtn.setAttribute('aria-label', 'Info')
        infoBtn.innerHTML = 'ℹ️'
        topBar.appendChild(infoBtn)
        
        return topBar
    }
    
    createMessagesArea() {
        const area = document.createElement('div')
        area.className = 'chat-messages-area'
        
        // Welcome screen (initially visible)
        const welcomeScreen = this.createWelcomeScreen()
        area.appendChild(welcomeScreen)
        
        return area
    }
    
    createWelcomeScreen() {
        const screen = document.createElement('div')
        screen.id = 'chatWelcomeScreen'
        screen.className = 'chat-welcome-screen'
        
        const content = document.createElement('div')
        content.className = 'chat-welcome-content'
        content.innerHTML = `
            <h1 class="chat-welcome-title">A Calm Place To Think And Talk</h1>
            <p class="chat-welcome-subtitle">Send a message<br>eg. Hello</p>
        `
        
        screen.appendChild(content)
        return screen
    }
    
    createInputArea() {
        const area = document.createElement('div')
        area.className = 'chat-input-area'
        
        // Input field
        const input = document.createElement('input')
        input.id = 'chatInput'
        input.className = 'chat-input'
        input.type = 'text'
        input.placeholder = 'Type your message...'
        input.setAttribute('autocomplete', 'off')
        
        // Send button
        const sendBtn = document.createElement('button')
        sendBtn.id = 'chatSendBtn'
        sendBtn.className = 'chat-send-btn'
        sendBtn.setAttribute('aria-label', 'Send message')
        sendBtn.innerHTML = '✉️'
        
        area.appendChild(input)
        area.appendChild(sendBtn)
        
        return area
    }
    
    createUserInfo() {
        const container = document.createElement('div')
        container.className = 'chat-user-info'
        
        // Avatar
        const avatar = document.createElement('div')
        avatar.id = 'chatUserAvatar'
        avatar.className = 'chat-user-avatar'
        avatar.textContent = 'U'
        
        // Logout button
        const logoutBtn = document.createElement('button')
        logoutBtn.id = 'chatLogoutBtn'
        logoutBtn.className = 'chat-logout-btn'
        logoutBtn.textContent = 'Logout'
        
        container.appendChild(avatar)
        container.appendChild(logoutBtn)
        
        return container
    }
    
    createMenu() {
        const menu = document.createElement('div')
        menu.id = 'chatMenu'
        menu.className = 'chat-menu'
        
        const content = document.createElement('div')
        content.className = 'chat-menu-content'
        content.innerHTML = `
            <button class="chat-menu-close" aria-label="Close menu">×</button>
            <h2 class="chat-menu-title">Calm</h2>
            <p class="chat-menu-subtitle">Just talk. Nothing else.</p>
            <div id="chatUserDetails" class="chat-user-details"></div>
        `
        
        menu.appendChild(content)
        return menu
    }
    
    createMessageElement(message) {
        const div = document.createElement('div')
        div.className = `chat-message ${message.sender === 'user' ? 'chat-user-message' : 'chat-ai-message'}`
        
        if (message.isTyping) {
            div.classList.add('typing')
            div.innerHTML = `
                <div class="chat-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `
        } else {
            div.textContent = message.content
            
            // Add timestamp
            if (message.timestamp) {
                const time = new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })
                
                const timeSpan = document.createElement('span')
                timeSpan.className = 'chat-message-time'
                timeSpan.textContent = time
                div.appendChild(timeSpan)
            }
        }
        
        // Add status for user messages
        if (message.sender === 'user' && message.status) {
            const statusSpan = document.createElement('span')
            statusSpan.className = `chat-message-status ${message.status}`
            statusSpan.textContent = this.getStatusText(message.status)
            div.appendChild(statusSpan)
        }
        
        return div
    }
    
    getStatusText(status) {
        switch (status) {
            case 'sending': return 'Sending...'
            case 'sent': return '✓ Sent'
            case 'failed': return '✗ Failed'
            default: return ''
        }
    }
    
    createConnectionStatus(isOnline) {
        const status = document.createElement('div')
        status.className = `chat-connection-status ${isOnline ? 'online' : 'offline'}`
        status.innerHTML = `
            ${isOnline ? '🟢' : '🔴'}
            ${isOnline ? 'Connected' : 'Disconnected'}
        `
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (status.parentNode) {
                status.remove()
            }
        }, 3000)
        
        return status
    }
    
    // Utility Methods
    
    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('chatWelcomeScreen')
        if (welcomeScreen) {
            welcomeScreen.classList.remove('hidden', 'blurred')
        }
    }
    
    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('chatWelcomeScreen')
        if (welcomeScreen) {
            welcomeScreen.classList.add('blurred')
            
            setTimeout(() => {
                welcomeScreen.classList.add('hidden')
            }, 800)
        }
    }
    
    toggleMenu() {
        const menu = document.getElementById('chatMenu')
        if (menu) {
            menu.classList.toggle('active')
        }
    }
    
    closeMenu() {
        const menu = document.getElementById('chatMenu')
        if (menu) {
            menu.classList.remove('active')
        }
    }
    
    updateUserAvatar(username) {
        const avatar = document.getElementById('chatUserAvatar')
        if (avatar && username) {
            avatar.textContent = username.charAt(0).toUpperCase()
            
            // Set random color
            const colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]
            avatar.style.backgroundColor = randomColor
        }
    }
    
    updateUserDetails(user) {
        const details = document.getElementById('chatUserDetails')
        if (details && user) {
            const username = user.user_metadata?.username || user.email.split('@')[0]
            
            details.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <div style="font-weight: 500; color: #1e293b; margin-bottom: 5px;">${username}</div>
                    <div style="font-size: 14px; color: #64748b;">${user.email}</div>
                </div>
                <div style="font-size: 12px; color: #94a3b8;">
                    <div>Active now</div>
                    <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                        <button id="clearChatBtn" style="
                            padding: 8px 12px;
                            background: #f1f5f9;
                            color: #64748b;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                        ">
                            Clear Chat History
                        </button>
                        <button id="themeToggleBtn" style="
                            padding: 8px 12px;
                            background: #f1f5f9;
                            color: #64748b;
                            border: none;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                        ">
                            ${this.theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                        </button>
                    </div>
                </div>
            `
                       
            // Add event listeners
            setTimeout(() => {
                const clearBtn = document.getElementById('clearChatBtn')
                const themeBtn = document.getElementById('themeToggleBtn')
                
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        this.handleClearChat()
                    })
                }
                
                if (themeBtn) {
                    themeBtn.addEventListener('click', () => {
                        this.toggleTheme()
                    })
                }
            }, 100)
        }
    }
    
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light'
        this.setTheme(newTheme)
        showMessage(`${newTheme === 'light' ? 'Light' : 'Dark'} mode enabled`, 'info')
    }
    
    handleClearChat() {
        showConfirm('Clear all chat history? This action cannot be undone.', {
            confirmText: 'Clear',
            cancelText: 'Cancel',
            onConfirm: () => {
                window.dispatchEvent(new CustomEvent('clear-chat-history'))
                showMessage('Chat history cleared', 'success')
                this.closeMenu()
            }
        })
    }
    
    // Public Methods
    
    setupUI() {
        // Get or create main container
        let container = document.querySelector('.chat-container')
        if (!container) {
            container = this.createChatContainer()
            document.body.appendChild(container)
        }
        
        // Add user info
        const userInfo = this.createUserInfo()
        document.body.appendChild(userInfo)
        
        // Add menu
        const menu = this.createMenu()
        document.body.appendChild(menu)
        
        // Setup event listeners for UI components
        this.setupUIEventListeners()
        
        return {
            container,
            elements: {
                input: document.getElementById('chatInput'),
                sendBtn: document.getElementById('chatSendBtn'),
                welcomeScreen: document.getElementById('chatWelcomeScreen'),
                messagesArea: document.querySelector('.chat-messages-area'),
                menuBtn: document.querySelector('.chat-menu-btn'),
                infoBtn: document.querySelector('.chat-info-btn'),
                menuClose: document.querySelector('.chat-menu-close'),
                logoutBtn: document.getElementById('chatLogoutBtn'),
                userAvatar: document.getElementById('chatUserAvatar')
            }
        }
    }
    
    setupUIEventListeners() {
        // Menu button
        const menuBtn = document.querySelector('.chat-menu-btn')
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.toggleMenu())
        }
        
        // Menu close button
        const menuClose = document.querySelector('.chat-menu-close')
        if (menuClose) {
            menuClose.addEventListener('click', () => this.closeMenu())
        }
        
        // Close menu on outside click
        const menu = document.getElementById('chatMenu')
        if (menu) {
            menu.addEventListener('click', (e) => {
                if (e.target === menu) {
                    this.closeMenu()
                }
            })
        }
        
        // Info button
        const infoBtn = document.querySelector('.chat-info-btn')
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('show-info'))
            })
        }
        
        // Logout button
        const logoutBtn = document.getElementById('chatLogoutBtn')
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('logout-requested'))
            })
        }
    }
    
    addMessageToUI(message) {
        const messagesArea = document.querySelector('.chat-messages-area')
        if (!messagesArea) return
        
        const messageElement = this.createMessageElement(message)
        messagesArea.appendChild(messageElement)
        
        // Scroll to bottom
        this.scrollToBottom()
    }
    
    scrollToBottom() {
        const messagesArea = document.querySelector('.chat-messages-area')
        if (messagesArea) {
            messagesArea.scrollTop = messagesArea.scrollHeight
        }
    }
    
    showConnectionStatusUI(isOnline) {
        const existingStatus = document.querySelector('.chat-connection-status')
        if (existingStatus) {
            existingStatus.remove()
        }
        
        const status = this.createConnectionStatus(isOnline)
        document.body.appendChild(status)
    }
}

// Create and export singleton instance
const chatUI = new ChatUI()

// Export for use in other files
export { ChatUI }
export default chatUI