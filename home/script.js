import { getCurrentUser, signOut } from '/ai/utils/auth-core.js'
import { showMessage, showError } from '/ai/components/messages.js'
import chatCore from '/ai/home/chat-core.js'
import chatUI from '/ai/home/chat-ui.js'

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check authentication first
        const authResult = await getCurrentUser()
        
        if (!authResult.success || !authResult.user) {
            // Not authenticated, redirect to login
            showMessage('Please login to continue', 'error')
            setTimeout(() => {
                window.location.href = '/ai/login/index.html'
            }, 1500)
            return
        }
        
        // Initialize chat UI
        const ui = chatUI.setupUI()
        
        // Initialize chat core
        await chatCore.start()
        
        // Setup event listeners for UI
        setupEventListeners(ui.elements, authResult.user)
        
        // Update user info
        updateUserInfo(authResult.user)
        
    } catch (error) {
        console.error('Home initialization error:', error)
        showError('Failed to initialize chat')
        
        // Fallback to login
        setTimeout(() => {
            window.location.href = '/ai/login/index.html'
        }, 2000)
    }
})

function setupEventListeners(elements, user) {
    if (!elements) return
    
    // Send message
    if (elements.sendBtn && elements.input) {
        elements.sendBtn.addEventListener('click', () => sendMessage(elements.input))
        elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(elements.input)
            }
        })
    }
    
    // Menu toggle
    if (elements.menuBtn) {
        elements.menuBtn.addEventListener('click', () => {
            chatUI.toggleMenu()
            // Update user details in menu
            updateUserDetails(user)
        })
    }
    
    // Info button
    if (elements.infoBtn) {
        elements.infoBtn.addEventListener('click', () => {
            showInfoMessage()
        })
    }
    
    // Menu close
    if (elements.menuClose) {
        elements.menuClose.addEventListener('click', () => {
            chatUI.closeMenu()
        })
    }
    
    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout)
    }
    
    // Listen for custom events
    window.addEventListener('show-info', showInfoMessage)
    window.addEventListener('logout-requested', handleLogout)
    window.addEventListener('clear-chat-history', () => {
        chatCore.clearHistory()
    })
}

async function sendMessage(inputElement) {
    if (!inputElement) return
    
    const text = inputElement.value.trim()
    if (!text) return
    
    try {
        // Clear input
        inputElement.value = ''
        
        // Send message via chat core
        await chatCore.sendMessage(text)
        
    } catch (error) {
        console.error('Send message error:', error)
        showError('Failed to send message')
        
        // Restore message if sending failed
        inputElement.value = text
        inputElement.focus()
    }
}

function updateUserInfo(user) {
    if (!user) return
    
    const username = user.user_metadata?.username || user.email.split('@')[0]
    const avatar = document.getElementById('userAvatar')
    
    if (avatar) {
        avatar.textContent = username.charAt(0).toUpperCase()
        
        // Set random background color
        const colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        avatar.style.backgroundColor = randomColor
    }
    
    // Update chat UI user info
    chatUI.updateUserAvatar(username)
}

function updateUserDetails(user) {
    const detailsElement = document.getElementById('userDetails')
    if (!detailsElement || !user) return
    
    const username = user.user_metadata?.username || user.email.split('@')[0]
    
    detailsElement.innerHTML = `
        <div style="margin-bottom: 15px;">
            <div style="font-weight: 500; color: #1e293b; margin-bottom: 5px;">${username}</div>
            <div style="font-size: 14px; color: #64748b;">${user.email}</div>
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
            clearChatBtn.addEventListener('click', () => {
                showMessage('Clear chat history? This will reload the page.', 'warning')
                setTimeout(() => {
                    chatCore.clearHistory()
                }, 2000)
            })
        }
    }, 100)
}

async function handleLogout() {
    try {
        const result = await signOut()
        if (result.success) {
            showMessage('Signed out successfully', 'success')
            setTimeout(() => {
                window.location.href = '/ai/index.html'
            }, 1500)
        } else {
            showError('Logout failed: ' + result.error)
        }
    } catch (error) {
        showError('Logout error: ' + error.message)
    }
}

function showInfoMessage() {
    const infoMessage = "This is Calm. A peaceful place to think and talk. Just type what's on your mind."
    
    // Add as a system message
    const messagesContainer = document.getElementById('messagesContainer')
    if (messagesContainer) {
        const messageDiv = document.createElement('div')
        messageDiv.className = 'message response-message'
        messageDiv.textContent = infoMessage
        messageDiv.style.cssText = `
            align-self: center;
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
            font-style: italic;
            max-width: 90%;
            text-align: center;
        `
        messagesContainer.appendChild(messageDiv)
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
}

// Export functions for chat-core.js to use
window.chatUI = chatUI
window.chatCore = chatCore
