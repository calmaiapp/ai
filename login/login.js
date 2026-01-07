import { signIn, getSession, signInWithGoogle } from '../utils/auth.js'

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
    
    // Google login button
    if (googleBtn) {
        googleBtn.addEventListener('click', async function() {
            googleBtn.disabled = true
            const result = await signInWithGoogle()
            
            if (!result.success) {
                googleBtn.disabled = false
                showMessage('Google login failed: ' + result.error, 'error')
            }
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

// Show message function (keep existing)
function showMessage(message, type) {
    // ... existing showMessage code ...
}
