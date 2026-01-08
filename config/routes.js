// Client-side routing and navigation

import { APP_CONFIG } from './constants.js'
import { showMessage, showError } from '../components/messages.js'
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loader.js'

class Router {
    constructor() {
        this.routes = new Map()
        this.currentRoute = null
        this.currentParams = {}
        this.history = []
        this.maxHistory = 10
        this.isNavigating = false
        
        this.init()
    }
    
    init() {
        // Define routes
        this.defineRoutes()
        
        // Setup popstate listener for browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e)
        })
        
        // Setup link interception
        this.setupLinkInterception()
        
        // Initial route
        this.resolveCurrentRoute()
    }
    
    defineRoutes() {
        // Static routes
        this.addRoute('/', 'home', this.handleHomeRoute.bind(this))
        this.addRoute('/login', 'login', this.handleLoginRoute.bind(this))
        this.addRoute('/auth', 'auth', this.handleAuthRoute.bind(this))
        this.addRoute('/home', 'chat', this.handleChatRoute.bind(this))
        this.addRoute('/profile', 'profile', this.handleProfileRoute.bind(this))
        this.addRoute('/settings', 'settings', this.handleSettingsRoute.bind(this))
        this.addRoute('/meditation', 'meditation', this.handleMeditationRoute.bind(this))
        
        // Dynamic routes
        this.addRoute('/conversation/:id', 'conversation', this.handleConversationRoute.bind(this))
        this.addRoute('/achievement/:id', 'achievement', this.handleAchievementRoute.bind(this))
        
        // Fallback route
        this.addRoute('*', 'not-found', this.handleNotFoundRoute.bind(this))
    }
    
    addRoute(path, name, handler) {
        const pattern = this.pathToRegex(path)
        this.routes.set(name, {
            path,
            pattern,
            handler,
            name
        })
    }
    
    pathToRegex(path) {
        const pattern = path
            .replace(/\//g, '\\/')
            .replace(/:(\w+)/g, '(?<$1>[^\\/]+)')
            .replace(/\*/g, '.*')
        
        return new RegExp(`^${pattern}$`)
    }
    
    matchRoute(url) {
        const path = this.getPathFromUrl(url)
        
        for (const [name, route] of this.routes) {
            const match = path.match(route.pattern)
            if (match) {
                return {
                    route,
                    params: match.groups || {},
                    match
                }
            }
        }
        
        return null
    }
    
    getPathFromUrl(url) {
        try {
            const urlObj = new URL(url, window.location.origin)
            return urlObj.pathname
        } catch {
            return url
        }
    }
    
    resolveCurrentRoute() {
        const url = window.location.pathname + window.location.search
        this.navigate(url, { replace: true, silent: true })
    }
    
    async navigate(url, options = {}) {
        if (this.isNavigating) return false
        
        const {
            replace = false,
            silent = false,
            data = {}
        } = options
        
        try {
            this.isNavigating = true
            
            if (!silent) {
                showLoadingOverlay('Loading...')
            }
            
            const match = this.matchRoute(url)
            
            if (!match) {
                throw new Error(`No route found for: ${url}`)
            }
            
            // Check if it's the same route
            if (this.currentRoute?.name === match.route.name && 
                JSON.stringify(this.currentParams) === JSON.stringify(match.params)) {
                return true
            }
            
            // Store previous route
            const previousRoute = this.currentRoute
            const previousParams = { ...this.currentParams }
            
            // Update current route
            this.currentRoute = match.route
            this.currentParams = match.params
            
            // Add to history
            if (!replace) {
                this.history.push({
                    route: match.route.name,
                    params: match.params,
                    url,
                    timestamp: Date.now()
                })
                
                // Limit history size
                if (this.history.length > this.maxHistory) {
                    this.history.shift()
                }
                
                // Update browser history
                window.history.pushState({
                    route: match.route.name,
                    params: match.params,
                    data
                }, '', url)
            } else {
                // Replace current history entry
                window.history.replaceState({
                    route: match.route.name,
                    params: match.params,
                    data
                }, '', url)
            }
            
            // Execute route handler
            await match.route.handler(match.params, data, previousRoute, previousParams)
            
            // Scroll to top
            window.scrollTo(0, 0)
            
            // Dispatch route change event
            window.dispatchEvent(new CustomEvent('route-changed', {
                detail: {
                    route: match.route.name,
                    params: match.params,
                    url,
                    previousRoute: previousRoute?.name,
                    previousParams
                }
            }))
            
            return true
            
        } catch (error) {
            console.error('Navigation error:', error)
            
            if (!silent) {
                showError('Failed to navigate: ' + error.message)
            }
            
            // Fallback to home or previous route
            if (this.currentRoute?.name !== 'home') {
                this.navigate('/', { replace: true, silent: true })
            }
            
            return false
            
        } finally {
            this.isNavigating = false
            
            if (!silent) {
                hideLoadingOverlay()
            }
        }
    }
    
    goBack() {
        if (window.history.length > 1) {
            window.history.back()
        } else {
            this.navigate('/', { replace: true })
        }
    }
    
    goForward() {
        if (window.history.length > 1) {
            window.history.forward()
        }
    }
    
    handlePopState(event) {
        if (event.state) {
            const { route, params, data } = event.state
            const routeConfig = this.routes.get(route)
            
            if (routeConfig) {
                this.currentRoute = routeConfig
                this.currentParams = params || {}
                routeConfig.handler(params || {}, data)
            }
        } else {
            this.resolveCurrentRoute()
        }
    }
    
    setupLinkInterception() {
        document.addEventListener('click', (e) => {
            // Find the closest anchor tag
            const anchor = e.target.closest('a')
            
            if (!anchor) return
            
            // Check if it's an internal link
            const href = anchor.getAttribute('href')
            if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return
            }
            
            // Check for target="_blank"
            if (anchor.getAttribute('target') === '_blank') {
                return
            }
            
            // Prevent default navigation
            e.preventDefault()
            
            // Navigate using router
            this.navigate(href)
        })
    }
    
    // Route Handlers
    
    async handleHomeRoute(params, data) {
        // Check if user is authenticated
        const isAuthenticated = await this.checkAuth()
        
        if (isAuthenticated) {
            // Redirect to chat if authenticated
            await this.navigate('/home', { replace: true, silent: true })
        } else {
            // Show landing page
            await this.loadPage('home', params, data)
        }
    }
    
    async handleLoginRoute(params, data) {
        // Check if user is already authenticated
        const isAuthenticated = await this.checkAuth()
        
        if (isAuthenticated) {
            // Redirect to home if already logged in
            await this.navigate('/home', { replace: true, silent: true })
        } else {
            // Show login page
            await this.loadPage('login', params, data)
        }
    }
    
    async handleAuthRoute(params, data) {
        // Check if user is already authenticated
        const isAuthenticated = await this.checkAuth()
        
        if (isAuthenticated) {
            // Redirect to home if already logged in
            await this.navigate('/home', { replace: true, silent: true })
        } else {
            // Show auth/signup page
            await this.loadPage('auth', params, data)
        }
    }
    
    async handleChatRoute(params, data) {
        // Check authentication
        const isAuthenticated = await this.checkAuth()
        
        if (!isAuthenticated) {
            // Redirect to login if not authenticated
            await this.navigate('/login', { replace: true })
            return
        }
        
        // Load chat page
        await this.loadPage('chat', params, data)
    }
    
    async handleProfileRoute(params, data) {
        // Check authentication
        const isAuthenticated = await this.checkAuth()
        
        if (!isAuthenticated) {
            // Redirect to login if not authenticated
            await this.navigate('/login', { replace: true })
            return
        }
        
        // Load profile page
        await this.loadPage('profile', params, data)
    }
    
    async handleSettingsRoute(params, data) {
        // Check authentication
        const isAuthenticated = await this.checkAuth()
        
        if (!isAuthenticated) {
            // Redirect to login if not authenticated
            await this.navigate('/login', { replace: true })
            return
        }
        
        // Load settings page
        await this.loadPage('settings', params, data)
    }
    
    async handleMeditationRoute(params, data) {
        // Check authentication
        const isAuthenticated = await this.checkAuth()
        
        if (!isAuthenticated) {
            // Redirect to login if not authenticated
            await this.navigate('/login', { replace: true })
            return
        }
        
        // Load meditation page
        await this.loadPage('meditation', params, data)
    }
    
    async handleConversationRoute(params, data) {
        // Check authentication
        const isAuthenticated = await this.checkAuth()
        
        if (!isAuthenticated) {
            // Redirect to login if not authenticated
            await this.navigate('/login', { replace: true })
            return
        }
        
        // Load conversation page
        await this.loadPage('conversation', params, data)
    }
    
    async handleAchievementRoute(params, data) {
        // Check authentication
        const isAuthenticated = await this.checkAuth()
        
        if (!isAuthenticated) {
            // Redirect to login if not authenticated
            await this.navigate('/login', { replace: true })
            return
        }
        
        // Load achievement page
        await this.loadPage('achievement', params, data)
    }
    
    async handleNotFoundRoute(params, data) {
        // Show 404 page
        await this.loadPage('not-found', params, data)
    }
    
    async loadPage(page, params, data) {
        // This would typically load the page component/template
        // For now, we'll just update the page title and dispatch event
        
        const pageTitles = {
            'home': 'Calm • Peaceful Conversations',
            'login': 'Login • Calm',
            'auth': 'Sign Up • Calm',
            'chat': 'Calm • Chat',
            'profile': 'My Profile • Calm',
            'settings': 'Settings • Calm',
            'meditation': 'Meditation • Calm',
            'conversation': 'Conversation • Calm',
            'achievement': 'Achievement • Calm',
            'not-found': 'Page Not Found • Calm'
        }
        
        // Update page title
        document.title = pageTitles[page] || 'Calm'
        
        // Dispatch page load event
        window.dispatchEvent(new CustomEvent('page-load', {
            detail: {
                page,
                params,
                data
            }
        }))
        
        // For SPA, you would load and render the component here
        // await this.renderComponent(page, params, data)
    }
    
    async checkAuth() {
        try {
            // Check if user session exists
            const session = localStorage.getItem('calm_session')
            if (!session) return false
            
            // Validate session (simplified)
            const sessionData = JSON.parse(session)
            const now = Date.now()
            
            if (sessionData.expiresAt && sessionData.expiresAt < now) {
                // Session expired
                localStorage.removeItem('calm_session')
                return false
            }
            
            return true
        } catch {
            return false
        }
    }
    
    async renderComponent(page, params, data) {
        // This is where you would implement component rendering
        // For example:
        // 1. Fetch component template/HTML
        // 2. Update DOM
        // 3. Initialize component JavaScript
        
        console.log(`Rendering ${page} component with params:`, params)
        
        // For now, just dispatch an event
        window.dispatchEvent(new CustomEvent('component-render', {
            detail: { page, params, data }
        }))
    }
    
    // Public API
    
    getCurrentRoute() {
        return {
            name: this.currentRoute?.name,
            params: { ...this.currentParams },
            path: this.currentRoute?.path
        }
    }
    
    getHistory() {
        return [...this.history]
    }
    
    generateUrl(routeName, params = {}) {
        const route = this.routes.get(routeName)
        if (!route) return '/'
        
        let url = route.path
        
        // Replace params in path
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, value)
        }
        
        return url
    }
    
    redirectToLogin() {
        this.navigate('/login', { replace: true })
    }
    
    redirectToHome() {
        this.navigate('/', { replace: true })
    }
    
    redirectToChat() {
        this.navigate('/home', { replace: true })
    }
}

// Create and export singleton instance
const router = new Router()

// Export for use in other files
export { Router }

// Export convenience functions
export function navigateTo(url, options = {}) {
    return router.navigate(url, options)
}

export function goBack() {
    return router.goBack()
}

export function goForward() {
    return router.goForward()
}

export function getCurrentRoute() {
    return router.getCurrentRoute()
}

export function generateRouteUrl(routeName, params = {}) {
    return router.generateUrl(routeName, params)
}

export function redirectToLogin() {
    return router.redirectToLogin()
}

export function redirectToHome() {
    return router.redirectToHome()
}

export function redirectToChat() {
    return router.redirectToChat()
}

// Export router instance as default
export default router