// ========================================
// HELPERS - Fungsi utilitas
// ========================================

import { CATEGORIES } from './constants.js';

// ========== CONFIGURATION ==========
const CONFIG = {
    TOAST_DURATION: 2000,
    MAX_TOAST_MESSAGE_LENGTH: 100,
    CACHE_DURATION: 5000 // 5 seconds
};

// ========== CACHE ==========
const calculationCache = new Map();
let cacheTimestamp = null;

// ========== ICON MAPPING ==========
const ICON_MAP = new Map([
    ['Makanan', '/icons/category-makanan.svg'],
    ['Transportasi', '/icons/category-transportasi.svg'],
    ['Belanja', '/icons/category-belanja.svg'],
    ['Tagihan', '/icons/category-tagihan.svg'],
    ['Hiburan', '/icons/category-hiburan.svg'],
    ['Lainnya', '/icons/category-lainnya.svg']
]);

const DEFAULT_ICON = '/icons/category-lainnya.svg';

// ========== VALIDATION ==========
const isValidAmount = (amount) => {
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount);
};

const isValidTransactions = (transactions) => {
    return Array.isArray(transactions) && transactions.length >= 0;
};

const sanitizeString = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.trim().slice(0, 200); // Limit length
};

// ========== FORMATTING FUNCTIONS ==========

/**
 * Format number to Rupiah currency
 * @param {number} amount - Amount to format
 * @param {string} locale - Locale for formatting (default: 'id-ID')
 * @returns {string} Formatted Rupiah string
 */
export function formatRupiah(amount, locale = 'id-ID') {
    if (!isValidAmount(amount)) {
        console.warn('Invalid amount provided to formatRupiah:', amount);
        return 'Rp 0';
    }
    
    try {
        return 'Rp ' + amount.toLocaleString(locale);
    } catch (error) {
        console.error('Error formatting Rupiah:', error);
        return 'Rp 0';
    }
}

/**
 * Format date to relative string (Today, Yesterday, or formatted date)
 * @param {string|Date} dateString - Date to format
 * @param {string} locale - Locale for formatting (default: 'id-ID')
 * @returns {string} Formatted date string
 */
export function formatDateRelative(dateString, locale = 'id-ID') {
    if (!dateString) return 'Tanggal tidak valid';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Tanggal tidak valid';
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Normalize input date to start of day for comparison
        const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (inputDate >= today) return 'Hari ini';
        if (inputDate >= yesterday) return 'Kemarin';
        
        return date.toLocaleDateString(locale, { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Tanggal tidak valid';
    }
}

/**
 * Format date for HTML input (YYYY-MM-DD)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string for input
 */
export function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date for input:', error);
        return '';
    }
}

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted number
 */
export function formatNumber(num, locale = 'id-ID') {
    if (!isValidAmount(num)) return '0';
    try {
        return num.toLocaleString(locale);
    } catch (error) {
        return String(num);
    }
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

// ========== CATEGORY FUNCTIONS ==========

/**
 * Get icon path for category
 * @param {string} categoryName - Category name
 * @returns {string} Icon path
 */
export function getCategoryIcon(categoryName) {
    if (!categoryName || typeof categoryName !== 'string') {
        return DEFAULT_ICON;
    }
    return ICON_MAP.get(categoryName) || DEFAULT_ICON;
}

/**
 * Get all categories with their icons
 * @returns {Array} Array of category objects
 */
export function getCategoriesWithIcons() {
    return Array.from(ICON_MAP.keys()).map(name => ({
        name,
        icon: ICON_MAP.get(name)
    }));
}

/**
 * Get category color for charts
 * @param {string} categoryName - Category name
 * @returns {string} Color hex code
 */
export function getCategoryColor(categoryName, index = 0) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    
    if (categoryName && typeof categoryName === 'string') {
        // Consistent color based on category name
        const hash = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }
    
    return colors[index % colors.length];
}

// ========== SECURITY FUNCTIONS ==========

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * AES Encryption utility for sensitive data
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted text
 */
export function encrypt(text, key) {
    if (!text) return '';
    
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const encodedKey = encoder.encode(key.padEnd(32, '0').slice(0, 32));
    
    return btoa(String.fromCharCode(...new Uint8Array(data).map((byte, i) => byte ^ encodedKey[i % encodedKey.length])));
}

