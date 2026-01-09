// Enhanced form components with validation and UI

import { Validation, validationRules } from '../utils/validation.js'
import { showMessage } from './messages.js'

// Password toggle function
export function setupPasswordToggle(inputId, options = {}) {
    const input = document.getElementById(inputId)
    if (!input) return null
    
    const container = input.parentElement
    const toggleButton = document.createElement('button')
    
    toggleButton.type = 'button'
    toggleButton.className = options.className || 'password-toggle'
    toggleButton.innerHTML = options.showIcon || '👁️'
    toggleButton.setAttribute('aria-label', 'Show password')
    
    toggleButton.style.cssText = `
        position: absolute;
        right: 12px;
        top: ${container.tagName === 'LABEL' ? '40px' : '50%'};
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        font-size: 16px;
        opacity: 0.7;
        z-index: 10;
    `
    
    if (container.style.position !== 'absolute' && container.style.position !== 'relative') {
        container.style.position = 'relative'
    }
    
    container.appendChild(toggleButton)
    
    toggleButton.addEventListener('click', () => {
        if (input.type === 'password') {
            input.type = 'text'
            toggleButton.innerHTML = options.hideIcon || '🙈'
            toggleButton.setAttribute('aria-label', 'Hide password')
        } else {
            input.type = 'password'
            toggleButton.innerHTML = options.showIcon || '👁️'
            toggleButton.setAttribute('aria-label', 'Show password')
        }
    })
    
    return toggleButton
}

export class FormManager {
    constructor(formElement, options = {}) {
        this.form = formElement
        this.options = {
            showErrors: true,
            liveValidation: true,
            autoFocus: true,
            ...options
        }
        
        this.fields = {}
        this.validators = {}
        this.init()
    }
    
    init() {
        // Find all form fields
        this.form.querySelectorAll('input, textarea, select').forEach(field => {
            this.registerField(field)
        })
        
        // Setup form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e))
        
        // Setup live validation if enabled
        if (this.options.liveValidation) {
            this.setupLiveValidation()
        }
        
        // Auto focus first field
        if (this.options.autoFocus && this.form.elements[0]) {
            setTimeout(() => {
                this.form.elements[0].focus()
            }, 100)
        }
    }
    
    registerField(field) {
        const fieldName = field.name || field.id
        
        if (!fieldName) return
        
        this.fields[fieldName] = {
            element: field,
            value: field.value,
            valid: null,
            error: null
        }
        
        // Add validation rules based on field type
        this.setupFieldValidation(fieldName, field)
        
        // Add change listeners
        field.addEventListener('input', () => this.validateField(fieldName))
        field.addEventListener('blur', () => this.validateField(fieldName, true))
    }
    
    setupFieldValidation(fieldName, field) {
        const type = field.type
        const name = field.name || field.id
        
        // Set validator based on field properties
        if (field.dataset.validate) {
            this.validators[fieldName] = field.dataset.validate
        } else if (type === 'email') {
            this.validators[fieldName] = 'email'
        } else if (type === 'password') {
            this.validators[fieldName] = 'password'
        } else if (name.includes('username')) {
            this.validators[fieldName] = 'username'
        } else {
            this.validators[fieldName] = 'text'
        }
    }
    
    setupLiveValidation() {
        Object.keys(this.fields).forEach(fieldName => {
            const field = this.fields[fieldName].element
            
            field.addEventListener('input', () => {
                this.validateField(fieldName)
            })
            
            field.addEventListener('blur', () => {
                this.validateField(fieldName, true)
            })
        })
    }
    
    validateField(fieldName, showError = false) {
        const field = this.fields[fieldName]
        if (!field) return
        
        const value = field.element.value.trim()
        const validator = this.validators[fieldName]
        
        let validationResult
        switch (validator) {
            case 'email':
                validationResult = Validation.email(value)
                break
            case 'username':
                validationResult = Validation.username(value)
                break
            case 'password':
                validationResult = Validation.password(value)
                break
            case 'required':
                validationResult = Validation.text(value, { minLength: 1 })
                break
            default:
                validationResult = { valid: true, value }
        }
        
        field.valid = validationResult.valid
        field.value = validationResult.value
        field.error = validationResult.error
        
        // Update UI
        this.updateFieldUI(fieldName, validationResult.valid, showError)
        
        return validationResult
    }
    
    updateFieldUI(fieldName, isValid, showError) {
        const field = this.fields[fieldName]
        if (!field || !this.options.showErrors) return
        
        const element = field.element
        const parent = element.parentElement
        
        // Remove existing error classes
        element.classList.remove('is-invalid', 'is-valid')
        if (parent) {
            parent.classList.remove('has-error', 'has-success')
        }
        
        // Remove existing error message
        const existingError = parent?.querySelector('.field-error')
        if (existingError) {
            existingError.remove()
        }
        
        // Add validation classes
        if (element.value.trim() !== '') {
            if (isValid) {
                element.classList.add('is-valid')
                if (parent) parent.classList.add('has-success')
            } else {
                element.classList.add('is-invalid')
                if (parent) parent.classList.add('has-error')
                
                // Show error message
                if (showError && field.error && parent) {
                    const errorEl = document.createElement('div')
                    errorEl.className = 'field-error'
                    errorEl.textContent = field.error
                    errorEl.style.cssText = `
                        color: #ef4444;
                        font-size: 12px;
                        margin-top: 4px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    `
                    parent.appendChild(errorEl)
                }
            }
        }
    }
    
