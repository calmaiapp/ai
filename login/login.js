import { signIn, getSession } from '../utils/auth.js'

// Global error handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error)
        showMessage('Error: ' + e.error.message, 'error')
    })
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm')
    const loginBtn = document.getElementById('loginBtn')
    const loadingOverlay = document.getElementById('loadingOverlay')
    const googleBtn = document.querySelector('.social-btn.google')
    
    // Update label to show "Username or Email"
    const emailLabel = document.querySelector('label[for="email"]')
    if (emailLabel) {
        emailLabel.textContent = 'Username or Email'
    }
    
    // Update placeholder
    const emailInput = document.getElementById('email')
    if (emailInput) {
        emailInput.placeholder = 'Enter username or email'
    }
    
    // Check if user is already logged in
    checkAuthStatus()
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault()
            
            const identifier = document.getElementById('email').value.trim()
            const password = document.getElementById('password').value
            const rememberMe = document.getElementById('remember').checked
            
            // Validate inputs
            if (!identifier || !password) {
                showMessage('Please fill in all fields', 'error')
                return
            }
            
            // Show loading
            loginBtn.disabled = true
            loadingOverlay.classList.add('active')
            
            // Sign in with username or email
            const result = await signIn(identifier, password)
            
            // Hide loading
            loginBtn.disabled = false
            loadingOverlay.classList.remove('active')
            
            if (result.success) {
                showMessage('Login successful! Redirecting...', 'success')
                
                // Store remember me preference
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true')
                } else {
                    localStorage.removeItem('rememberMe')
                }
                
                // Redirect to HOME page after 1.5 seconds
                setTimeout(() => {
                    window.location.href = '/ai/home/index.html'
                }, 1500)
            } else {
                showMessage(result.error || 'Login failed. Please try again.', 'error')
            }
        })
    }
    
    // Google login button - Coming Soon
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            showMessage('Google login coming soon!', 'info')
        })
    }
})

// Check authentication status
async function checkAuthStatus() {
    try {
        const sessionResult = await getSession()
        
        if (sessionResult.success && sessionResult.session) {
            // User is already logged in, redirect to HOME page
            window.location.href = '/ai/home/index.html'
        }
    } catch (error) {
        console.log('Auth check error:', error)
    }
}

// Show message function
function showMessage(message, type) {
    // Remove any existing message
    const existingMsg = document.querySelector('.message-alert')
    if (existingMsg) existingMsg.remove()
    
    // Create message element
    const msgEl = document.createElement('div')
    msgEl.className = `message-alert ${type}`
    msgEl.textContent = message
    
    // Add styles
    msgEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideDown 0.3s ease;
        max-width: 90%;
        text-align: center;
    `
    
    // Set colors based on type
    if (type === 'success') {
        msgEl.style.backgroundColor = '#10b981'
    } else if (type === 'error') {
        msgEl.style.backgroundColor = '#ef4444'
    } else {
        msgEl.style.backgroundColor = '#0ea5e9'
    }
    
    // Add animation
    const style = document.createElement('style')
    style.textContent = `
        @keyframes slideDown {
            from { top: -50px; opacity: 0; }
            to { top: 20px; opacity: 1; }
        }
    `
    document.head.appendChild(style)
    
    document.body.appendChild(msgEl)
    
    // Remove message after 3 seconds
    setTimeout(() => {
        if (msgEl.parentNode) {
            msgEl.style.animation = 'slideUp 0.3s ease'
            
            // Add slideUp animation
            const slideUpStyle = document.createElement('style')
            slideUpStyle.textContent = `
                @keyframes slideUp {
                    from { top: 20px; opacity: 1; }
                    to { top: -50px; opacity: 0; }
                }
            `
            document.head.appendChild(slideUpStyle)
            
            setTimeout(() => {
                if (msgEl.parentNode) {
                    msgEl.remove()
                }
            }, 300)
        }
    }, 3000)
}