/**
 * AES Decryption utility for sensitive data
 * @param {string} encryptedText - Encrypted text
 * @param {string} key - Decryption key
 * @returns {string} Decrypted text
 */
export function decrypt(encryptedText, key) {
    if (!encryptedText) return '';
    
    const encodedKey = new TextEncoder().encode(key.padEnd(32, '0').slice(0, 32));
    const data = Uint8Array.from(atob(encryptedText), char => char.charCodeAt(0));
    
    return new TextDecoder().decode(data.map((byte, i) => byte ^ encodedKey[i % encodedKey.length]));
}

/**
 * Encrypt sensitive transaction data
 * @param {Object} transaction - Transaction object
 * @param {string} key - Encryption key
 * @returns {Object} Encrypted transaction
 */
export function encryptTransaction(transaction, key) {
    return {
        id: transaction.id,
        amount: transaction.amount,
        description: encrypt(transaction.description, key),
        category: encrypt(transaction.category, key),
        type: transaction.type,
        date: encrypt(transaction.date, key),
        createdAt: encrypt(transaction.createdAt, key),
        updatedAt: transaction.updatedAt ? encrypt(transaction.updatedAt, key) : null
    };
}

/**
 * Decrypt sensitive transaction data
 * @param {Object} encryptedTransaction - Encrypted transaction object
 * @param {string} key - Decryption key
 * @returns {Object} Decrypted transaction
 */
export function decryptTransaction(encryptedTransaction, key) {
    return {
        id: encryptedTransaction.id,
        amount: encryptedTransaction.amount,
        description: decrypt(encryptedTransaction.description, key),
        category: decrypt(encryptedTransaction.category, key),
        type: encryptedTransaction.type,
        date: decrypt(encryptedTransaction.date, key),
        createdAt: decrypt(encryptedTransaction.createdAt, key),
        updatedAt: encryptedTransaction.updatedAt ? decrypt(encryptedTransaction.updatedAt, key) : null
    };
}

/**
 * Encrypt all transactions for local storage
 * @param {Array} transactions - Array of transaction objects
 * @param {string} encryptionKey - Encryption key for all data
 * @returns {string} Encrypted transactions string
 */
export function encryptTransactionsForStorage(transactions, encryptionKey) {
    if (!transactions || transactions.length === 0) return '[]';
    
    const encrypted = transactions.map(t => encryptTransaction(t, encryptionKey));
    return btoa(JSON.stringify(encrypted));
}

/**
 * Decrypt transactions from local storage
 * @param {string} encryptedString - Encrypted transactions string
 * @param {string} encryptionKey - Decryption key
 * @returns {Array} Array of decrypted transaction objects
 */
export function decryptTransactionsFromStorage(encryptedString, encryptionKey) {
    if (!encryptedString) return [];
    
    try {
        const encrypted = JSON.parse(atob(encryptedString));
        return encrypted.map(t => decryptTransaction(t, encryptionKey));
    } catch (error) {
        console.error('Failed to decrypt transactions:', error);
        return [];
    }
}

/**
 * Generate secure encryption key
 * @returns {string} Secure encryption key
 */
export function generateEncryptionKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitize input for safe usage
 * @param {any} input - Input to sanitize
 * @param {string} type - Type of sanitization
 * @returns {any} Sanitized input
 */
export function sanitizeInput(input, type = 'string') {
    if (input === null || input === undefined) {
        return type === 'string' ? '' : null;
    }
    
    switch (type) {
        case 'string':
            return escapeHtml(String(input).trim());
        case 'description':
            return escapeHtml(String(input).trim()).slice(0, 200);
        case 'category':
            return escapeHtml(String(input).trim()) || 'Lainnya';
        case 'number':
            const num = Number(input);
            return isValidAmount(num) ? num : 0;
        case 'amount':
            const amount = Number(input);
            return isValidAmount(amount) ? Math.max(0, amount) : 0;
        case 'email':
            const email = String(input).trim().toLowerCase();
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
        case 'date':
            const date = new Date(input);
            return isNaN(date.getTime()) ? null : date.toISOString();
        default:
            return input;
    }
}

// ========== CALCULATION FUNCTIONS ==========

/**
 * Calculate balance (income - expense) with caching
 * @param {Array} transactions - Array of transaction objects
 * @param {boolean} useCache - Whether to use cache
 * @returns {number} Balance amount
 */
