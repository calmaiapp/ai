// Form utilities and components
export function setupPasswordToggle(inputId, buttonId) {
    const passwordInput = document.getElementById(inputId)
    const toggleButton = buttonId ? document.getElementById(buttonId) : null

    if (!passwordInput) return null

    let isVisible = false

    // Create toggle button if not provided
    if (!toggleButton) {
        const passwordGroup = passwordInput.parentElement
        const toggleHtml = `
            <button type="button" class="password-toggle" 
                    style="position: absolute; right: 12px; top: 40px; background: none; border: none; color: #64748b; cursor: pointer; padding: 8px; z-index: 10;">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" id="${inputId}Eye">
                    <path d="M10 4C4.477 4 0 10 0 10C0 10 4.477 16 10 16C15.523 16 20 10 20 10C20 10 15.523 4 10 4Z" 
                          stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                </svg>
            </button>
        `
        passwordGroup.style.position = 'relative'
        passwordGroup.insertAdjacentHTML('beforeend', toggleHtml)

        const btn = passwordGroup.querySelector('.password-toggle')
        btn.addEventListener('click', togglePasswordVisibility)
        return btn
    } else {
        toggleButton.addEventListener('click', togglePasswordVisibility)
        return toggleButton
    }

    function togglePasswordVisibility() {
        isVisible = !isVisible
        passwordInput.type = isVisible ? 'text' : 'password'
        
        const eyeSvg = document.getElementById(`${inputId}Eye`)
        if (eyeSvg) {
            if (isVisible) {
                eyeSvg.innerHTML = `
                    <path d="M2 2L18 18" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8.5 5.5C9.5 5.2 10.7 5 12 5C16.2 5 19 8 19 8C19 8 18.3 8.8 17 10" 
                          stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M13 9C13 10.1 12.1 11 11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M6.2 6.2C4.9 7.3 4 8.6 4 10C4 12 6 14 9 14C10.4 14 11.7 13.5 12.8 12.8" 
                          stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                `
            } else {
                eyeSvg.innerHTML = `
                    <path d="M10 4C4.477 4 0 10 0 10C0 10 4.477 16 10 16C15.523 16 20 10 20 10C20 10 15.523 4 10 4Z" 
                          stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                `
            }
        }
    }
}

// Setup form validation
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

export function validatePassword(password) {
    return password.length >= 6
}

export function validateUsername(username) {
    return username.length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(username)
}