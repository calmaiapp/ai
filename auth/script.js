import { signUp, updateSecurityQuestion } from '/ai/utils/auth-core.js'
import { showMessage } from '/ai/components/messages.js'
import { showTermsModal, showPrivacyModal } from '/ai/components/modals.js'
import { setupPasswordToggle } from '/ai/components/forms.js'

// Global error handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error)
        showMessage('Error: ' + (e.error?.message || 'Unknown error'), 'error')
    })
}

document.addEventListener('DOMContentLoaded', function() {
    // Setup form submissions
    setupSignupForm()
    setupGoogleSignup()
    setupTermsLinks()
    setupPasswordToggle('signupPassword')
})

// Setup signup form
function setupSignupForm() {
    const signupForm = document.getElementById('signupFormElement')
    const signupBtn = document.getElementById('signupBtn')
    const loadingOverlay = document.getElementById('loadingOverlay')
    
    if (!signupForm) return
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault()
        
        const email = document.getElementById('signupEmail').value.trim()
        const username = document.getElementById('username')?.value.trim()
        const password = document.getElementById('signupPassword').value
        const terms = document.getElementById('terms').checked
        
        // Validate inputs
        if (!email || !username || !password) {
            showMessage('Please fill in all required fields', 'error')
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
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            showMessage('Please enter a valid email address', 'error')
            return
        }
        
        // Validate username
        if (username.length < 3) {
            showMessage('Username must be at least 3 characters', 'error')
            return
        }
        
        if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
            showMessage('Username can only contain letters, numbers, dots, hyphens, and underscores', 'error')
            return
        }
        
        // Show loading
        signupBtn.disabled = true
        signupBtn.innerHTML = '<span>Creating Account...</span>'
        if (loadingOverlay) loadingOverlay.classList.add('active')
        
        // Sign up WITHOUT security question initially
        const result = await signUp(email, password, username)
        
        // Hide loading
        signupBtn.disabled = false
        signupBtn.innerHTML = '<span>Create Account</span><svg class="btn-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.6667 10H3.33337" stroke="white" stroke-width="1.5" stroke-linecap="round"/><path d="M11.6667 5L16.6667 10L11.6667 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        if (loadingOverlay) loadingOverlay.classList.remove('active')
        
        if (result.success) {
            if (result.autoLoggedIn) {
                // Show security setup modal after successful signup
                showSecuritySetupModal(username)
            } else {
                showMessage(result.message || 'Account created! Please login.', 'success')
                setTimeout(() => {
                    window.location.href = '/ai/login/index.html'
                }, 2000)
            }
        } else {
            if (result.rateLimited) {
                showMessage(result.error, 'error')
            } else if (result.duplicate) {
                showMessage('Username or email already exists. Please choose different ones.', 'error')
            } else {
                showMessage(result.error || 'Signup failed. Please try again.', 'error')
            }
        }
    })
}