export function calculateBalance(transactions, useCache = true) {
    if (!isValidTransactions(transactions)) return 0;
    if (transactions.length === 0) return 0;
    
    // Check cache
    if (useCache) {
        const cacheKey = `balance_${transactions.length}_${transactions.reduce((acc, t) => acc + t.id, '')}`;
        const cached = getCachedResult(cacheKey);
        if (cached !== null) return cached;
    }
    
    try {
        let totalIncome = 0;
        let totalExpense = 0;
        
        for (const t of transactions) {
            if (!isValidAmount(t.amount)) continue;
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else if (t.type === 'expense') {
                totalExpense += t.amount;
            }
        }
        
        const result = totalIncome - totalExpense;
        
        // Cache result
        if (useCache) {
            setCachedResult(`balance_${transactions.length}_${transactions.reduce((acc, t) => acc + t.id, '')}`, result);
        }
        
        return result;
    } catch (error) {
        console.error('Error calculating balance:', error);
        return 0;
    }
}

/**
 * Calculate total income with caching
 * @param {Array} transactions - Array of transaction objects
 * @param {boolean} useCache - Whether to use cache
 * @returns {number} Total income
 */
export function calculateTotalIncome(transactions, useCache = true) {
    if (!isValidTransactions(transactions)) return 0;
    if (transactions.length === 0) return 0;
    
    // Check cache
    if (useCache) {
        const cacheKey = `income_${transactions.length}_${transactions.reduce((acc, t) => acc + t.id, '')}`;
        const cached = getCachedResult(cacheKey);
        if (cached !== null) return cached;
    }
    
    try {
        let total = 0;
        for (const t of transactions) {
            if (t.type === 'income' && isValidAmount(t.amount)) {
                total += t.amount;
            }
        }
        
        if (useCache) {
            setCachedResult(`income_${transactions.length}_${transactions.reduce((acc, t) => acc + t.id, '')}`, total);
        }
        
        return total;
    } catch (error) {
        console.error('Error calculating total income:', error);
        return 0;
    }
}

/**
 * Calculate total expense with caching
 * @param {Array} transactions - Array of transaction objects
 * @param {boolean} useCache - Whether to use cache
 * @returns {number} Total expense
 */
export function calculateTotalExpense(transactions, useCache = true) {
    if (!isValidTransactions(transactions)) return 0;
    if (transactions.length === 0) return 0;
    
    // Check cache
    if (useCache) {
        const cacheKey = `expense_${transactions.length}_${transactions.reduce((acc, t) => acc + t.id, '')}`;
        const cached = getCachedResult(cacheKey);
        if (cached !== null) return cached;
    }
    
    try {
        let total = 0;
        for (const t of transactions) {
            if (t.type === 'expense' && isValidAmount(t.amount)) {
                total += t.amount;
            }
        }
        
        if (useCache) {
            setCachedResult(`expense_${transactions.length}_${transactions.reduce((acc, t) => acc + t.id, '')}`, total);
        }
        
        return total;
    } catch (error) {
        console.error('Error calculating total expense:', error);
        return 0;
    }
}

/**
 * Calculate expense by category with caching
 * @param {Array} transactions - Array of transaction objects
 * @param {boolean} useCache - Whether to use cache
 * @returns {Object} Object with category as key and total as value
 */
export function calculateExpenseByCategory(transactions, useCache = true) {
    if (!isValidTransactions(transactions)) return {};
    if (transactions.length === 0) return {};
    
    // Check cache
    if (useCache) {
        const cacheKey = `category_${transactions.length}_${transactions.reduce((acc, t) => acc + t.id, '')}`;
        const cached = getCachedResult(cacheKey);
        if (cached !== null) return cached;
    }
    
    try {
        const result = {};
        
        for (const t of transactions) {
            if (t.type === 'expense' && isValidAmount(t.amount)) {
                const category = sanitizeInput(t.category, 'string') || 'Lainnya';
                result[category] = (result[category] || 0) + t.amount;
            }
        }
        
        // Sort by amount (descending)
        const sortedResult = {};
        Object.keys(result)
            .sort((a, b) => result[b] - result[a])
            .forEach(key => {
                sortedResult[key] = result[key];
            });
        
        if (useCache) {
            setCachedResult(`category_${transactions.length}_${transactions.reduce((acc, t) => acc + t.id, '')}`, sortedResult);
        }
        
        return sortedResult;
    } catch (error) {
        console.error('Error calculating expense by category:', error);
        return {};
    }
}

