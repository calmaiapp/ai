import { getUser, signOut } from './utils/auth.js'

async function initApp() {
    const app = document.getElementById('app')
    const authButtons = document.getElementById('authButtons')
    const userInfo = document.getElementById('user-info')
    
    if (!app) return
    
    const result = await getUser()
    
    if (result.success && result.user) {
        // User is logged in
        app.innerHTML = `
            <h1 style="font-size: 32px; margin-bottom: 16px; color: #1e293b;">
                Welcome back
            </h1>
            <p style="color: #64748b; margin-bottom: 32px;">
                Ready for your next peaceful moment?
            </p>
        `
        
        authButtons.innerHTML = `
            <a href="/ai/main/index.html" class="btn btn-primary">
                Go to Dashboard
            </a>
            <button onclick="handleLogout()" class="btn btn-secondary">
                Logout
            </button>
        `
        
        userInfo.innerHTML = `
            <p><strong>Email:</strong> ${result.user.email}</p>
            <p><small>Logged in successfully</small></p>
        `
        userInfo.classList.add('active')
        
    } else {
        // User is not logged in
        app.innerHTML = `
            <h1 style="font-size: 32px; margin-bottom: 16px; color: #1e293b;">
                Find Your Peace
            </h1>
            <p style="color: #64748b; margin-bottom: 32px; max-width: 500px;">
                Join thousands finding calm through guided meditations,<br>
                peaceful conversations, and mindful moments.
            </p>
        `
        
        authButtons.innerHTML = `
            <a href="/ai/login/index.html" class="btn btn-primary">
                Sign In
            </a>
            <a href="/ai/auth/index.html" class="btn btn-secondary">
                Create Account
            </a>
        `
        
        userInfo.classList.remove('active')
    }
}

// Global logout function
window.handleLogout = async function() {
    const result = await signOut()
    if (result.success) {
        window.location.reload()
    } else {
        alert('Logout failed: ' + result.error)
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', initApp)
