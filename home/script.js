import { getUser, signOut, getSession } from '../utils/auth.js'

// Auth check
async function checkAuth() {
    const result = await getSession()
    if (!result.success || !result.session) {
        // Not logged in, redirect to login
        window.location.href = '/ai/login/index.html'
        return null
    }
    
    const userResult = await getUser()
    if (userResult.success && userResult.user) {
        return userResult.user
    }
    return null
}

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const user = await checkAuth()
    if (!user) return
    
    // Update user info
    updateUserInfo(user)
    
    // Elements
    const welcomeScreen = document.getElementById('welcomeScreen');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const menuBtn = document.querySelector('.menu-btn');
    const infoBtn = document.querySelector('.info-btn');
    const simpleMenu = document.getElementById('simpleMenu');
    const menuClose = document.getElementById('menuClose');
    const logoutBtn = document.getElementById('logoutBtn');
    const userDetails = document.getElementById('userDetails');
    
    let firstMessageSent = false;
    
    // Update user details in menu
    if (userDetails) {
        userDetails.innerHTML = `
            <p><strong>Username:</strong> ${user.user_metadata?.username || user.email.split('@')[0]}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><small>Logged in</small></p>
        `
    }
    
    // Simple responses
    const getSimpleResponse = () => {
        const responses = [
            "I'm here.",
            "Hello.",
            "Hi.",
            "Hey.",
            "What's on your mind?",
            "Tell me more.",
            "Go on.",
            "Interesting.",
            "I'm listening.",
            "Okay.",
            "Yeah.",
            "Right.",
            "Sure.",
            "Absolutely.",
            "Got it.",
            "Understand.",
            "Continue.",
            "And?",
            "Then?",
            "So?"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };
    
    // Send message
    const sendMessage = () => {
        const text = messageInput.value.trim();
        if (!text) return;
        
        // First message ever
        if (!firstMessageSent) {
            firstMessageSent = true;
            
            // Start transition effect
            welcomeScreen.classList.add('blurred');
            
            // After blur animation, hide welcome screen
            setTimeout(() => {
                welcomeScreen.classList.add('hidden');
                
                // Show messages container
                setTimeout(() => {
                    messagesContainer.style.display = 'flex';
                }, 100);
            }, 800);
        }
        
        // Add user message
        addMessage(text, 'user');
        
        // Clear input
        messageInput.value = '';
        
        // Focus back on input
        messageInput.focus();
        
        // Simple random delay for response
        setTimeout(() => {
            addMessage(getSimpleResponse(), 'response');
        }, 300 + Math.random() * 700);
    };
    
    // Add message to container
    const addMessage = (text, type) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type === 'user' ? 'user-message' : 'response-message'}`;
        messageDiv.textContent = text;
        
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    
    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Menu button
    menuBtn.addEventListener('click', () => {
        simpleMenu.classList.add('active');
    });
    
    // Info button
    infoBtn.addEventListener('click', () => {
        addMessage("This is Calm. Just type. Nothing else.", 'response');
    });
    
    // Close menu
    menuClose.addEventListener('click', () => {
        simpleMenu.classList.remove('active');
    });
    
    // Close menu by clicking outside
    simpleMenu.addEventListener('click', (e) => {
        if (e.target === simpleMenu) {
            simpleMenu.classList.remove('active');
        }
    });
    
    // Logout button
    logoutBtn.addEventListener('click', async () => {
        const result = await signOut()
        if (result.success) {
            window.location.href = '/ai/index.html'
        } else {
            alert('Logout failed: ' + result.error)
        }
    })
    
    // Focus input on load
    messageInput.focus();
    
    // Auto-response if user is idle for 30 seconds
    let idleTimer;
    const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        if (firstMessageSent) {
            idleTimer = setTimeout(() => {
                if (messagesContainer.children.length > 0) {
                    addMessage("Still there?", 'response');
                }
            }, 30000); // 30 seconds
        }
    };
    
    // Reset timer on any interaction
    ['keydown', 'mousedown', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetIdleTimer);
    });
    
    // Start idle timer
    resetIdleTimer();
});

// Update user info in top right
function updateUserInfo(user) {
    const userAvatar = document.getElementById('userAvatar')
    const username = user.user_metadata?.username || user.email.split('@')[0]
    
    if (userAvatar) {
        userAvatar.textContent = username.charAt(0).toUpperCase()
        
        // Set random background color
        const colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        userAvatar.style.backgroundColor = randomColor
    }
}
