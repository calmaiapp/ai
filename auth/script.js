import { signUp } from '../utils/auth.js'

// Global error handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error)
        showMessage('Error: ' + e.error.message, 'error')
    })
}

document.addEventListener('DOMContentLoaded', function() {
    // Check URL for mode (signup or forgot password)
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('forgot') ? 'forgot' : 'signup'
    
    // Show appropriate form
    showForm(mode)
    
    // Setup form submissions
    setupSignupForm()
    setupForgotForm()
    setupBackButton()
})

// Show appropriate form based on mode
function showForm(mode) {
    const signupForm = document.getElementById('signupForm')
    const forgotForm = document.getElementById('forgotForm')
    const successMessage = document.getElementById('successMessage')
    
    if (mode === 'forgot') {
        if (signupForm) signupForm.style.display = 'none'
        if (forgotForm) forgotForm.style.display = 'block'
        if (successMessage) successMessage.style.display = 'none'
    } else {
        if (signupForm) signupForm.style.display = 'block'
        if (forgotForm) forgotForm.style.display = 'none'
        if (successMessage) successMessage.style.display = 'none'
    }
}

// Setup signup form
function setupSignupForm() {
    const signupForm = document.getElementById('signupFormElement')
    const signupBtn = document.getElementById('signupBtn')
    const loadingOverlay = document.getElementById('loadingOverlay')
    
    if (!signupForm) return
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault()
        
        const name = document.getElementById('signupName').value.trim()
        const email = document.getElementById('signupEmail').value.trim()
        const password = document.getElementById('signupPassword').value
        const confirmPassword = document.getElementById('confirmPassword').value
        const terms = document.getElementById('terms').checked
        
        // Validate inputs
        if (!name || !email || !password || !confirmPassword) {
            showMessage('Please fill in all fields', 'error')
            return
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error')
            return
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error')
            return
        }
        
        if (!terms) {
            showMessage('Please agree to the terms and conditions', 'error')
            return
        }
        
        // Show loading
        signupBtn.disabled = true
        loadingOverlay.classList.add('active')
        
        // Sign up
        const result = await signUp(email, password, name)
        
        // Hide loading
        signupBtn.disabled = false
        loadingOverlay.classList.remove('active')
        
        if (result.success) {
            showMessage('Account created successfully! Redirecting...', 'success')
            
            // Redirect to main page after 2 seconds
            setTimeout(() => {
                window.location.href = '../index.html'
            }, 2000)
        } else {
            showMessage(result.error || 'Signup failed. Please try again.', 'error')
        }
    })
    
    // Google signup button
    const googleBtn = document.querySelector('.social-btn.google')
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            showMessage('Google signup coming soon!', 'info')
        })
    }
}

// Setup forgot password form
function setupForgotForm() {
    const forgotForm = document.getElementById('forgotFormElement')
    const resetBtn = document.getElementById('resetBtn')
    const loadingOverlay = document.getElementById('loadingOverlay')
    
    if (!forgotForm) return
    
    forgotForm.addEventListener('submit', async function(e) {
        e.preventDefault()
        
        const email = document.getElementById('forgotEmail').value.trim()
        
        if (!email) {
            showMessage('Please enter your email address', 'error')
            return
        }
        
        // Show loading
        resetBtn.disabled = true
        loadingOverlay.classList.add('active')
        
        try {
            // Note: For password reset, you'll need to handle this properly
            // This is a simplified version
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            // Hide loading
            resetBtn.disabled = false
            loadingOverlay.classList.remove('active')
            
            // Show success message
            showSuccessMessage()
            
        } catch (error) {
            resetBtn.disabled = false
            loadingOverlay.classList.remove('active')
            showMessage('Failed to send reset email. Please try again.', 'error')
        }
    })
}

// Show success message for forgot password
function showSuccessMessage() {
    const signupForm = document.getElementById('signupForm')
    const forgotForm = document.getElementById('forgotForm')
    const successMessage = document.getElementById('successMessage')
    
    if (signupForm) signupForm.style.display = 'none'
    if (forgotForm) forgotForm.style.display = 'none'
    if (successMessage) successMessage.style.display = 'block'
}

// Setup back to login button
function setupBackButton() {
    const backToLoginBtn = document.getElementById('backToLogin')
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', function() {
            window.location.href = '../login/index.html'
        })
    }
}

// Show message function (same as login.js)
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
