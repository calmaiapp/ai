// Message/Alert system - reusable across all pages
export function showMessage(message, type = 'info') {
    // Remove any existing message
    const existingMsg = document.querySelector('.message-alert')
    if (existingMsg) existingMsg.remove()

    // Create message element
    const msgEl = document.createElement('div')
    msgEl.className = `message-alert ${type}`
    msgEl.textContent = message
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
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#0ea5e9',
        warning: '#f59e0b'
    }
    msgEl.style.backgroundColor = colors[type] || colors.info

    // Add animation styles
    if (!document.querySelector('#message-animations')) {
        const style = document.createElement('style')
        style.id = 'message-animations'
        style.textContent = `
            @keyframes slideDown {
                from { top: -50px; opacity: 0; }
                to { top: 20px; opacity: 1; }
            }
            @keyframes slideUp {
                from { top: 20px; opacity: 1; }
                to { top: -50px; opacity: 0; }
            }
        `
        document.head.appendChild(style)
    }

    document.body.appendChild(msgEl)

    // Remove message after 3 seconds
    setTimeout(() => {
        if (msgEl.parentNode) {
            msgEl.style.animation = 'slideUp 0.3s ease'
            setTimeout(() => {
                if (msgEl.parentNode) {
                    msgEl.remove()
                }
            }, 300)
        }
    }, 3000)

    return msgEl
}