/**
 * Calculate all statistics in one pass
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Object with all statistics
 */
export function calculateAllStats(transactions) {
    if (!isValidTransactions(transactions)) {
        return {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            categoryExpense: {},
            transactionCount: 0,
            averageTransaction: 0
        };
    }
    
    if (transactions.length === 0) {
        return {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            categoryExpense: {},
            transactionCount: 0,
            averageTransaction: 0
        };
    }
    
    try {
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryExpense = {};
        let count = 0;
        
        for (const t of transactions) {
            if (!isValidAmount(t.amount)) continue;
            count++;
            
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else if (t.type === 'expense') {
                totalExpense += t.amount;
                const category = sanitizeInput(t.category, 'string') || 'Lainnya';
                categoryExpense[category] = (categoryExpense[category] || 0) + t.amount;
            }
        }
        
        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            categoryExpense,
            transactionCount: count,
            averageTransaction: count > 0 ? (totalIncome + totalExpense) / count : 0
        };
    } catch (error) {
        console.error('Error calculating all stats:', error);
        return {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            categoryExpense: {},
            transactionCount: 0,
            averageTransaction: 0
        };
    }
}

// ========== CACHE MANAGEMENT ==========

const getCachedResult = (key) => {
    if (!calculationCache.has(key)) return null;
    const { value, timestamp } = calculationCache.get(key);
    if (Date.now() - timestamp > CONFIG.CACHE_DURATION) {
        calculationCache.delete(key);
        return null;
    }
    return value;
};

const setCachedResult = (key, value) => {
    calculationCache.set(key, {
        value,
        timestamp: Date.now()
    });
};

/**
 * Clear calculation cache
 */
export function clearCache() {
    calculationCache.clear();
    cacheTimestamp = null;
}

// ========== TOAST NOTIFICATION ==========

let toastTimeout = null;

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms
 * @param {string} type - Toast type (info, success, warning, error)
 */
export function showToast(message, duration = CONFIG.TOAST_DURATION, type = 'info') {
    if (!message || typeof message !== 'string') return;
    
    // Truncate long messages
    const truncatedMessage = truncateText(message, CONFIG.MAX_TOAST_MESSAGE_LENGTH);
    
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast hidden';
        document.body.appendChild(toast);
    }
    
    // Add type class
    toast.className = `toast ${type}`;
    toast.textContent = truncatedMessage;
    
    // Clear previous timeout
    if (toastTimeout) {
        clearTimeout(toastTimeout);
        toastTimeout = null;
    }
    
    // Show toast
    toast.classList.remove('hidden');
    
    // Auto hide
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
        toastTimeout = null;
    }, duration);
}

/**
 * Show success toast
 * @param {string} message - Success message
 */
export function showSuccessToast(message) {
    showToast(message, CONFIG.TOAST_DURATION, 'success');
}

/**
 * Show error toast
 * @param {string} message - Error message
 */
export function showErrorToast(message) {
    showToast(message, CONFIG.TOAST_DURATION * 1.5, 'error');
}

/**
 * Show warning toast
 * @param {string} message - Warning message
 */
export function showWarningToast(message) {
    showToast(message, CONFIG.TOAST_DURATION * 1.2, 'warning');
}

/**
 * Hide toast immediately
 */
export function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('hidden');
    }
    if (toastTimeout) {
        clearTimeout(toastTimeout);
        toastTimeout = null;
    }
}

// ========== DEBOUNCE & THROTTLE ==========

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========== GENERATE SECURE ID ==========

/**
 * Generate a secure unique ID
 * @returns {string} Unique ID
 */
export function generateSecureId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ========== EXPORT ALL ==========
export default {
    formatRupiah,
    formatDateRelative,
    formatDateForInput,
    formatNumber,
    truncateText,
    getCategoryIcon,
    getCategoriesWithIcons,
    getCategoryColor,
    escapeHtml,
    sanitizeInput,
    calculateBalance,
    calculateTotalIncome,
    calculateTotalExpense,
    calculateExpenseByCategory,
    calculateAllStats,
    clearCache,
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    hideToast,
    debounce,
    throttle,
    generateSecureId
};