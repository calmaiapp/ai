// Enhanced modal system with stacking and animations

import { showMessage } from './messages.js'

export class ModalManager {
    constructor(options = {}) {
        this.options = {
            backdrop: true,
            backdropBlur: true,
            closeOnBackdrop: true,
            closeOnEscape: true,
            animationDuration: 300,
            maxWidth: '500px',
            zIndex: 2000,
            ...options
        }
        
        this.modals = new Map()
        this.modalStack = []
        this.container = null
        this.isInitialized = false
        
        this.init()
    }
    
    init() {
        if (this.isInitialized) return
        
        this.createContainer()
        this.setupStyles()
        this.setupEventListeners()
        this.isInitialized = true
    }
    
    createContainer() {
        this.container = document.createElement('div')
        this.container.className = 'modal-manager-container'
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: ${this.options.zIndex};
            pointer-events: none;
        `
        document.body.appendChild(this.container)
    }
    
    setupStyles() {
        if (document.querySelector('#modal-manager-styles')) return
        
        const styles = document.createElement('style')
        styles.id = 'modal-manager-styles'
        styles.textContent = `
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                opacity: 0;
                transition: opacity ${this.options.animationDuration}ms ease;
                pointer-events: auto;
            }
            
            .modal-backdrop.active {
                opacity: 1;
            }
            
            .modal-backdrop.blur {
                backdrop-filter: blur(10px);
            }
            
            .modal-wrapper {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                opacity: 0;
                transition: opacity ${this.options.animationDuration}ms ease;
                pointer-events: none;
            }
            
            .modal-wrapper.active {
                opacity: 1;
                pointer-events: auto;
            }
            
