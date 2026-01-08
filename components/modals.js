// All modal components for the app
import { showMessage } from './messages.js'

// Modal container to hold all modals
let modalContainer = null

// Initialize modals container
function initModalContainer() {
    if (!modalContainer) {
        modalContainer = document.createElement('div')
        modalContainer.className = 'modals-container'
        modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 2000;
        `
        document.body.appendChild(modalContainer)

        // Add modal styles
        const modalStyles = document.createElement('style')
        modalStyles.textContent = `
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
                pointer-events: none;
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
        `
        document.head.appendChild(modalStyles)
    }
}

// Terms & Conditions Modal
export function showTermsModal() {
    initModalContainer()
    
    const modalId = 'termsModal'
    let modal = document.getElementById(modalId)
    
    if (!modal) {
        modal = document.createElement('div')
        modal.id = modalId
        modal.className = 'modal-overlay'
        modal.innerHTML = `
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
        `
        modalContainer.appendChild(modal)
        
        // Setup close button
        const closeBtn = modal.querySelector('.modal-close')
        closeBtn.addEventListener('click', () => hideModal(modalId))
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modalId)
            }
        })
    }
    
    showModal(modalId)
}

// Privacy Policy Modal
export function showPrivacyModal() {
    initModalContainer()
    
    const modalId = 'privacyModal'
    let modal = document.getElementById(modalId)
    
    if (!modal) {
        modal = document.createElement('div')
        modal.id = modalId
        modal.className = 'modal-overlay'
        modal.innerHTML = `
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
        `
        modalContainer.appendChild(modal)
        
        // Setup close button
        const closeBtn = modal.querySelector('.modal-close')
        closeBtn.addEventListener('click', () => hideModal(modalId))
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modalId)
            }
        })
    }
    
    showModal(modalId)
}

// Forgot Password Modal
export function showForgotPasswordModal(onResetCallback) {
    initModalContainer()
    
    const modalId = 'forgotPasswordModal'
    let modal = document.getElementById(modalId)
    
    if (!modal) {
        modal = document.createElement('div')
        modal.id = modalId
        modal.className = 'modal-overlay'
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Reset Password</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <p style="color: #64748b; margin-bottom: 20px;">
                        Enter your username to start the password reset process.
                    </p>
                    
                    <div class="form-group">
                        <label for="modalUsername">Username</label>
                        <input 
                            type="text" 
                            id="modalUsername" 
                            placeholder="Enter your username"
                            style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px;"
                        >
                    </div>
                    
                    <div class="form-group" style="margin-top: 20px;">
                        <button id="startResetBtn" style="
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
                            Start Reset Process
                        </button>
                    </div>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 13px; text-align: center;">
                            You'll need to answer your security question to reset your password.
                        </p>
                    </div>
                </div>
            </div>
        `
        modalContainer.appendChild(modal)
        
        // Setup close button
        const closeBtn = modal.querySelector('.modal-close')
        closeBtn.addEventListener('click', () => hideModal(modalId))
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modalId)
            }
        })
        
        // Setup reset button
        const resetBtn = modal.querySelector('#startResetBtn')
        resetBtn.addEventListener('click', () => {
            const username = modal.querySelector('#modalUsername').value.trim()
            if (!username) {
                showMessage('Please enter your username', 'error')
                return
            }
            
            hideModal(modalId)
            if (onResetCallback) {
                onResetCallback(username)
            }
        })
    }
    
    showModal(modalId)
}

// Helper function to show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
        modal.classList.add('active')
    }
}

// Helper function to hide modal
function hideModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
        modal.classList.remove('active')
    }
}

// Setup Terms & Privacy links
export function setupTermsLinks() {
    // Terms links
    document.querySelectorAll('a[href="#terms"], a[href*="terms"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault()
            showTermsModal()
        })
    })
    
    // Privacy links
    document.querySelectorAll('a[href="#privacy"], a[href*="privacy"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault()
            showPrivacyModal()
        })
    })
}