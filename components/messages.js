// Enhanced message/alert system with queuing and persistence

export class MessageManager {
    constructor(options = {}) {
        this.options = {
            position: 'top-right', // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
            maxMessages: 3,
            autoDismiss: true,
            dismissTimeout: 3000,
            animationDuration: 300,
            queue: true,
            ...options
        }
        
        this.messageQueue = []
        this.activeMessages = new Map()
        this.container = null
        this.isInitialized = false
        
        this.init()
    }
    
    init() {
        if (this.isInitialized) return
        
        this.createContainer()
        this.setupStyles()
        this.isInitialized = true
        
        // Process any queued messages
        this.processQueue()
    }
    
    createContainer() {
        this.container = document.createElement('div')
        this.container.className = 'message-container'
        this.container.style.cssText = `
            position: fixed;
            z-index: 9999;
            max-width: 400px;
            pointer-events: none;
        `
        
        this.updateContainerPosition()
        document.body.appendChild(this.container)
    }
    
    updateContainerPosition() {
        const position = this.options.position
        const positions = {
            'top-left': 'top: 20px; left: 20px;',
            'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
            'top-right': 'top: 20px; right: 20px;',
            'bottom-left': 'bottom: 20px; left: 20px;',
            'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);',
            'bottom-right': 'bottom: 20px; right: 20px;'
        }
        
        this.container.style.cssText += positions[position] || positions['top-right']
    }
    
    setupStyles() {
        if (document.querySelector('#message-manager-styles')) return
        
        const styles = document.createElement('style')
        styles.id = 'message-manager-styles'
        styles.textContent = `
            .message-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .message {
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.4;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                backdrop-filter: blur(10px);
                pointer-events: auto;
                animation: messageSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                max-width: 100%;
                word-break: break-word;
            }
            
            .message-content {
                flex: 1;
            }
            
            .message-close {
                background: none;
                border: none;
                color: inherit;
                opacity: 0.7;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.2s;
            }
            
            .message-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .message-success {
                background: rgba(16, 185, 129, 0.95);
                color: white;
                border-left: 4px solid #059669;
            }
            
            .message-error {
                background: rgba(239, 68, 68, 0.95);
                color: white;
                border-left: 4px solid #dc2626;
            }
            
            .message-info {
                background: rgba(14, 165, 233, 0.95);
                color: white;
                border-left: 4px solid #0284c7;
            }
            
            .message-warning {
                background: rgba(245, 158, 11, 0.95);
                color: white;
                border-left: 4px solid #d97706;
            }
            
            .message-loading {
                background: rgba(100, 116, 139, 0.95);
                color: white;
                border-left: 4px solid #475569;
            }
            
            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes messageSlideOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }
            
            .message-exit {
                animation: messageSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            
            .message-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 0 0 0 4px;
                animation: progressBar ${this.options.dismissTimeout}ms linear forwards;
            }
            
            @keyframes progressBar {
                from { width: 100%; }
                to { width: 0%; }
            }
            
            @media (max-width: 640px) {
                .message-container {
                    max-width: 90vw;
                }
                
                .message {
                    font-size: 13px;
                    padding: 10px 16px;
                }
            }
        `
        document.head.appendChild(styles)
    }
    
    show(message, type = 'info', options = {}) {
        const messageOptions = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: '',
            dismissible: true,
            autoDismiss: this.options.autoDismiss,
            dismissTimeout: this.options.dismissTimeout,
            icon: this.getIconForType(type),
            onDismiss: null,
            ...options
        }
        
        const messageData = {
            ...messageOptions,
            content: message,
            type,
            timestamp: Date.now()
        }
        
        if (this.options.queue && this.activeMessages.size >= this.options.maxMessages) {
            this.messageQueue.push(messageData)
            return messageData.id
        }
        
