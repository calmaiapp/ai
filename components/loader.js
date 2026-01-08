// Enhanced loading components with progress and states

export class LoaderManager {
    constructor(options = {}) {
        this.options = {
            type: 'spinner', // spinner, dots, bars, progress, skeleton
            size: 'medium', // small, medium, large
            color: '#0ea5e9',
            text: '',
            showText: true,
            overlay: false,
            fullscreen: false,
            zIndex: 9998,
            ...options
        }
        
        this.loaders = new Map()
        this.overlays = new Map()
        this.skeletons = new Map()
        
        this.setupStyles()
    }
    
    setupStyles() {
        if (document.querySelector('#loader-manager-styles')) return
        
        const styles = document.createElement('style')
        styles.id = 'loader-manager-styles'
        styles.textContent = `
            .loader-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9997;
                animation: fadeIn 0.3s ease;
            }
            
            .loader-overlay.fullscreen {
                background: #f8fafc;
            }
            
            .loader-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                padding: 2rem;
                background: white;
                border-radius: 1rem;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .loader-overlay.fullscreen .loader-container {
                background: transparent;
                box-shadow: none;
            }
            
            .loader {
                display: inline-block;
                position: relative;
            }
            
            .loader-spinner {
                width: 48px;
                height: 48px;
                border: 3px solid rgba(14, 165, 233, 0.1);
                border-top-color: #0ea5e9;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .loader-spinner.small {
                width: 24px;
                height: 24px;
                border-width: 2px;
            }
            
            .loader-spinner.large {
                width: 64px;
                height: 64px;
                border-width: 4px;
            }
            
            .loader-dots {
                width: 48px;
                height: 48px;
                position: relative;
            }
            
            .loader-dots div {
                position: absolute;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #0ea5e9;
                animation-timing-function: cubic-bezier(0, 1, 1, 0);
            }
            
            .loader-dots div:nth-child(1) {
                left: 8px;
                animation: loaderDots1 0.6s infinite;
            }
            
            .loader-dots div:nth-child(2) {
                left: 8px;
                animation: loaderDots2 0.6s infinite;
            }
            
            .loader-dots div:nth-child(3) {
                left: 32px;
                animation: loaderDots2 0.6s infinite;
            }
            
            .loader-dots div:nth-child(4) {
                left: 56px;
                animation: loaderDots3 0.6s infinite;
            }
            
            .loader-dots.small {
                width: 24px;
                height: 24px;
            }
            
            .loader-dots.small div {
                width: 6px;
                height: 6px;
            }
            
            .loader-dots.large {
                width: 64px;
                height: 64px;
            }
            
            .loader-dots.large div {
                width: 16px;
                height: 16px;
            }
            
            .loader-bars {
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }
            
            .loader-bars div {
                width: 6px;
                height: 30px;
                background: #0ea5e9;
                border-radius: 3px;
                animation: loaderBars 1.2s cubic-bezier(0, 0.5, 0.5, 1) infinite;
            }
            
            .loader-bars div:nth-child(1) {
                animation-delay: -0.24s;
            }
            
            .loader-bars div:nth-child(2) {
                animation-delay: -0.12s;
            }
            
            .loader-bars div:nth-child(3) {
                animation-delay: 0;
            }
            
            .loader-progress {
                width: 200px;
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .loader-progress-bar {
                height: 100%;
                background: #0ea5e9;
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .loader-text {
                color: #64748b;
                font-size: 0.875rem;
                font-weight: 500;
                text-align: center;
                margin-top: 0.5rem;
            }
            
            .skeleton {
                background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
                background-size: 200% 100%;
                animation: skeletonLoading 1.5s ease-in-out infinite;
                border-radius: 0.375rem;
            }
            
            .skeleton-text {
                height: 1rem;
                margin-bottom: 0.5rem;
            }
            
            .skeleton-circle {
                border-radius: 50%;
            }
            
            .skeleton-rectangle {
                border-radius: 0.375rem;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes loaderDots1 {
                0% { transform: scale(0); }
                100% { transform: scale(1); }
            }
            
            @keyframes loaderDots3 {
                0% { transform: scale(1); }
                100% { transform: scale(0); }
            }
            
            @keyframes loaderDots2 {
                0% { transform: translate(0, 0); }
                100% { transform: translate(24px, 0); }
            }
            
            @keyframes loaderBars {
                0% {
                    transform: scale(1);
                }
                20% {
                    transform: scale(1, 2);
                }
                40% {
                    transform: scale(1);
                }
            }
            
            @keyframes skeletonLoading {
                0% {
                    background-position: 200% 0;
                }
                100% {
                    background-position: -200% 0;
                }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `
        document.head.appendChild(styles)
    }
    
