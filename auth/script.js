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
    setupGoogleSignup()
    setupTermsModals()
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
    
    // Add username field dynamically if not exists
    const formGroup = document.querySelector('.form-group:first-child')
    if (formGroup && !document.getElementById('username')) {
        const usernameHtml = `
            <div class="form-group">
                <label for="username">Username</label>
                <input 
                    type="text" 
                    id="username" 
                    name="username"
                    placeholder="Choose a username"
                    required
                    autocomplete="username"
                >
                <div class="password-hint">
                    <span>This will be used to log in</span>
                </div>
            </div>
        `
        formGroup.insertAdjacentHTML('afterend', usernameHtml)
    }
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault()
        
        const name = document.getElementById('signupName').value.trim()
        const email = document.getElementById('signupEmail').value.trim()
        const username = document.getElementById('username').value.trim()
        const password = document.getElementById('signupPassword').value
        const confirmPassword = document.getElementById('confirmPassword').value
        const terms = document.getElementById('terms').checked
        
        // Validate inputs
        if (!name || !email || !username || !password || !confirmPassword) {
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
        
        // Sign up with username
        const result = await signUp(email, password, name, username)
        
        // Hide loading
        signupBtn.disabled = false
        loadingOverlay.classList.remove('active')
        
        if (result.success) {
            showMessage('Account created successfully! Redirecting...', 'success')
            
            // Redirect to HOME page after 2 seconds
            setTimeout(() => {
                window.location.href = '/ai/home/index.html'
            }, 2000)
        } else {
            showMessage(result.error || 'Signup failed. Please try again.', 'error')
        }
    })
    
    // Google signup button - Coming Soon
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

// Setup
