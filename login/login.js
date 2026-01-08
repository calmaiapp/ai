import { signIn, getCurrentUser, getSecurityQuestion, resetPasswordWithSecurity } from '/ai/utils/auth-core.js'
import { showMessage } from '/ai/components/messages.js'
import { setupPasswordToggle } from '/ai/components/forms.js'
import { createModal } from '/ai/components/modals.js'

// Global error handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error)
        showMessage('Error: ' + (e.error?.message || 'Unknown error'), 'error')
    })
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm')
    const loginBtn = document.getElementById('loginBtn')
    const loadingOverlay = document.getElementById('loadingOverlay')
    const googleBtn = document.querySelector('.social-btn.google')
    
    // Add view/hide password toggle
    setupPasswordToggle('password')
    
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
            if (loadingOverlay) loadingOverlay.classList.add('active')
            
            // Sign in with username or email
            const result = await signIn(identifier, password)
            
            // Hide loading
            loginBtn.disabled = false
            loginBtn.innerHTML = '<span>Sign In</span><svg class="btn-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.6667 10H3.33337" stroke="white" stroke-width="1.5" stroke-linecap="round"/><path d="M11.6667 5L16.6667 10L11.6667 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            if (loadingOverlay) loadingOverlay.classList.remove('active')
            
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
                    showMessage('Invalid username/email or password', 'error')
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
    
    // Setup forgot password
    setupForgotPassword()
    
    // Setup terms links
    setupTermsLinks()
})

// Check authentication status
async function checkAuthStatus() {
    try {
        const result = await getCurrentUser()
        
        if (result.success && result.user) {
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
}

function showForgotPasswordModal() {
    const modalId = createModal('forgotPasswordModal', {
        title: 'Reset Password',
        content: `
            <div style="max-width: 400px;">
                <div id="step1">
                    <p style="color: #64748b; margin-bottom: 20px;">
                        Enter your username to start the password reset process.
                    </p>
                    
                    <div class="form-group">
                        <label for="forgotUsername">Username</label>
                        <input 
                            type="text" 
                            id="forgotUsername" 
                            placeholder="Enter your username"
                            required
                            style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;"
                        >
                    </div>
                    
                    <div class="form-group" style="margin-top: 20px;">
                        <button id="checkSecurityBtn" style="
                            width: 100%;
                            padding: 14px;
                            background: #0ea5e9;
                            color: white;
                            border: none;
                            border-radius: 10px;
                            font-size: 15px;
                            font-weight: 500;
                            cursor: pointer;
                        ">
                            Continue
                        </button>
                    </div>
                </div>
                
                <div id="step2" style="display: none;">
                    <div class="form-group">
                        <label id="securityQuestionLabel" style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #1e293b;"></label>
                        <input 
                            type="text" 
                            id="securityAnswer" 
                            placeholder="Enter your answer"
                            required
                            style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;"
                        >
                    </div>
                    <button id="verifyAnswerBtn" style="
                        width: 100%;
                        padding: 14px;
                        background: #0ea5e9;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 15px;
                        font-weight: 500;
                        cursor: pointer;
                        margin-top: 20px;
                    ">
                        Verify Answer
                    </button>
                    <p id="noSecurityMsg" style="display: none; color: #ef4444; margin-top: 10px; padding: 10px; background: #fef2f2; border-radius: 6px;">
                        No security question set for this account. Password recovery is not possible.
                    </p>
                </div>
                
                <div id="step3" style="display: none;">
                    <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <input 
                            type="password" 
                            id="newPassword" 
                            placeholder="Enter new password"
                            required
                            style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;"
                        >
                    </div>
                    <div class="form-group">
                        <label for="confirmNewPassword">Confirm New Password</label>
                        <input 
                            type="password" 
                            id="confirmNewPassword" 
                            placeholder="Confirm new password"
                            required
                            style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;"
                        >
                    </div>
                    <button id="resetPasswordBtn" style="
                        width: 100%;
                        padding: 14px;
                        background: #0ea5e9;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 15px;
                        font-weight: 500;
                        cursor: pointer;
                        margin-top: 20px;
                    ">
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
                    <p style="color: #64748b; margin-bottom: 20px;">
                        Your password has been reset. You can now login with your new password.
                    </p>
                    <button id="closeModalBtn" style="
                        padding: 12px 24px;
                        background: #0ea5e9;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 15px;
                        font-weight: 500;
                        cursor: pointer;
                    ">
                        Close
                    </button>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 13px; text-align: center;">
                        You'll need to answer your security question to reset your password.
                    </p>
                </div>
            </div>
        `,
        showCloseButton: true,
        onOpen: () => {
            // Reset form state
            document.getElementById('step1').style.display = 'block'
            document.getElementById('step2').style.display = 'none'
            document.getElementById('step3').style.display = 'none'
            document.getElementById('step4').style.display = 'none'
            document.getElementById('noSecurityMsg').style.display = 'none'
            
            // Clear inputs
            document.getElementById('forgotUsername').value = ''
            document.getElementById('securityAnswer').value = ''
            document.getElementById('newPassword').value = ''
            document.getElementById('confirmNewPassword').value = ''
        }
    })
    
    // Setup modal events
    setupForgotPasswordEvents(modalId)
}

function setupForgotPasswordEvents(modalId) {
    let currentUsername = ''
    let securityAnswer = ''
    
    // Step 1: Check security question
    const checkSecurityBtn = document.querySelector(`#modal-wrapper-${modalId} #checkSecurityBtn`)
    if (checkSecurityBtn) {
        checkSecurityBtn.addEventListener('click', async () => {
            const username = document.getElementById('forgotUsername').value.trim()
            
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
    const verifyAnswerBtn = document.querySelector(`#modal-wrapper-${modalId} #verifyAnswerBtn`)
    if (verifyAnswerBtn) {
        verifyAnswerBtn.addEventListener('click', () => {
            const answer = document.getElementById('securityAnswer').value.trim()
            
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
    const resetPasswordBtn = document.querySelector(`#modal-wrapper-${modalId} #resetPasswordBtn`)
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', async () => {
            const newPassword = document.getElementById('newPassword').value
            const confirmPassword = document.getElementById('confirmNewPassword').value
            
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
    
    // Step 4: Close modal
    const closeModalBtn = document.querySelector(`#modal-wrapper-${modalId} #closeModalBtn`)
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            // Close modal using the modal manager
            const modalManager = window._modalManager
            if (modalManager) {
                modalManager.close(modalId)
            }
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
            // Import and show terms modal
            import('/ai/components/modals.js').then(({ showTermsModal }) => {
                showTermsModal()
            })
        })
    })
    
    // Privacy button
    const privacyLinks = document.querySelectorAll('a[href="#privacy"]')
    privacyLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            // Import and show privacy modal
            import('/ai/components/modals.js').then(({ showPrivacyModal }) => {
                showPrivacyModal()
            })
        })
    })
}