// Show security setup modal AFTER account creation
function showSecuritySetupModal(username) {
    // Remove any existing modal
    const existingModal = document.getElementById('securitySetupModal')
    if (existingModal) existingModal.remove()
    
    const modalHTML = `
        <div class="modal-overlay active" id="securitySetupModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔒 Set Security Question</h2>
                </div>
                <div class="modal-body">
                    <p style="color: #64748b; margin-bottom: 20px;">
                        This will help you recover your password if you forget it.
                        <br><strong>You can skip, but password recovery will be impossible.</strong>
                    </p>
                    
                    <div id="securityForm">
                        <div class="form-group">
                            <label for="modalSecurityQuestion">Security Question</label>
                            <input 
                                type="text" 
                                id="modalSecurityQuestion" 
                                placeholder="e.g., What was your first pet's name?"
                                autocomplete="off"
                                style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;"
                            >
                        </div>
                        <div class="form-group">
                            <label for="modalSecurityAnswer">Answer</label>
                            <input 
                                type="text" 
                                id="modalSecurityAnswer" 
                                placeholder="Your answer (remember this!)"
                                autocomplete="off"
                                style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;"
                            >
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 25px;">
                            <button class="auth-btn" id="saveSecurityBtn" style="flex: 1; padding: 12px;">
                                Save & Continue
                            </button>
                            <button class="auth-btn secondary" id="skipSecurityBtn" style="flex: 1; padding: 12px; background: #f1f5f9; color: #0ea5e9;">
                                Skip for Now
                            </button>
                        </div>
                    </div>
                    
                    <div id="securitySuccess" style="display: none; text-align: center; padding: 20px 0;">
                        <div class="success-icon" style="margin: 20px auto;">
                            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                                <circle cx="30" cy="30" r="30" fill="#10b981" fill-opacity="0.1"/>
                                <path d="M20 30L27.5 37.5L40 25" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3 style="color: #10b981; margin-bottom: 10px;">Security Question Set!</h3>
                        <p style="color: #64748b;">Your account is now more secure. Redirecting to home...</p>
                    </div>
                </div>
            </div>
        </div>
    `
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML)
    
    // Add modal styles if not already present
    if (!document.querySelector('#securityModalStyles')) {
        const style = document.createElement('style')
        style.id = 'securityModalStyles'
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                animation: fadeIn 0.3s ease;
            }
            
            .modal-content {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 400px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                animation: slideUp 0.3s ease;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .modal-header h2 {
                margin: 0;
                font-size: 22px;
                font-weight: 400;
                color: #1e293b;
            }
            
            .modal-body {
                padding: 24px;
            }
            
            .modal-body .form-group {
                margin-bottom: 20px;
            }
            
            .modal-body .form-group label {
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: 500;
                color: #1e293b;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            /* Dark theme support */
            .theme-dark .modal-content {
                background: #1e293b;
                color: #f1f5f9;
            }
            
            .theme-dark .modal-header {
                border-bottom-color: #334155;
            }
            
            .theme-dark .modal-header h2 {
                color: #f1f5f9;
            }
            
            .theme-dark .modal-body .form-group label {
                color: #e2e8f0;
            }
            
            .theme-dark .modal-body input {
                background: #0f172a;
                border-color: #334155;
                color: #f1f5f9;
            }
            
            .theme-dark .modal-body input::placeholder {
                color: #64748b;
            }
            
            .theme-dark .auth-btn.secondary {
                background: #334155;
                color: #38bdf8;
            }
            
            .theme-dark .auth-btn.secondary:hover {
                background: #475569;
            }
        `
        document.head.appendChild(style)
    }
    
    // Setup modal events
    setupSecurityModalEvents(username)
}

// Setup security modal events
function setupSecurityModalEvents(username) {
    const saveBtn = document.getElementById('saveSecurityBtn')
    const skipBtn = document.getElementById('skipSecurityBtn')
    const modal = document.getElementById('securitySetupModal')
    
    // Save security question
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const question = document.getElementById('modalSecurityQuestion').value.trim()
            const answer = document.getElementById('modalSecurityAnswer').value.trim()
            
            if (!question || !answer) {
                showMessage('Please fill in both question and answer', 'error')
                return
            }
            
            if (question.length < 5) {
                showMessage('Please enter a proper security question', 'error')
                return
            }
            
            if (answer.length < 2) {
                showMessage('Answer should be at least 2 characters', 'error')
                return
            }
            
            saveBtn.disabled = true
            saveBtn.textContent = 'Saving...'
            
            // Call API to save security question
            const result = await updateSecurityQuestion(username, question, answer)
            
            if (result.success) {
                // Show success
                document.getElementById('securityForm').style.display = 'none'
                document.getElementById('securitySuccess').style.display = 'block'
                
                // Redirect to home after 2 seconds
                setTimeout(() => {
                    window.location.href = '/ai/home/index.html'
                }, 2000)
            } else {
                saveBtn.disabled = false
                saveBtn.textContent = 'Save & Continue'
                showMessage(result.error || 'Failed to save security question', 'error')
            }
        })
    }
    
    // Skip security question
    if (skipBtn) {
        skipBtn.addEventListener('click', function() {
            showMessage('Skipping security question. Redirecting...', 'info')
            
            // Close modal with animation
            if (modal) {
                modal.style.animation = 'fadeOut 0.3s ease'
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.remove()
                    }
                    
                    // Redirect to home
                    window.location.href = '/ai/home/index.html'
                }, 300)
            }
        })
    }
    
    // Close when clicking outside (but warn user)
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                showMessage('Please choose: Save or Skip security question', 'info')
            }
        })
    }
}

// Setup Google signup (Coming Soon)
function setupGoogleSignup() {
    const googleBtn = document.querySelector('.social-btn.google')
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            showMessage('Google signup coming soon!', 'info')
        })
    }
}

// Setup Terms and Privacy links
function setupTermsLinks() {
    // Terms button
    const termsLinks = document.querySelectorAll('a[href="#terms"]')
    termsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            showTermsModal()
        })
    })
    
    // Privacy button
    const privacyLinks = document.querySelectorAll('a[href="#privacy"]')
    privacyLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            showPrivacyModal()
        })
    })
}
