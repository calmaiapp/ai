import { signIn, getSession, getSecurityQuestion, resetPasswordWithSecurity } from '../utils/auth.js'

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
        emailInput.placeholder = 'username or email@example.com'
    }
    
    // Add view/hide password toggle
    const passwordInput = document.getElementById('password')
    if (passwordInput) {
        const passwordGroup = passwordInput.parentElement
        const toggleHtml = `
            <button type="button" class="password-toggle" id="passwordToggle" style="
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
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" id="passwordEye">
                    <path d="M10 4C4.477 4 0 10 0 10C0 10 4.477 16 10 16C15.523 16 20 10 20 10C20 10 15.523 4 10 4Z" 
                          stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                </svg>
            </button>
        `
        passwordGroup.style.position = 'relative'
        passwordGroup.insertAdjacentHTML('beforeend', toggleHtml)
        
        const toggleBtn = document.getElementById('passwordToggle')
        const eyeSvg = document.getElementById('passwordEye')
        
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
            loginBtn.innerHTML = '<span>Signing In...</span>'
            loadingOverlay.classList.add('active')
            
            // Sign in with username or email
            const result = await signIn(identifier, password)
            
            // Hide loading
            loginBtn.disabled = false
            loginBtn.innerHTML = '<span>Sign In</span><svg class="btn-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.6667 10H3.33337" stroke="white" stroke-width="1.5" stroke-linecap="round"/><path d="M11.6667 5L16.6667 10L11.6667 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
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
                if (result.rateLimited) {
                    showMessage(result.error, 'error')
                } else if (result.authError) {
                    showMessage('Invalid email or password', 'error')
                } else {
                    showMessage(result.error || 'Login failed. Please try again.', 'error')
                }
            }
        })
    }
    
    // Google login button - Coming Soon
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            showMessage('Google login coming soon!', 'info')
        })
    }
    
    // Setup forgot password modal
    setupForgotPassword()
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