            .modal-content {
                background: white;
                border-radius: 16px;
                max-width: ${this.options.maxWidth};
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                transform: translateY(20px) scale(0.95);
                opacity: 0;
                transition: all ${this.options.animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: auto;
            }
            
            .modal-wrapper.active .modal-content {
                transform: translateY(0) scale(1);
                opacity: 1;
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
                border-radius: 16px 16px 0 0;
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
            
            .modal-footer {
                padding: 20px 28px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                background: #f8fafc;
                border-radius: 0 0 16px 16px;
            }
            
            .modal-scroll-lock {
                overflow: hidden;
            }
            
            @media (max-width: 640px) {
                .modal-wrapper {
                    padding: 10px;
                }
                
                .modal-content {
                    max-height: 90vh;
                    border-radius: 12px;
                }
                
                .modal-header {
                    padding: 20px 24px;
                }
                
                .modal-body {
                    padding: 24px;
                }
                
                .modal-footer {
                    padding: 16px 24px;
                    flex-direction: column;
                }
                
                .modal-footer button {
                    width: 100%;
                }
            }
        `
        document.head.appendChild(styles)
    }
    
    setupEventListeners() {
        // Escape key to close modal
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modalStack.length > 0) {
                    const topModal = this.modalStack[this.modalStack.length - 1]
                    this.close(topModal.id)
                }
            })
        }
        
        // Prevent body scroll when modal is open
        const observer = new MutationObserver(() => {
            if (this.modalStack.length > 0) {
                document.body.classList.add('modal-scroll-lock')
            } else {
                document.body.classList.remove('modal-scroll-lock')
            }
        })
        
        observer.observe(this.container, { childList: true })
    }
    
    createModal(id, options = {}) {
        const modalOptions = {
            id: id || `modal-${Date.now()}`,
            title: '',
            content: '',
            footer: '',
            size: 'medium', // small, medium, large, full
            showCloseButton: true,
            closeOnBackdrop: this.options.closeOnBackdrop,
            onClose: null,
            onOpen: null,
            beforeClose: null,
            ...options
        }
        
        // Check if modal already exists
        if (this.modals.has(modalOptions.id)) {
            this.updateModal(modalOptions.id, modalOptions)
            return modalOptions.id
        }
        
        const modalElement = this.createModalElement(modalOptions)
        
        this.modals.set(modalOptions.id, {
            element: modalElement,
            options: modalOptions,
            isOpen: false
        })
        
        return modalOptions.id
    }
    
    createModalElement(options) {
        const wrapper = document.createElement('div')
        wrapper.id = `modal-wrapper-${options.id}`
        wrapper.className = 'modal-wrapper'
        
        // Create backdrop
        if (this.options.backdrop) {
            const backdrop = document.createElement('div')
            backdrop.className = `modal-backdrop ${this.options.backdropBlur ? 'blur' : ''}`
            
            if (options.closeOnBackdrop) {
                backdrop.addEventListener('click', () => this.close(options.id))
            }
            
            wrapper.appendChild(backdrop)
        }
        
        // Create modal content
        const content = document.createElement('div')
        content.className = `modal-content modal-${options.size}`
        
        // Create header
        if (options.title || options.showCloseButton) {
            const header = document.createElement('div')
            header.className = 'modal-header'
            
            if (options.title) {
                const title = document.createElement('h2')
                title.textContent = options.title
                header.appendChild(title)
            }
            
            if (options.showCloseButton) {
                const closeButton = document.createElement('button')
                closeButton.className = 'modal-close'
                closeButton.innerHTML = '×'
                closeButton.setAttribute('aria-label', 'Close modal')
                closeButton.addEventListener('click', () => this.close(options.id))
                header.appendChild(closeButton)
            }
            
            content.appendChild(header)
        }
        
        // Create body
        const body = document.createElement('div')
        body.className = 'modal-body'
        
        if (typeof options.content === 'string') {
            body.innerHTML = options.content
        } else if (options.content instanceof HTMLElement) {
            body.appendChild(options.content)
        } else if (options.content instanceof Function) {
            const contentResult = options.content()
            if (typeof contentResult === 'string') {
                body.innerHTML = contentResult
            } else if (contentResult instanceof HTMLElement) {
                body.appendChild(contentResult)
            }
        }
        
        content.appendChild(body)
        
        // Create footer if provided
        if (options.footer) {
            const footer = document.createElement('div')
            footer.className = 'modal-footer'
            
            if (typeof options.footer === 'string') {
                footer.innerHTML = options.footer
            } else if (options.footer instanceof HTMLElement) {
                footer.appendChild(options.footer)
            } else if (options.footer instanceof Function) {
                const footerResult = options.footer()
                if (typeof footerResult === 'string') {
                    footer.innerHTML = footerResult
                } else if (footerResult instanceof HTMLElement) {
                    footer.appendChild(footerResult)
                }
            }
            
            content.appendChild(footer)
        }
        
        wrapper.appendChild(content)
        return wrapper
    }
    
    open(id) {
        const modal = this.modals.get(id)
        if (!modal || modal.isOpen) return false
        
        // Run before open callback
        if (modal.options.onOpen) {
            const shouldOpen = modal.options.onOpen()
            if (shouldOpen === false) return false
        }
        
        // Add to DOM
        this.container.appendChild(modal.element)
        
        // Add to stack
        this.modalStack.push(modal)
        modal.isOpen = true
        
        // Activate with delay for animation
        setTimeout(() => {
            modal.element.classList.add('active')
        }, 10)
        
        return true
    }
    
    close(id) {
        const modal = this.modals.get(id)
        if (!modal || !modal.isOpen) return false
        
        // Run before close callback
        if (modal.options.beforeClose) {
            const shouldClose = modal.options.beforeClose()
            if (shouldClose === false) return false
        }
        
        // Remove active class for animation
        modal.element.classList.remove('active')
        
        // Remove from stack
        const stackIndex = this.modalStack.findIndex(m => m.id === id)
        if (stackIndex > -1) {
            this.modalStack.splice(stackIndex, 1)
        }
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (modal.element.parentNode) {
                modal.element.remove()
            }
            modal.isOpen = false
            
            // Run onClose callback
            if (modal.options.onClose) {
                modal.options.onClose()
            }
        }, this.options.animationDuration)
        
        return true
    }
    
    closeAll() {
        for (const [id, modal] of this.modals) {
            if (modal.isOpen) {
                this.close(id)
            }
        }
        this.modalStack = []
    }
    
    updateModal(id, updates) {
        const modal = this.modals.get(id)
        if (!modal) return false
        
        Object.assign(modal.options, updates)
        
        // Recreate modal if it's open
        if (modal.isOpen) {
            const wasOpen = true
            this.close(id)
            
            // Recreate with new options
            const newModal = this.createModalElement(modal.options)
            modal.element = newModal
            this.modals.set(id, modal)
            
            if (wasOpen) {
                this.open(id)
            }
        }
        
        return true
    }
    
    getModal(id) {
        return this.modals.get(id)
    }
    
    isOpen(id) {
        const modal = this.modals.get(id)
        return modal ? modal.isOpen : false
    }
    
    getTopModal() {
        if (this.modalStack.length === 0) return null
        return this.modalStack[this.modalStack.length - 1]
    }
    
    // Pre-built modal templates
    createAlertModal(options = {}) {
        const {
            title = 'Alert',
            message,
            type = 'info',
            confirmText = 'OK',
            onConfirm
        } = options
        
        const icon = this.getIconForType(type)
        const color = this.getColorForType(type)
        
        const modalId = this.createModal(null, {
            title: `${icon} ${title}`,
            content: `
                <div style="text-align: center; padding: 20px 0;">
                    <p style="color: #475569; font-size: 16px; line-height: 1.5; margin: 0;">
                        ${message}
                    </p>
                </div>
            `,
            footer: `
                <button class="modal-confirm-btn" style="
                    padding: 12px 24px;
                    background: ${color};
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    ${confirmText}
                </button>
            `,
            showCloseButton: true,
            size: 'small'
        })
        
        // Add confirm button event
        setTimeout(() => {
            const confirmBtn = document.querySelector(`#modal-wrapper-${modalId} .modal-confirm-btn`)
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    if (onConfirm) onConfirm()
                    this.close(modalId)
                })
            }
        }, 100)
        
        return modalId
    }
    
    createConfirmModal(options = {}) {
        const {
            title = 'Confirm',
            message,
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            onConfirm,
            onCancel
        } = options
        
        const modalId = this.createModal(null, {
            title: `❓ ${title}`,
            content: `
                <div style="text-align: center; padding: 20px 0;">
                    <p style="color: #475569; font-size: 16px; line-height: 1.5; margin: 0;">
                        ${message}
                    </p>
                </div>
            `,
            footer: `
                <button class="modal-cancel-btn" style="
                    padding: 12px 24px;
                    background: #f1f5f9;
                    color: #64748b;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    ${cancelText}
                </button>
                <button class="modal-confirm-btn" style="
                    padding: 12px 24px;
                    background: #0ea5e9;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    ${confirmText}
                </button>
            `,
            showCloseButton: true,
            size: 'small'
        })
        
        // Add button events
        setTimeout(() => {
            const wrapper = document.querySelector(`#modal-wrapper-${modalId}`)
            if (wrapper) {
                const confirmBtn = wrapper.querySelector('.modal-confirm-btn')
                const cancelBtn = wrapper.querySelector('.modal-cancel-btn')
                const closeBtn = wrapper.querySelector('.modal-close')
                
                const closeModal = () => this.close(modalId)
                
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        if (onConfirm) onConfirm()
                        closeModal()
                    })
                }
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        if (onCancel) onCancel()
                        closeModal()
                    })
                }
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        if (onCancel) onCancel()
                        closeModal()
                    })
                }
            }
        }, 100)
        
        return modalId
    }
    
    createFormModal(options = {}) {
        const {
            title,
            formId,
            formHTML,
            onSubmit,
            submitText = 'Submit',
            cancelText = 'Cancel'
        } = options
        
        const modalId = this.createModal(null, {
            title: `📝 ${title}`,
            content: formHTML,
            footer: `
                <button class="modal-cancel-btn" style="
                    padding: 12px 24px;
                    background: #f1f5f9;
                    color: #64748b;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    ${cancelText}
                </button>
                <button type="submit" form="${formId}" class="modal-submit-btn" style="
                    padding: 12px 24px;
                    background: #0ea5e9;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    ${submitText}
                </button>
            `,
            showCloseButton: true,
            size: 'medium'
        })
        
        // Handle form submission
        setTimeout(() => {
            const form = document.querySelector(`#modal-wrapper-${modalId} form`)
            if (form && onSubmit) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault()
                    
                    try {
                        await onSubmit(new FormData(form))
                        this.close(modalId)
                    } catch (error) {
                        showMessage(error.message, 'error')
                    }
                })
            }
        }, 100)
        
        return modalId
    }
    
    getIconForType(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️',
            question: '❓'
        }
        return icons[type] || ''
    }
    
    getColorForType(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#0ea5e9',
            warning: '#f59e0b'
        }
        return colors[type] || '#0ea5e9'
    }
    
    // Static methods for quick access
    static alert(message, options = {}) {
        if (!window._modalManager) {
            window._modalManager = new ModalManager()
        }
        
        const modalId = window._modalManager.createAlertModal({
            message,
            ...options
        })
        
        window._modalManager.open(modalId)
        return modalId
    }
    
    static confirm(message, options = {}) {
        if (!window._modalManager) {
            window._modalManager = new ModalManager()
        }
        
        const modalId = window._modalManager.createConfirmModal({
            message,
            ...options
        })
        
        window._modalManager.open(modalId)
        return modalId
    }
    
    static showForm(title, formHTML, options = {}) {
        if (!window._modalManager) {
            window._modalManager = new ModalManager()
        }
        
        const modalId = window._modalManager.createFormModal({
            title,
            formHTML,
            ...options
        })
        
        window._modalManager.open(modalId)
        return modalId
    }
}

// Export convenience functions
export function showAlert(message, options = {}) {
    return ModalManager.alert(message, options)
}

export function showConfirm(message, options = {}) {
    return ModalManager.confirm(message, options)
}

export function showFormModal(title, formHTML, options = {}) {
    return ModalManager.showForm(title, formHTML, options)
}

export function createModal(id, options = {}) {
    if (!window._modalManager) {
        window._modalManager = new ModalManager()
    }
    return window._modalManager.createModal(id, options)
}

export function openModal(id) {
    if (window._modalManager) {
        return window._modalManager.open(id)
    }
    return false
}

export function closeModal(id) {
    if (window._modalManager) {
        return window._modalManager.close(id)
    }
    return false
}

export function closeAllModals() {
    if (window._modalManager) {
        window._modalManager.closeAll()
    }
}

// Initialize global modal manager
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window._modalManager) {
            window._modalManager = new ModalManager()
        }
    })
}