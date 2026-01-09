// Modal components for Calm app

import { showMessage } from './messages.js'

class ModalManager {
    constructor() {
        this.modals = new Map()
        this.activeModal = null
        this.init()
    }
    
    init() {
        // Setup global styles
        this.injectModalStyles()
        
        // Setup escape key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal)
            }
        })
        
        // Setup click outside to close
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target.classList.contains('modal-overlay')) {
                this.close(this.activeModal)
            }
        })
    }
    
    injectModalStyles() {
        if (document.querySelector('#modal-styles')) return
        
        const styles = document.createElement('style')
        styles.id = 'modal-styles'
        styles.textContent = `
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
                opacity: 0;
                animation: fadeIn 0.3s ease forwards;
                padding: 20px;
            }
            
            .modal-content {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                transform: translateY(20px);
                animation: slideUp 0.3s ease forwards;
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
                font-size: 24px;
                color: #64748b;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s;
                line-height: 1;
            }
            
            .modal-close:hover {
                color: #1e293b;
                background: #f1f5f9;
            }
            
            .modal-body {
                padding: 24px;
                color: #475569;
                line-height: 1.6;
            }
            
            .modal-footer {
                padding: 20px 24px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }
            
            .modal-scrollable {
                max-height: 400px;
                overflow-y: auto;
                padding-right: 10px;
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
            
            .theme-dark .modal-body {
                color: #e2e8f0;
            }
            
            .theme-dark .modal-footer {
                border-top-color: #334155;
            }
            
            /* Scrollbar styling */
            .modal-scrollable::-webkit-scrollbar {
                width: 6px;
            }
            
            .modal-scrollable::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
            }
            
            .modal-scrollable::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
            }
            
            .modal-scrollable::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
        `
        document.head.appendChild(styles)
    }
    
    createModal(options = {}) {
        const {
            id = `modal-${Date.now()}`,
            title = '',
            content = '',
            showCloseButton = true,
            showFooter = false,
            footerContent = '',
            onClose = null,
            className = ''
        } = options
        
        // Remove existing modal with same ID
        const existingModal = document.getElementById(id)
        if (existingModal) {
            existingModal.remove()
        }
        
        const modalHTML = `
            <div class="modal-overlay" id="${id}">
                <div class="modal-content ${className}">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        ${showCloseButton ? '<button class="modal-close" aria-label="Close modal">&times;</button>' : ''}
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${showFooter ? `<div class="modal-footer">${footerContent}</div>` : ''}
                </div>
            </div>
        `
        
        // Add to document
        document.body.insertAdjacentHTML('beforeend', modalHTML)
        
        const modalElement = document.getElementById(id)
        const closeButton = modalElement.querySelector('.modal-close')
        
        if (closeButton) {
            closeButton.addEventListener('click', () => this.close(id))
        }
        
        this.modals.set(id, {
            element: modalElement,
            onClose
        })
        
        this.activeModal = id
        
        return id
    }
    
    close(modalId) {
        const modal = this.modals.get(modalId)
        if (!modal) return
        
        // Call onClose callback if provided
        if (modal.onClose) {
            modal.onClose()
        }
        
        // Add fade out animation
        modal.element.style.animation = 'fadeOut 0.3s ease forwards'
        
        // Remove after animation
        setTimeout(() => {
            if (modal.element.parentNode) {
                modal.element.remove()
            }
            this.modals.delete(modalId)
            
            if (this.activeModal === modalId) {
                this.activeModal = null
            }
        }, 300)
    }
    
    closeAll() {
        for (const [modalId] of this.modals) {
            this.close(modalId)
        }
    }
    
    // Pre-built modals
    showTermsModal() {
        const termsContent = `
            <div class="modal-scrollable">
                <h3 style="margin-top: 0; color: #1e293b;">Calm - Terms of Service</h3>
                
                <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
                
                <h4>1. Acceptance of Terms</h4>
                <p>By accessing and using Calm, you accept and agree to be bound by these Terms of Service.</p>
                
                <h4>2. Description of Service</h4>
                <p>Calm provides AI-powered meditation guidance, peaceful conversations, and mental wellness support through a web-based application.</p>
                
                <h4>3. User Accounts</h4>
                <p>You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized access.</p>
                
                <h4>4. Privacy</h4>
                <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.</p>
                
                <h4>5. AI-Generated Content</h4>
                <p>Calm uses AI to generate responses. These responses are for supportive purposes only and not a substitute for professional medical advice.</p>
                
                <h4>6. Limitation of Liability</h4>
                <p>Calm is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
                
                <h4>7. Changes to Terms</h4>
                <p>We may modify these terms at any time. Continued use of Calm constitutes acceptance of the modified terms.</p>
                
                <h4>8. Contact</h4>
                <p>For questions about these Terms, contact: calmartificialintelligence@gmail.com</p>
                
                <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
                    By using Calm, you acknowledge that you have read, understood, and agree to these Terms of Service.
                </p>
            </div>
        `
        
        return this.createModal({
            id: 'terms-modal',
            title: 'Terms of Service',
            content: termsContent,
            className: 'terms-modal'
        })
    }
    
    showPrivacyModal() {
        const privacyContent = `
            <div class="modal-scrollable">
                <h3 style="margin-top: 0; color: #1e293b;">Calm - Privacy Policy</h3>
                
                <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
                
                <h4>1. Information We Collect</h4>
                <ul>
                    <li><strong>Account Information:</strong> Email, username (encrypted)</li>
                    <li><strong>Conversation Data:</strong> Messages you send to Calm AI</li>
                    <li><strong>Usage Data:</strong> How you interact with the app</li>
                    <li><strong>Technical Data:</strong> Browser type, IP address (anonymized)</li>
                </ul>
                
                <h4>2. How We Use Your Information</h4>
                <ul>
                    <li>Provide and improve the Calm service</li>
                    <li>Personalize your meditation experience</li>
                    <li>Generate AI responses to your messages</li>
                    <li>Ensure security and prevent abuse</li>
                    <li>Communicate with you about the service</li>
                </ul>
                
                <h4>3. Data Security</h4>
                <p>We use industry-standard encryption and security measures to protect your data. Your conversations are stored securely in our database.</p>
                
                <h4>4. AI and Your Data</h4>
                <p>Your conversations with Calm AI are used to generate responses. We do not share your personal conversations with third parties.</p>
                
                <h4>5. Your Rights</h4>
                <ul>
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Delete your account and data</li>
                    <li>Export your conversation history</li>
                </ul>
                
                <h4>6. Data Retention</h4>
                <p>We retain your data for as long as your account is active. You can delete your account at any time to remove all your data.</p>
                
                <h4>7. Children's Privacy</h4>
                <p>Calm is not intended for children under 13. We do not knowingly collect data from children under 13.</p>
                
                <h4>8. Contact Us</h4>
                <p>For privacy concerns or data requests, contact: calmartificialintelligence@gmail.com</p>
                
                <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
                    Your privacy is important to us. We are committed to protecting your personal information and being transparent about our practices.
                </p>
            </div>
        `
        
        return this.createModal({
            id: 'privacy-modal',
            title: 'Privacy Policy',
            content: privacyContent,
            className: 'privacy-modal'
        })
    }
    
    showConfirmationModal(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure you want to proceed?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            onConfirm = () => {},
            onCancel = () => {}
        } = options
        
        const content = `
            <p>${message}</p>
        `
        
        const footerContent = `
            <button class="btn btn-secondary" id="modal-cancel">${cancelText}</button>
            <button class="btn btn-primary" id="modal-confirm">${confirmText}</button>
        `
        
        const modalId = this.createModal({
            id: 'confirmation-modal',
            title: title,
            content: content,
            showFooter: true,
            footerContent: footerContent
        })
        
        // Add event listeners after modal is created
        setTimeout(() => {
            const confirmBtn = document.getElementById('modal-confirm')
            const cancelBtn = document.getElementById('modal-cancel')
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    onConfirm()
                    this.close(modalId)
                })
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    onCancel()
                    this.close(modalId)
                })
            }
        }, 100)
        
        return modalId
    }
    
    showLoadingModal(message = 'Loading...') {
        const content = `
            <div style="text-align: center; padding: 20px;">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f1f5f9;
                    border-top-color: #0ea5e9;
                    border-radius: 50%;
                    margin: 0 auto 20px;
                    animation: spin 1s linear infinite;
                "></div>
                <p style="color: #64748b;">${message}</p>
            </div>
        `
        
        return this.createModal({
            id: 'loading-modal',
            title: '',
            content: content,
            showCloseButton: false,
            className: 'loading-modal'
        })
    }
    
    showErrorModal(title = 'Error', message = 'Something went wrong.') {
        const content = `
            <div style="text-align: center; padding: 20px;">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: #fee2e2;
                    color: #dc2626;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 30px;
                    margin: 0 auto 20px;
                ">
                    ⚠️
                </div>
                <h3 style="margin-bottom: 10px; color: #1e293b;">${title}</h3>
                <p style="color: #64748b;">${message}</p>
            </div>
        `
        
        return this.createModal({
            id: 'error-modal',
            title: '',
            content: content,
            className: 'error-modal'
        })
    }
    
    showSuccessModal(title = 'Success', message = 'Operation completed successfully.') {
        const content = `
            <div style="text-align: center; padding: 20px;">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: #d1fae5;
                    color: #059669;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 30px;
                    margin: 0 auto 20px;
                ">
                    ✓
                </div>
                <h3 style="margin-bottom: 10px; color: #1e293b;">${title}</h3>
                <p style="color: #64748b;">${message}</p>
            </div>
        `
        
        const modalId = this.createModal({
            id: 'success-modal',
            title: '',
            content: content,
            className: 'success-modal'
        })
        
        // Auto close after 2 seconds
        setTimeout(() => {
            this.close(modalId)
        }, 2000)
        
        return modalId
    }
}

// Create global modal manager instance
let modalManager = null

function getModalManager() {
    if (!modalManager) {
        modalManager = new ModalManager()
    }
    return modalManager
}

// Export individual functions for easy use
export function showTermsModal() {
    return getModalManager().showTermsModal()
}

export function showPrivacyModal() {
    return getModalManager().showPrivacyModal()
}

export function showConfirmationModal(options) {
    return getModalManager().showConfirmationModal(options)
}

export function showLoadingModal(message) {
    return getModalManager().showLoadingModal(message)
}

export function showErrorModal(title, message) {
    return getModalManager().showErrorModal(title, message)
}

export function showSuccessModal(title, message) {
    return getModalManager().showSuccessModal(title, message)
}

export function closeAllModals() {
    if (modalManager) {
        modalManager.closeAll()
    }
}

// ADD THIS FUNCTION - The missing export
export function createModal(options) {
    return getModalManager().createModal(options)
}

// Initialize modal manager on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        modalManager = new ModalManager()
    })
}