        return this.displayMessage(messageData)
    }
    
    displayMessage(messageData) {
        const messageElement = this.createMessageElement(messageData)
        this.container.appendChild(messageElement)
        this.activeMessages.set(messageData.id, {
            element: messageElement,
            data: messageData,
            timeout: null
        })
        
        // Set up auto-dismiss
        if (messageData.autoDismiss && messageData.dismissTimeout > 0) {
            const timeout = setTimeout(() => {
                this.dismiss(messageData.id)
            }, messageData.dismissTimeout)
            
            this.activeMessages.get(messageData.id).timeout = timeout
        }
        
        // Update queue
        this.processQueue()
        
        return messageData.id
    }
    
    createMessageElement(messageData) {
        const messageEl = document.createElement('div')
        messageEl.id = `message-${messageData.id}`
        messageEl.className = `message message-${messageData.type}`
        
        // Add progress bar if auto-dismissing
        if (messageData.autoDismiss) {
            const progressBar = document.createElement('div')
            progressBar.className = 'message-progress'
            messageEl.appendChild(progressBar)
        }
        
        const contentDiv = document.createElement('div')
        contentDiv.className = 'message-content'
        
        if (messageData.icon) {
            contentDiv.innerHTML = `${messageData.icon} ${messageData.content}`
        } else {
            contentDiv.textContent = messageData.content
        }
        
        messageEl.appendChild(contentDiv)
        
        // Add close button if dismissible
        if (messageData.dismissible) {
            const closeButton = document.createElement('button')
            closeButton.className = 'message-close'
            closeButton.innerHTML = '×'
            closeButton.setAttribute('aria-label', 'Close message')
            closeButton.addEventListener('click', () => this.dismiss(messageData.id))
            messageEl.appendChild(closeButton)
        }
        
        return messageEl
    }
    
    dismiss(messageId) {
        const message = this.activeMessages.get(messageId)
        if (!message) return
        
        // Clear timeout if exists
        if (message.timeout) {
            clearTimeout(message.timeout)
        }
        
        // Add exit animation
        message.element.classList.add('message-exit')
        
        // Remove element after animation
        setTimeout(() => {
            if (message.element.parentNode) {
                message.element.remove()
            }
            this.activeMessages.delete(messageId)
            
            // Call onDismiss callback
            if (message.data.onDismiss) {
                message.data.onDismiss()
            }
            
            // Process next in queue
            this.processQueue()
        }, this.options.animationDuration)
    }
    
    dismissAll() {
        for (const [id] of this.activeMessages) {
            this.dismiss(id)
        }
        this.messageQueue = []
    }
    
    processQueue() {
        while (this.messageQueue.length > 0 && this.activeMessages.size < this.options.maxMessages) {
            const messageData = this.messageQueue.shift()
            this.displayMessage(messageData)
        }
    }
    
    update(messageId, newContent, newType = null) {
        const message = this.activeMessages.get(messageId)
        if (!message) return false
        
        if (newContent) {
            message.data.content = newContent
            const contentDiv = message.element.querySelector('.message-content')
            if (contentDiv) {
                contentDiv.textContent = newContent
            }
        }
        
        if (newType && newType !== message.data.type) {
            // Update type class
            message.element.classList.remove(`message-${message.data.type}`)
            message.element.classList.add(`message-${newType}`)
            message.data.type = newType
            
            // Update icon
            const newIcon = this.getIconForType(newType)
            if (newIcon) {
                const contentDiv = message.element.querySelector('.message-content')
                contentDiv.innerHTML = `${newIcon} ${message.data.content}`
            }
        }
        
        return true
    }
    
    getIconForType(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️',
            loading: '⏳'
        }
        return icons[type] || ''
    }
    
    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options)
    }
    
    error(message, options = {}) {
        return this.show(message, 'error', options)
    }
    
    info(message, options = {}) {
        return this.show(message, 'info', options)
    }
    
    warning(message, options = {}) {
        return this.show(message, 'warning', options)
    }
    
    loading(message = 'Loading...', options = {}) {
        return this.show(message, 'loading', { autoDismiss: false, ...options })
    }
    
    dismissLoading(messageId) {
        this.dismiss(messageId)
    }
    
    // Static method for quick usage
    static quickShow(message, type = 'info', timeout = 3000) {
        if (!window._messageManager) {
            window._messageManager = new MessageManager()
        }
        return window._messageManager.show(message, type, { dismissTimeout: timeout })
    }
}

// Export static quick methods
export function showMessage(message, type = 'info', options = {}) {
    if (!window._messageManager) {
        window._messageManager = new MessageManager()
    }
    return window._messageManager.show(message, type, options)
}

export function showSuccess(message, options = {}) {
    return showMessage(message, 'success', options)
}

export function showError(message, options = {}) {
    return showMessage(message, 'error', options)
}

export function showInfo(message, options = {}) {
    return showMessage(message, 'info', options)
}

export function showWarning(message, options = {}) {
    return showMessage(message, 'warning', options)
}

export function showLoading(message = 'Loading...', options = {}) {
    return showMessage(message, 'loading', { autoDismiss: false, ...options })
}

export function dismissMessage(messageId) {
    if (window._messageManager) {
        window._messageManager.dismiss(messageId)
    }
}

export function dismissAllMessages() {
    if (window._messageManager) {
        window._messageManager.dismissAll()
    }
}

// Initialize global message manager
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window._messageManager) {
            window._messageManager = new MessageManager({
                position: 'top-center',
                maxMessages: 3,
                autoDismiss: true,
                dismissTimeout: 3000
            })
        }
    })
}