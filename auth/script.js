import { signUp, signInWithGoogle } from '../utils/auth.js'

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
})

// Setup Google Signup
function setupGoogleSignup() {
    const googleBtn = document.querySelector('.social-btn.google')
    if (googleBtn) {
        googleBtn.addEventListener('click', async function() {
            googleBtn.disabled = true
            const result = await signInWithGoogle()
            
            if (!result.success) {
                googleBtn.disabled = false
                showMessage('Google signup failed: ' + result.error, 'error')
            }
        })
    }
}

// Update setupSignupForm function
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
}
