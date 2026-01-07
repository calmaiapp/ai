import { signUp } from '../utils/auth.js'

// Global error handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error)
        showMessage('Error: ' + e.error.message, 'error')
    })
}

document.addEventListener('DOMContentLoaded', function() {
    // Setup form submissions
    setupSignupForm()
    setupGoogleSignup()
    setupTermsModals()
    setupPasswordToggle()
    
    // Add security question section
    addSecurityQuestionSection()
})

// Add security question section to form
function addSecurityQuestionSection() {
    const form = document.getElementById('signupFormElement')
    if (!form) return
    
    // Insert after password field
    const passwordField = document.getElementById('signupPassword')
    if (passwordField) {
        const securityHtml = `
            <div class="security-question-section" style="margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 12px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #1e293b;">
                    🔒 Security Question (Optional)
                </h3>
                <p style="font-size: 14px; color: #64748b; margin-bottom: 15px;">
                    This will help you recover your password if you forget it.
                </p>
                <div class="form-group">
                    <label for="securityQuestion">Security Question</label>
                    <input 
                        type="text" 
                        id="securityQuestion" 
                        placeholder="e.g., What was your first pet's name?"
                        autocomplete="off"
                    >
                </div>
                <div class="form-group">
                    <label for="securityAnswer">Answer</label>
                    <input 
                        type="text" 
                        id="securityAnswer" 
                        placeholder="Your answer"
                        autocomplete="off"
                    >
                </div>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
                    You can skip this, but password recovery will be difficult.
                </p>
            </div>
        `
        passwordField.parentElement.insertAdjacentHTML('afterend', securityHtml)
    }
}

// Setup signup form
function setupSignupForm() {
    const signupForm = document.getElementById('signupFormElement')
    const signupBtn = document.getElementById('signupBtn')
    const loadingOverlay = document.getElementById('loadingOverlay')
    
    if (!signupForm) return
    
    // Remove Full Name field if exists
    const nameField = document.getElementById('signupName')
    if (nameField) {
        nameField.parentElement.style.display = 'none'
    }
    
    // Remove Confirm Password field if exists
    const confirmField = document.getElementById('confirmPassword')
    if (confirmField) {
        confirmField.parentElement.style.display = 'none'
    }
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault()
        
        const email = document.getElementById('signupEmail').value.trim()
        const username = document.getElementById('username')?.value.trim()
        const password = document.getElementById('signupPassword').value
        const securityQuestion = document.getElementById('securityQuestion')?.value.trim() || ''
        const securityAnswer = document.getElementById('securityAnswer')?.value.trim() || ''
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
        
        // Show loading
        signupBtn.disabled = true
        loadingOverlay.classList.add('active')
        
        // Sign up with username and security question
        const result = await signUp(email, password, username, securityQuestion, securityAnswer)
        
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

// Setup Google signup (Coming Soon)
function setupGoogleSignup() {
    const googleBtn = document.querySelector('.social-btn.google')
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            showMessage('Google signup coming soon!', 'info')
        })
    }
}

