// Unified API service for all HTTP requests

import { Storage } from '../utils/storage.js'
import { showMessage, showError } from '../components/messages.js'
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loader.js'

class ApiService {
    constructor(baseURL = '') {
        this.baseURL = baseURL
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        this.requestInterceptors = []
        this.responseInterceptors = []
        this.setupInterceptors()
    }
    
    setupInterceptors() {
        // Request interceptor for auth token
        this.addRequestInterceptor(async (config) => {
            // Add auth token if available
            const session = Storage.getSession()
            if (session?.token) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${session.token}`
                }
            }
            
            // Add request timestamp
            config.headers['X-Request-Timestamp'] = Date.now()
            
            return config
        })
        
        // Response interceptor for error handling
        this.addResponseInterceptor(async (response) => {
            if (!response.ok) {
                throw await this.handleError(response)
            }
            
            const data = await response.json()
            
            // Cache successful responses
            if (response.headers.get('Cache-Control')?.includes('max-age')) {
                const cacheKey = this.getCacheKey(response.url, response.method)
                Storage.setCache(cacheKey, data)
            }
            
            return data
        }, (error) => {
            return Promise.reject(this.handleNetworkError(error))
        })
    }
    
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor)
    }
    
    addResponseInterceptor(onSuccess, onError) {
        this.responseInterceptors.push({ onSuccess, onError })
    }
    
    async request(endpoint, options = {}) {
        const config = {
            method: 'GET',
            headers: { ...this.defaultHeaders },
            ...options
        }
        
        // Apply request interceptors
        for (const interceptor of this.requestInterceptors) {
            config = await interceptor(config)
        }
        
        const url = this.baseURL + endpoint
        
        // Check cache for GET requests
        if (config.method === 'GET') {
            const cacheKey = this.getCacheKey(url, config.method)
            const cached = Storage.getCache(cacheKey)
            if (cached) {
                return cached
            }
        }
        
        try {
            const response = await fetch(url, config)
            
            // Apply response interceptors
            let result = response
            for (const { onSuccess } of this.responseInterceptors) {
                result = await onSuccess(result)
            }
            
            return result
        } catch (error) {
            // Apply error interceptors
            for (const { onError } of this.responseInterceptors) {
                error = await onError(error)
            }
            throw error
        }
    }
    
    async get(endpoint, options = {}) {
        return this.request(endpoint, { method: 'GET', ...options })
    }
    
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        })
    }
    
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        })
    }
    
    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        })
    }
    
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { method: 'DELETE', ...options })
    }
    
    async handleError(response) {
        const status = response.status
        let message = 'An error occurred'
        
        try {
            const errorData = await response.json()
            message = errorData.message || errorData.error || message
        } catch {
            message = response.statusText || message
        }
        
        const error = new Error(message)
        error.status = status
        error.response = response
        
        // Handle specific status codes
        switch (status) {
            case 401:
                // Unauthorized - clear session
                Storage.clear()
                showMessage('Session expired. Please login again.', 'error')
                setTimeout(() => {
                    window.location.href = '/ai/login/index.html'
                }, 2000)
                break
                
            case 403:
                showMessage('You do not have permission to perform this action.', 'error')
                break
                
            case 404:
                showMessage('The requested resource was not found.', 'error')
                break
                
            case 429:
                showMessage('Too many requests. Please try again later.', 'error')
                break
                
            case 500:
                showMessage('Server error. Please try again later.', 'error')
                break
                
            default:
                showMessage(message, 'error')
        }
        
        return error
    }
    
    handleNetworkError(error) {
        console.error('Network error:', error)
        
        if (!navigator.onLine) {
            showMessage('You are offline. Please check your connection.', 'error')
        } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            showMessage('Cannot connect to the server. Please try again.', 'error')
        }
        
        return error
    }
    
    getCacheKey(url, method) {
        return `${method}:${url}`
    }
    
    clearCache() {
        Storage.clearCache()
    }
    
    // Convenience methods for common operations
    async withLoading(promise, loadingText = 'Loading...') {
        const loaderId = showLoadingOverlay(loadingText)
        
        try {
            const result = await promise
            return result
        } finally {
            hideLoadingOverlay(loaderId)
        }
    }
    
    async retry(promise, maxRetries = 3, delay = 1000) {
        let lastError
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await promise()
            } catch (error) {
                lastError = error
                
                // Don't retry on certain errors
                if (error.status && [400, 401, 403, 404].includes(error.status)) {
                    break
                }
                
                // Exponential backoff
                await this.sleep(delay * Math.pow(2, i))
            }
        }
        
        throw lastError
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    // File upload helper
    async uploadFile(endpoint, file, fieldName = 'file', additionalData = {}) {
        const formData = new FormData()
        formData.append(fieldName, file)
        
        // Add additional data
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key])
        })
        
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type for FormData
            }
        })
    }
    
    // Pagination helper
    async paginate(endpoint, page = 1, limit = 20, options = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...options.params
        })
        
        const url = `${endpoint}?${params.toString()}`
        const response = await this.get(url, options)
        
        return {
            data: response.data || response,
            page: response.page || page,
            limit: response.limit || limit,
            total: response.total || response.count || 0,
            totalPages: response.totalPages || Math.ceil((response.total || 0) / limit),
            hasNext: response.hasNext || (page < Math.ceil((response.total || 0) / limit)),
            hasPrev: response.hasPrev || (page > 1)
        }
    }
    
    // Batch requests
    async batch(requests) {
        return Promise.all(requests.map(req => 
            this.request(req.endpoint, req.options)
        ))
    }
    
    // Real-time/WebSocket helper
    createWebSocket(url, protocols = []) {
        const ws = new WebSocket(this.baseURL.replace('http', 'ws') + url, protocols)
        
        ws.onopen = () => {
            console.log('WebSocket connected')
        }
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
        }
        
        ws.onclose = () => {
            console.log('WebSocket disconnected')
        }
        
        return ws
    }
}

// Create singleton instance
const api = new ApiService()

// Export singleton and class
export { ApiService }
export default api