// Loading spinners and overlay components
export function createLoadingOverlay() {
    const overlay = document.createElement('div')
    overlay.className = 'loading-overlay'
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(4px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `
    
    const spinner = document.createElement('div')
    spinner.className = 'loading-spinner'
    spinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 3px solid #f0f9ff;
        border-top-color: #0ea5e9;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `
    
    // Add animation if not exists
    if (!document.querySelector('#spinner-animation')) {
        const style = document.createElement('style')
        style.id = 'spinner-animation'
        style.textContent = `
            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `
        document.head.appendChild(style)
    }
    
    overlay.appendChild(spinner)
    document.body.appendChild(overlay)
    
    return overlay
}

export function showLoading(overlay) {
    if (overlay) {
        overlay.style.display = 'flex'
        return true
    }
    return false
}

export function hideLoading(overlay) {
    if (overlay) {
        overlay.style.display = 'none'
        return true
    }
    return false
}

// Create and manage loading button state
export function setButtonLoading(button, isLoading, loadingText = 'Loading...') {
    if (!button) return
    
    if (isLoading) {
        button.dataset.originalText = button.innerHTML
        button.innerHTML = loadingText
        button.disabled = true
    } else {
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText
            delete button.dataset.originalText
        }
        button.disabled = false
    }
}