    async validateForm() {
        const errors = {}
        const values = {}
        let isValid = true
        
        // Validate all fields
        for (const fieldName in this.fields) {
            const result = this.validateField(fieldName, true)
            
            if (!result.valid) {
                errors[fieldName] = result.error
                isValid = false
            }
            
            values[fieldName] = result.value
        }
        
        // Custom validation if provided
        if (this.options.customValidation) {
            const customResult = this.options.customValidation(values)
            if (!customResult.valid) {
                Object.assign(errors, customResult.errors)
                isValid = false
            }
        }
        
        return {
            valid: isValid,
            errors,
            values
        }
    }
    
    async handleSubmit(event) {
        event.preventDefault()
        
        // Show loading state
        this.setLoading(true)
        
        // Validate form
        const validation = await this.validateForm()
        
        if (!validation.valid) {
            this.setLoading(false)
            
            // Show first error
            const firstError = Object.values(validation.errors)[0]
            if (firstError) {
                showMessage(firstError, 'error')
            }
            
            return
        }
        
        // Call submit handler
        if (this.options.onSubmit) {
            try {
                const result = await this.options.onSubmit(validation.values)
                
                if (result && result.success === false) {
                    showMessage(result.error || 'Submission failed', 'error')
                    
                    // Show field errors if provided
                    if (result.fieldErrors) {
                        this.showFieldErrors(result.fieldErrors)
                    }
                } else {
                    // Success - reset form
                    if (this.options.resetOnSuccess) {
                        this.resetForm()
                    }
                }
            } catch (error) {
                showMessage(error.message || 'An error occurred', 'error')
            } finally {
                this.setLoading(false)
            }
        } else {
            this.setLoading(false)
        }
    }
    
    setLoading(isLoading) {
        const submitButton = this.form.querySelector('button[type="submit"]')
        if (!submitButton) return
        
        if (isLoading) {
            submitButton.disabled = true
            submitButton.dataset.originalText = submitButton.innerHTML
            submitButton.innerHTML = `
                <span class="loading-text">
                    <span class="loading-dots">...</span>
                </span>
            `
            
            // Add loading styles
            const style = document.createElement('style')
            style.textContent = `
                .loading-dots {
                    display: inline-block;
                    position: relative;
                    width: 20px;
                }
                .loading-dots:after {
                    content: '...';
                    position: absolute;
                    left: 0;
                    animation: dotPulse 1.5s infinite;
                }
                @keyframes dotPulse {
                    0%, 20% { content: '.'; }
                    40% { content: '..'; }
                    60%, 100% { content: '...'; }
                }
            `
            document.head.appendChild(style)
        } else {
            submitButton.disabled = false
            if (submitButton.dataset.originalText) {
                submitButton.innerHTML = submitButton.dataset.originalText
                delete submitButton.dataset.originalText
            }
        }
    }
    
    showFieldErrors(fieldErrors) {
        Object.keys(fieldErrors).forEach(fieldName => {
            const field = this.fields[fieldName]
            if (field) {
                field.error = fieldErrors[fieldName]
                this.updateFieldUI(fieldName, false, true)
            }
        })
    }
    
    resetForm() {
        this.form.reset()
        
        // Clear validation states
        Object.keys(this.fields).forEach(fieldName => {
            this.fields[fieldName].valid = null
            this.fields[fieldName].error = null
            this.updateFieldUI(fieldName, null, false)
        })
    }
    
    getFieldValue(fieldName) {
        const field = this.fields[fieldName]
        return field ? field.value : null
    }
    
    setFieldValue(fieldName, value) {
        const field = this.fields[fieldName]
        if (field) {
            field.element.value = value
            field.value = value
            this.validateField(fieldName)
        }
    }
}

// Form components
export function createForm(options = {}) {
    const {
        id = `form-${Date.now()}`,
        className = '',
        onSubmit,
        children
    } = options
    
    const form = document.createElement('form')
    form.id = id
    form.className = `form ${className}`
    form.setAttribute('novalidate', '')
    
    if (children) {
        if (typeof children === 'string') {
            form.innerHTML = children
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    form.insertAdjacentHTML('beforeend', child)
                } else {
                    form.appendChild(child)
                }
            })
        }
    }
    
    return form
}