// Setup Terms and Privacy modals
function setupTermsModals() {
    // Terms button
    const termsLink = document.querySelector('a[href="#terms"]')
    if (termsLink) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault()
            showModal('terms')
        })
    }
    
    // Privacy button
    const privacyLink = document.querySelector('a[href="#privacy"]')
    if (privacyLink) {
        privacyLink.addEventListener('click', function(e) {
            e.preventDefault()
            showModal('privacy')
        })
    }
    
    // Create modals container
    const modalsHTML = `
        <div class="modals-container">
            <div class="modal-overlay" id="termsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📄 Terms & Conditions</h2>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <p style="font-size: 18px; margin-bottom: 20px; color: #0ea5e9;">
                            Welcome to Calm!
                        </p>
                        <p>By creating an account, you agree to these simple terms:</p>
                        
                        <h3>Your Account</h3>
                        <ul>
                            <li>You must be at least 13 years old to use Calm</li>
                            <li>Your username must be unique and appropriate</li>
                            <li>You are responsible for keeping your password secure</li>
                        </ul>
                        
                        <h3>Messaging Rules</h3>
                        <ul>
                            <li>Be respectful to all users</li>
                            <li>No harassment, bullying, or hate speech</li>
                            <li>No spam or unsolicited messages</li>
                            <li>Respect others' privacy</li>
                        </ul>
                        
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #d97706; margin-top: 0;">⚠️ Important Security Notice:</h4>
                            <p style="margin-bottom: 0;">
                                Your password cannot be recovered if forgotten. We don't store passwords 
                                in a way that allows recovery. Please write it down securely.
                            </p>
                        </div>
                        
                        <h3>Calm's Promise</h3>
                        <p>We provide a secure, simple platform for everyone to find peace and connect safely.</p>
                        
                        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #64748b;">
                            <p style="font-size: 14px;">
                                Last updated: January 2026 | App Version: 1.0
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-overlay" id="privacyModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🔒 Privacy Policy</h2>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <p style="font-size: 18px; margin-bottom: 20px; color: #0ea5e9;">
                            Your Privacy Matters
                        </p>
                        <p>At Calm, we believe in simple, transparent privacy.</p>
                        
                        <h3>What We Store</h3>
                        <ul>
                            <li>Username: Your chosen display name</li>
                            <li>Profile Information: Basic account details</li>
                            <li>Messages: Your meditation journey and conversations</li>
                            <li>Security Question: Only if you set one (encrypted)</li>
                        </ul>
                        
                        <h3>What We Don't Store</h3>
                        <ul style="color: #ef4444;">
                            <li>❌ Email addresses (only for login)</li>
                            <li>❌ Phone numbers</li>
                            <li>❌ Location data</li>
                            <li>❌ Contact lists</li>
                        </ul>
                        
                        <h3>Your Data is Yours</h3>
                        <ul>
                            <li>Messages are stored only as long as needed</li>
                            <li>We don't sell your data to anyone</li>
                            <li>We don't show ads</li>
                        </ul>
                        
                        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #0ea5e9; margin: 0;">
                                🔒 All data is encrypted and secured with Supabase. 
                                Your information is protected with industry-standard security measures.
                            </p>
                        </div>
                        
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #d97706; margin-top: 0;">🔐 Security First:</h4>
                            <p style="margin-bottom: 0;">
                                Calm is built with security in mind. Created to provide safe, 
                                private meditation and conversation space for everyone.
                            </p>
                        </div>
                        
                        <h3>Contact</h3>
                        <p>Questions? We're here to help make Calm safe for you.</p>
                        
                        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                            <p style="font-style: italic; color: #64748b;">
                                Privacy is not a feature – it's our foundation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalsHTML)
    
    // Add modal styles with animations
    const style = document.createElement('style')
    style.textContent = `
        .modals-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 2000;
        }
        
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2001;
            animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .modal-overlay.active {
            display: flex;
            pointer-events: auto;
        }
        
        .modal-content {
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: center bottom;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 28px;
            border-bottom: 1px solid #e2e8f0;
            position: sticky;
            top: 0;
            background: white;
            border-radius: 20px 20px 0 0;
            z-index: 10;
        }
        
        .modal-header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 400;
            color: #1e293b;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 32px;
            color: #64748b;
            cursor: pointer;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .modal-close:hover {
            background: #f1f5f9;
            color: #0ea5e9;
            transform: rotate(90deg);
        }
        
        .modal-body {
            padding: 28px;
        }
        
        .modal-body h3 {
            margin: 24px 0 12px 0;
            color: #1e293b;
            font-size: 18px;
            font-weight: 500;
        }
        
        .modal-body p {
            margin: 12px 0;
            line-height: 1.6;
            color: #475569;
        }
        
        .modal-body ul {
            margin: 12px 0;
            padding-left: 24px;
        }
        
        .modal-body li {
            margin: 8px 0;
            line-height: 1.5;
            color: #475569;
        }
        
        @keyframes fadeIn {
            from { 
                opacity: 0; 
                backdrop-filter: blur(0px);
            }
            to { 
                opacity: 1; 
                backdrop-filter: blur(10px);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(40px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes fadeOut {
            from { 
                opacity: 1; 
                backdrop-filter: blur(10px);
            }
            to { 
                opacity: 0; 
                backdrop-filter: blur(0px);
            }
        }
        
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            to {
                opacity: 0;
                transform: translateY(40px) scale(0.95);
            }
        }
        
        @media (max-width: 600px) {
            .modal-content {
                width: 95%;
                max-height: 85vh;
                border-radius: 16px;
            }
            
            .modal-header {
                padding: 20px 24px;
            }
            
            .modal-body {
                padding: 24px;
            }
        }
    `
    document.head.appendChild(style)
    
    // Setup close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal-overlay').classList.remove('active')
        })
    })
    
    // Close when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active')
            }
        })
    })
}

// Show modal
function showModal(type) {
    const modal = document.getElementById(type + 'Modal')
    if (modal) {
        modal.classList.add('active')
    }
}

// Setup password toggle
function setupPasswordToggle() {
    const passwordInput = document.getElementById('signupPassword')
    if (passwordInput) {
        const passwordGroup = passwordInput.parentElement
        const toggleHtml = `
            <button type="button" class="password-toggle" id="signupPasswordToggle" style="
                position: absolute;
                right: 12px;
                top: 40px;
                background: none;
                border: none;
                color: #64748b;
                cursor: pointer;
                padding: 8px;
                z-index: 10;
            ">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" id="signupPasswordEye">
                    <path d="M10 4C4.477 4 0 10 0 10C0 10 4.477 16 10 16C15.523 16 20 10 20 10C20 10 15.523 4 10 4Z" 
                          stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                </svg>
            </button>
        `
        passwordGroup.style.position = 'relative'
        passwordGroup.insertAdjacentHTML('beforeend', toggleHtml)
        
        const toggleBtn = document.getElementById('signupPasswordToggle')
        const eyeSvg = document.getElementById('signupPasswordEye')
        
        toggleBtn.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text'
                eyeSvg.innerHTML = `
                    <path d="M2 2L18 18" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8.5 5.5C9.5 5.2 10.7 5 12 5C16.2 5 19 8 19 8C19 8 18.3 8.8 17 10" 
                          stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M13 9C13 10.1 12.1 11 11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M6.2 6.2C4.9 7.3 4 8.6 4 10C4 12 6 14 9 14C10.4 14 11.7 13.5 12.8 12.8" 
                          stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                `
            } else {
                passwordInput.type = 'password'
                eyeSvg.innerHTML = `
                    <path d="M10 4C4.477 4 0 10 0 10C0 10 4.477 16 10 16C15.523 16 20 10 20 10C20 10 15.523 4 10 4Z" 
                          stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                `
            }
        })
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
