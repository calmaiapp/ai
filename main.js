import { getCurrentUser } from '/ai/utils/auth-core.js'
import { showMessage } from '/ai/components/messages.js'

async function initApp() {
    const app = document.getElementById('app')
    const authButtons = document.getElementById('authButtons')
    const userInfo = document.getElementById('userInfo')
    
    if (!app) return
    
    const result = await getCurrentUser()
    
    if (result.success && result.user) {
        // User is logged in, show home page
        app.innerHTML = `
            <div style="text-align: center;">
                <h1 style="font-size: 32px; margin-bottom: 16px; color: #1e293b;">
                    Welcome back to Calm
                </h1>
                <p style="color: #64748b; margin-bottom: 32px; max-width: 500px;">
                    Continue your peaceful journey
                </p>
                <a href="/ai/home/index.html" class="btn btn-primary" style="display: inline-block;">
                    Enter Calm
                </a>
            </div>
        `
        
        // Update user info
        if (userInfo) {
            const username = result.user.user_metadata?.username || 
                           result.user.email.split('@')[0]
            
            userInfo.innerHTML = `
                <div style="text-align: center;">
                    <div style="
                        width: 60px;
                        height: 60px;
                        background: #0ea5e9;
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 24px;
                        margin: 0 auto 16px;
                    ">
                        ${username.charAt(0).toUpperCase()}
                    </div>
                    <h3 style="margin-bottom: 8px; color: #1e293b;">
                        ${username}
                    </h3>
                    <p style="color: #64748b; margin-bottom: 16px; font-size: 14px;">
                        ${result.user.email}
                    </p>
                    <button onclick="handleLogout()" style="
                        padding: 8px 16px;
                        background: #f1f5f9;
                        color: #0ea5e9;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        Sign Out
                    </button>
                </div>
            `
            userInfo.classList.add('active')
        }
        
        authButtons.innerHTML = ''
        
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
        
        if (userInfo) userInfo.classList.remove('active')
    }
}

// Global logout function
window.handleLogout = async function() {
    try {
        const { signOut } = await import('/ai/utils/auth-core.js')
        const result = await signOut()
        
        if (result.success) {
            showMessage('Signed out successfully', 'success')
            setTimeout(() => {
                window.location.reload()
            }, 1500)
        } else {
            showMessage('Logout failed: ' + result.error, 'error')
        }
    } catch (error) {
        showMessage('Logout error: ' + error.message, 'error')
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', initApp)

// Handle service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/ai/service-worker.js').then(
            (registration) => {
                console.log('ServiceWorker registration successful')
            },
            (err) => {
                console.log('ServiceWorker registration failed: ', err)
            }
        )
    })
}