    createLoader(id, options = {}) {
        const loaderOptions = { ...this.options, ...options }
        const loaderId = id || `loader-${Date.now()}`
        
        const loaderElement = this.createLoaderElement(loaderOptions)
        
        if (loaderOptions.overlay) {
            const overlay = this.createOverlay(loaderId, loaderElement, loaderOptions)
            this.overlays.set(loaderId, { element: overlay, options: loaderOptions })
            return { id: loaderId, type: 'overlay', element: overlay }
        } else {
            this.loaders.set(loaderId, { element: loaderElement, options: loaderOptions })
            return { id: loaderId, type: 'inline', element: loaderElement }
        }
    }
    
    createLoaderElement(options) {
        const container = document.createElement('div')
        container.className = 'loader-container'
        
        let loaderElement
        
        switch (options.type) {
            case 'dots':
                loaderElement = this.createDotsLoader(options)
                break
            case 'bars':
                loaderElement = this.createBarsLoader(options)
                break
            case 'progress':
                loaderElement = this.createProgressLoader(options)
                break
            case 'skeleton':
                return this.createSkeletonLoader(options)
            default:
                loaderElement = this.createSpinnerLoader(options)
        }
        
        container.appendChild(loaderElement)
        
        if (options.showText && options.text) {
            const textElement = document.createElement('div')
            textElement.className = 'loader-text'
            textElement.textContent = options.text
            container.appendChild(textElement)
        }
        
        return container
    }
    
    createSpinnerLoader(options) {
        const spinner = document.createElement('div')
        spinner.className = `loader-spinner ${options.size}`
        spinner.style.borderTopColor = options.color
        
        const loader = document.createElement('div')
        loader.className = 'loader'
        loader.appendChild(spinner)
        
        return loader
    }
    
    createDotsLoader(options) {
        const dots = document.createElement('div')
        dots.className = `loader-dots ${options.size}`
        
        for (let i = 0; i < 4; i++) {
            const dot = document.createElement('div')
            dot.style.background = options.color
            dots.appendChild(dot)
        }
        
        const loader = document.createElement('div')
        loader.className = 'loader'
        loader.appendChild(dots)
        
        return loader
    }
    
    createBarsLoader(options) {
        const bars = document.createElement('div')
        bars.className = 'loader-bars'
        
        for (let i = 0; i < 3; i++) {
            const bar = document.createElement('div')
            bar.style.background = options.color
            bars.appendChild(bar)
        }
        
        const loader = document.createElement('div')
        loader.className = 'loader'
        loader.appendChild(bars)
        
        return loader
    }
    
    createProgressLoader(options) {
        const progress = document.createElement('div')
        progress.className = 'loader-progress'
        
        const progressBar = document.createElement('div')
        progressBar.className = 'loader-progress-bar'
        progressBar.style.width = '0%'
        
        progress.appendChild(progressBar)
        return progress
    }
    
    createSkeletonLoader(options) {
        const skeleton = document.createElement('div')
        skeleton.className = 'skeleton'
        
        if (options.shape === 'circle') {
            skeleton.classList.add('skeleton-circle')
            skeleton.style.width = options.size === 'small' ? '24px' : 
                                 options.size === 'large' ? '64px' : '48px'
            skeleton.style.height = skeleton.style.width
        } else if (options.shape === 'text') {
            skeleton.classList.add('skeleton-text')
            skeleton.style.width = options.width || '100%'
            skeleton.style.height = options.height || '1rem'
        } else {
            skeleton.classList.add('skeleton-rectangle')
            skeleton.style.width = options.width || '100%'
            skeleton.style.height = options.height || '100%'
        }
        
        return skeleton
    }
    
    createOverlay(id, content, options) {
        const overlay = document.createElement('div')
        overlay.id = `loader-overlay-${id}`
        overlay.className = 'loader-overlay'
        overlay.style.zIndex = options.zIndex
        
        if (options.fullscreen) {
            overlay.classList.add('fullscreen')
        }
        
        overlay.appendChild(content)
        document.body.appendChild(overlay)
        
        return overlay
    }
    
    showLoader(id, options = {}) {
        const existingLoader = this.loaders.get(id) || this.overlays.get(id)
        
        if (existingLoader) {
            this.updateLoader(id, options)
            return id
        }
        
        const loader = this.createLoader(id, options)
        return loader.id
    }
    