export function createInput(options = {}) {
    const {
        type = 'text',
        name,
        id = name || `input-${Date.now()}`,
        label,
        placeholder,
        value = '',
        required = false,
        disabled = false,
        className = '',
        validation,
        showPasswordToggle = false
    } = options
    
    const container = document.createElement('div')
    container.className = 'form-group'
    
    if (label) {
        const labelEl = document.createElement('label')
        labelEl.htmlFor = id
        labelEl.textContent = label
        if (required) {
            labelEl.innerHTML += ' <span class="required">*</span>'
        }
        container.appendChild(labelEl)
    }
    
    const inputWrapper = document.createElement('div')
    inputWrapper.style.position = 'relative'
    
    const input = document.createElement('input')
    input.type = type
    input.id = id
    input.name = name || id
    input.value = value
    input.placeholder = placeholder || ''
    input.className = `form-input ${className}`
    input.required = required
    input.disabled = disabled
    
    if (validation) {
        input.dataset.validate = validation
    }
    
    inputWrapper.appendChild(input)
    container.appendChild(inputWrapper)
    
    // Add password toggle if requested
    if (showPasswordToggle && type === 'password') {
        setupPasswordToggle(id, {
            showIcon: '👁️',
            hideIcon: '🙈'
        })
    }
    
    return container
}

export function createTextarea(options = {}) {
    const {
        name,
        id = name || `textarea-${Date.now()}`,
        label,
        placeholder,
        value = '',
        rows = 4,
        required = false,
        disabled = false,
        className = ''
    } = options
    
    const container = document.createElement('div')
    container.className = 'form-group'
    
    if (label) {
        const labelEl = document.createElement('label')
        labelEl.htmlFor = id
        labelEl.textContent = label
        if (required) {
            labelEl.innerHTML += ' <span class="required">*</span>'
        }
        container.appendChild(labelEl)
    }
    
    const textarea = document.createElement('textarea')
    textarea.id = id
    textarea.name = name || id
    textarea.value = value
    textarea.placeholder = placeholder || ''
    textarea.rows = rows
    textarea.className = `form-textarea ${className}`
    textarea.required = required
    textarea.disabled = disabled
    
    container.appendChild(textarea)
    
    return container
}

export function createButton(options = {}) {
    const {
        type = 'button',
        text,
        variant = 'primary', // primary, secondary, danger, success
        size = 'medium', // small, medium, large
        disabled = false,
        loading = false,
        onClick,
        className = '',
        icon
    } = options
    
    const button = document.createElement('button')
    button.type = type
    button.className = `btn btn-${variant} btn-${size} ${className}`
    button.disabled = disabled
    
    if (icon) {
        const iconSpan = document.createElement('span')
        iconSpan.className = 'btn-icon'
        iconSpan.innerHTML = icon
        button.appendChild(iconSpan)
    }
    
    const textSpan = document.createElement('span')
    textSpan.className = 'btn-text'
    textSpan.textContent = text
    button.appendChild(textSpan)
    
    if (loading) {
        button.classList.add('loading')
        const spinner = document.createElement('span')
        spinner.className = 'btn-spinner'
        button.appendChild(spinner)
    }
    
    if (onClick) {
        button.addEventListener('click', onClick)
    }
    
    return button
}

// Form validation styles
export function injectFormStyles() {
    const style = document.createElement('style')
    style.textContent = `
        .form-group {
            margin-bottom: 1.5rem;
            position: relative;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #1e293b;
        }
        
        .form-group .required {
            color: #ef4444;
        }
        
        .form-input, .form-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-family: inherit;
            color: #1e293b;
            background: #f8fafc;
            transition: all 0.2s;
        }
        
        .form-input:focus, .form-textarea:focus {
            outline: none;
            border-color: #0ea5e9;
            background: white;
            box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
        
        .form-input::placeholder, .form-textarea::placeholder {
            color: #94a3b8;
        }
        
        .form-input.is-valid, .form-textarea.is-valid {
            border-color: #10b981;
            background-color: rgba(16, 185, 129, 0.05);
        }
        
        .form-input.is-invalid, .form-textarea.is-invalid {
            border-color: #ef4444;
            background-color: rgba(239, 68, 68, 0.05);
        }
        
        .has-success .form-input, .has-success .form-textarea {
            border-color: #10b981;
        }
        
        .has-error .form-input, .has-error .form-textarea {
            border-color: #ef4444;
        }
        
        .field-error {
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
        }
        
        .btn-primary {
            background: #0ea5e9;
            color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
            background: #0284c7;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }
        
        .btn-secondary {
            background: #f1f5f9;
            color: #0ea5e9;
            border: 1px solid #e2e8f0;
        }
        
        .btn-secondary:hover:not(:disabled) {
            background: #e2e8f0;
            border-color: #0ea5e9;
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn.loading {
            position: relative;
            color: transparent;
        }
        
        .btn-spinner {
            position: absolute;
            width: 1.25rem;
            height: 1.25rem;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .btn-small {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
        }
        
        .btn-large {
            padding: 1rem 2rem;
            font-size: 1.125rem;
        }
        
        /* Password toggle button */
        .password-toggle {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            font-size: 16px;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        
        .password-toggle:hover {
            opacity: 1;
        }
    `
    document.head.appendChild(style)
}

// Initialize form styles on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', injectFormStyles)
}