// Setup forgot password functionality
function setupForgotPassword() {
    const forgotLink = document.querySelector('.forgot-link')
    if (!forgotLink) return
    
    forgotLink.addEventListener('click', function(e) {
        e.preventDefault()
        showForgotPasswordModal()
    })
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="forgotModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Reset Password</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div id="step1">
                        <div class="form-group">
                            <label for="forgotUsername">Username</label>
                            <input type="text" id="forgotUsername" placeholder="Enter your username" required style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        <button class="auth-btn" id="checkSecurityBtn" style="width: 100%; padding: 12px;">
                            Continue
                        </button>
                    </div>
                    
                    <div id="step2" style="display: none;">
                        <div class="form-group">
                            <label id="securityQuestionLabel" style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #1e293b;"></label>
                            <input type="text" id="securityAnswer" placeholder="Enter your answer" required style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        <button class="auth-btn" id="verifyAnswerBtn" style="width: 100%; padding: 12px;">
                            Verify Answer
                        </button>
                        <p id="noSecurityMsg" style="display: none; color: #ef4444; margin-top: 10px; padding: 10px; background: #fef2f2; border-radius: 6px;">
                            No security question set for this account. Password recovery is not possible.
                        </p>
                    </div>
                    
                    <div id="step3" style="display: none;">
                        <div class="form-group">
                            <label for="newPassword">New Password</label>
                            <input type="password" id="newPassword" placeholder="Enter new password" required style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        <div class="form-group">
                            <label for="confirmNewPassword">Confirm New Password</label>
                            <input type="password" id="confirmNewPassword" placeholder="Confirm new password" required style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        </div>
                        <button class="auth-btn" id="resetPasswordBtn" style="width: 100%; padding: 12px;">
                            Reset Password
                        </button>
                    </div>
                    
                    <div id="step4" style="display: none; text-align: center;">
                        <div class="success-icon" style="margin: 20px auto;">
                            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                                <circle cx="30" cy="30" r="30" fill="#10b981" fill-opacity="0.1"/>
                                <path d="M20 30L27.5 37.5L40 25" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3 style="color: #10b981; margin-bottom: 10px;">Password Reset Successful!</h3>
                        <p style="color: #64748b; margin-bottom: 20px;">Your password has been reset. You can now login with your new password.</p>
                        <button class="auth-btn secondary" id="closeModalBtn" style="padding: 12px 24px;">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML)
    
    // Add modal styles
    const style = document.createElement('style')
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
        
        .modal-close {
            background: none;
            border: none;
            font-size: 28px;
            color: #64748b;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s;
        }
        
        .modal-close:hover {
            background: #f1f5f9;
            color: #0ea5e9;
        }
        
        .modal-body {
            padding: 24px;
        }
        
        .modal-body .form-group {
            margin-bottom: 20px;
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
    `
    document.head.appendChild(style)
    
    // Setup modal events
    setupModalEvents()
}

// Setup modal events for forgot password
function setupModalEvents() {
    const modal = document.getElementById('forgotModal')
    const closeBtn = modal?.querySelector('.modal-close')
    const closeModalBtn = modal?.querySelector('#closeModalBtn')
    const checkSecurityBtn = modal?.querySelector('#checkSecurityBtn')
    const verifyAnswerBtn = modal?.querySelector('#verifyAnswerBtn')
    const resetPasswordBtn = modal?.querySelector('#resetPasswordBtn')
    
    let currentUsername = ''
    let securityAnswer = ''
    
    // Close modal
    function closeModal() {
        if (!modal) return
        
        modal.style.animation = 'fadeOut 0.3s ease'
        const style = document.createElement('style')
        style.textContent = `@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`
        document.head.appendChild(style)
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.style.display = 'none'
                // Reset form
                document.getElementById('step1').style.display = 'block'
                document.getElementById('step2').style.display = 'none'
                document.getElementById('step3').style.display = 'none'
                document.getElementById('step4').style.display = 'none'
                if (document.getElementById('forgotUsername')) {
                    document.getElementById('forgotUsername').value = ''
                }
                if (document.getElementById('securityAnswer')) {
                    document.getElementById('securityAnswer').value = ''
                }
                if (document.getElementById('newPassword')) {
                    document.getElementById('newPassword').value = ''
                }
                if (document.getElementById('confirmNewPassword')) {
                    document.getElementById('confirmNewPassword').value = ''
                }
            }
        }, 300)
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal)
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal)
    }
    
    // Close when clicking outside
    modal?.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal()
        }
    })
    
    // Step 1: Check security question
    if (checkSecurityBtn) {
        checkSecurityBtn.addEventListener('click', async function() {
            const username = document.getElementById('forgotUsername')?.value.trim() || ''
            
            if (!username) {
                showMessage('Please enter your username', 'error')
                return
            }
            
            currentUsername = username
            
            // Add loading state
            checkSecurityBtn.disabled = true
            checkSecurityBtn.textContent = 'Checking...'
            
            const result = await getSecurityQuestion(username)
            
            checkSecurityBtn.disabled = false
            checkSecurityBtn.textContent = 'Continue'
            
            if (result.success) {
                if (result.locked) {
                    // Account is locked
                    showMessage(result.error, 'error')
                } else if (result.hasSecurity && result.question) {
                    // Show security question
                    document.getElementById('step1').style.display = 'none'
                    document.getElementById('step2').style.display = 'block'
                    document.getElementById('securityQuestionLabel').textContent = result.question
                    document.getElementById('noSecurityMsg').style.display = 'none'
                } else {
                    // No security question set
                    document.getElementById('noSecurityMsg').style.display = 'block'
                }
            } else {
                showMessage(result.error || 'User not found', 'error')
            }
        })
    }
    
    // Step 2: Verify security answer
    if (verifyAnswerBtn) {
        verifyAnswerBtn.addEventListener('click', function() {
            const answer = document.getElementById('securityAnswer')?.value.trim() || ''
            
            if (!answer) {
                showMessage('Please enter your answer', 'error')
                return
            }
            
            securityAnswer = answer
            
            // Move to step 3
            document.getElementById('step2').style.display = 'none'
            document.getElementById('step3').style.display = 'block'
        })
    }
    
    // Step 3: Reset password
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', async function() {
            const newPassword = document.getElementById('newPassword')?.value || ''
            const confirmPassword = document.getElementById('confirmNewPassword')?.value || ''
            
            if (!newPassword || !confirmPassword) {
                showMessage('Please fill in all fields', 'error')
                return
            }
            
            if (newPassword !== confirmPassword) {
                showMessage('Passwords do not match', 'error')
                return
            }
            
            if (newPassword.length < 6) {
                showMessage('Password must be at least 6 characters', 'error')
                return
            }
            
            // Add loading state
            resetPasswordBtn.disabled = true
            resetPasswordBtn.textContent = 'Resetting...'
            
            const result = await resetPasswordWithSecurity(currentUsername, securityAnswer, newPassword)
            
            resetPasswordBtn.disabled = false
            resetPasswordBtn.textContent = 'Reset Password'
            
            if (result.success) {
                document.getElementById('step3').style.display = 'none'
                document.getElementById('step4').style.display = 'block'
            } else {
                if (result.locked) {
                    showMessage(result.error, 'error')
                } else {
                    showMessage(result.error || 'Password reset failed', 'error')
                }
            }
        })
    }
}

// Show forgot password modal
modal
function showForgotPasswordModal() {
    const modal = document.getElementById('forgotModal')
    if (modal) {
        modal.style.display = 'flex'
        // Focus on username input
        setTimeout(() => {
            const usernameInput = document.getElementById('forgotUsername')
            if (usernameInput) {
                usernameInput.focus()
            }
        }, 100)
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