    updateLoader(id, updates = {}) {
        const loader = this.loaders.get(id) || this.overlays.get(id)
        if (!loader) return false
        
        Object.assign(loader.options, updates)
        
        // Update progress if it's a progress loader
        if (updates.progress !== undefined && loader.options.type === 'progress') {
            const progressBar = loader.element.querySelector('.loader-progress-bar')
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(0, updates.progress))}%`
            }
        }
        
        // Update text
        if (updates.text !== undefined && loader.options.showText) {
            const textElement = loader.element.querySelector('.loader-text')
            if (textElement) {
                textElement.textContent = updates.text
            }
        }
        
        return true
    }
    
    hideLoader(id) {
        const loader = this.loaders.get(id)
        const overlay = this.overlays.get(id)
        
        if (loader) {
            if (loader.element.parentNode) {
                loader.element.style.animation = 'fadeOut 0.3s ease'
                setTimeout(() => {
                    if (loader.element.parentNode) {
                        loader.element.remove()
                    }
                }, 300)
            }
            this.loaders.delete(id)
        }
        
        if (overlay) {
            overlay.element.style.animation = 'fadeOut 0.3s ease'
            setTimeout(() => {
                if (overlay.element.parentNode) {
                    overlay.element.remove()
                }
            }, 300)
            this.overlays.delete(id)
        }
        
        return true
    }
    
    hideAllLoaders() {
        for (const [id] of this.loaders) {
            this.hideLoader(id)
        }
        for (const [id] of this.overlays) {
            this.hideLoader(id)
        }
    }
    
    createSkeletonScreen(elementId, options = {}) {
        const element = document.getElementById(elementId)
        if (!element) return null
        
        const skeletonId = `skeleton-${elementId}`
        const originalHTML = element.innerHTML
        const originalDisplay = element.style.display
        
        // Hide original content
        element.dataset.originalContent = originalHTML
        element.style.display = 'none'
        
        // Create skeleton container
        const skeletonContainer = document.createElement('div')
        skeletonContainer.id = skeletonId
        skeletonContainer.className = 'skeleton-container'
        
        const skeletonOptions = {
            type: 'skeleton',
            count: options.count || 3,
            shape: options.shape || 'text',
            ...options
        }
        
        // Create skeleton items
        for (let i = 0; i < skeletonOptions.count; i++) {
            const skeleton = this.createSkeletonLoader(skeletonOptions)
            skeletonContainer.appendChild(skeleton)
        }
        
        // Insert skeleton before element
        element.parentNode.insertBefore(skeletonContainer, element)
        
        this.skeletons.set(skeletonId, {
            element: skeletonContainer,
            target: element,
            originalDisplay
        })
        
        return skeletonId
    }
    
    removeSkeleton(skeletonId) {
        const skeleton = this.skeletons.get(skeletonId)
        if (!skeleton) return false
        
        // Remove skeleton
        if (skeleton.element.parentNode) {
            skeleton.element.style.animation = 'fadeOut 0.3s ease'
            setTimeout(() => {
                if (skeleton.element.parentNode) {
                    skeleton.element.remove()
                }
            }, 300)
        }
        
        // Restore original content
        if (skeleton.target) {
            skeleton.target.style.display = skeleton.originalDisplay
            if (skeleton.target.dataset.originalContent) {
                skeleton.target.innerHTML = skeleton.target.dataset.originalContent
                delete skeleton.target.dataset.originalContent
            }
        }
        
        this.skeletons.delete(skeletonId)
        return true
    }
    
    // Static utility methods
    static showOverlay(text = 'Loading...', options = {}) {
        if (!window._loaderManager) {
            window._loaderManager = new LoaderManager()
        }
        return window._loaderManager.showLoader(null, {
            overlay: true,
            text,
            ...options
        })
    }
    
    static hideOverlay(loaderId) {
        if (window._loaderManager) {
            window._loaderManager.hideLoader(loaderId)
        }
    }
    
    static showInline(parentElement, options = {}) {
        if (!window._loaderManager) {
            window._loaderManager = new LoaderManager()
        }
        
        const loader = window._loaderManager.createLoader(null, options)
        if (parentElement) {
            parentElement.appendChild(loader.element)
        }
        return loader.id
    }
    
    static createProgress(id, initialProgress = 0) {
        if (!window._loaderManager) {
            window._loaderManager = new LoaderManager()
        }
        return window._loaderManager.showLoader(id, {
            type: 'progress',
            progress: initialProgress,
            showText: true,
            text: `${initialProgress}%`
        })
    }
    
    static updateProgress(loaderId, progress, text = null) {
        if (window._loaderManager) {
            const updates = { progress }
            if (text !== null) {
                updates.text = text
            }
            window._loaderManager.updateLoader(loaderId, updates)
        }
    }
}

// Export convenience functions
export function showLoadingOverlay(text = 'Loading...', options = {}) {
    return LoaderManager.showOverlay(text, options)
}

export function hideLoadingOverlay(loaderId) {
    LoaderManager.hideOverlay(loaderId)
}

export function showInlineLoader(parentElement, options = {}) {
    return LoaderManager.showInline(parentElement, options)
}

export function createProgressLoader(id, initialProgress = 0) {
    return LoaderManager.createProgress(id, initialProgress)
}

export function updateProgressLoader(loaderId, progress, text = null) {
    LoaderManager.updateProgress(loaderId, progress, text)
}

export function createSkeleton(elementId, options = {}) {
    if (!window._loaderManager) {
        window._loaderManager = new LoaderManager()
    }
    return window._loaderManager.createSkeletonScreen(elementId, options)
}

export function removeSkeleton(skeletonId) {
    if (window._loaderManager) {
        return window._loaderManager.removeSkeleton(skeletonId)
    }
    return false
}

// Initialize global loader manager
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window._loaderManager) {
            window._loaderManager = new LoaderManager()
        }
    })
}
