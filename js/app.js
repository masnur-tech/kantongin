// ========================================
// APP - Entry Point & Orchestrator
// ========================================

import {
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    signOut,
    restoreSession,
    handleAuthCallback,
    getCurrentUser,
    isLoggedIn
} from './auth.js';

import {
    saveTransactionsToLocal,
    loadTransactionsFromLocal,
    syncToCloud,
    fetchFromCloud,
    deleteAllFromCloud,
    deleteTransactionFromCloud
} from './database.js';

import {
    renderBalance,
    renderTransactionList,
    renderStatistics,
    renderProfile,
    generateMonthOptions,
    updateTransactionFilter,
    getCurrentFilter
} from './ui/components.js';

import {
    initModal,
    openAddModal,
    openEditModal,
    closeModal,
    getModalData,
    resetModal
} from './ui/modal.js';

import { initNavigation, switchToTab } from './ui/navigation.js';
import { initTheme } from './ui/theme.js';
import { showToast, sanitizeInput, debounce, generateSecureId } from './utils/helpers.js';

// ========== CONFIGURATION ==========
const CONFIG = {
    SYNC_DELAY: 1500,
    MIN_AMOUNT: 1,
    MAX_RETRY: 3,
    TOAST_DURATION: 3000
};

// ========== GLOBAL STATE ==========
let transactions = [];
let currentUser = null;
let syncTimeout = null;
let isInitialized = false;
let refreshTimeout = null;
let isSyncing = false;

// ========== DOM CACHE (Memoized Selectors) ==========
const DOM = {
    get loginScreen() { return document.getElementById('loginScreen'); },
    get mainApp() { return document.getElementById('mainApp'); },
    get userName() { return document.getElementById('userName'); },
    get balanceAmount() { return document.getElementById('balanceAmount'); },
    get totalIncome() { return document.getElementById('totalIncome'); },
    get totalExpense() { return document.getElementById('totalExpense'); },
    get monthlyExpense() { return document.getElementById('monthlyExpense'); },
    get monthlyIncome() { return document.getElementById('monthlyIncome'); },
    get transactionList() { return document.getElementById('transactionList'); },
    get monthFilter() { return document.getElementById('monthFilter'); },
    get statsTotalExpense() { return document.getElementById('statsTotalExpense'); },
    get statsTotalIncome() { return document.getElementById('statsTotalIncome'); },
    get statsDailyAvg() { return document.getElementById('statsDailyAvg'); },
    get statsInsight() { return document.getElementById('statsInsight'); },
    get statsCategoryList() { return document.getElementById('statsCategoryList'); },
    get profileAvatar() { return document.getElementById('profileAvatar'); },
    get profileName() { return document.getElementById('profileName'); },
    get profileEmail() { return document.getElementById('profileEmail'); },
    get loadingOverlay() { return document.getElementById('loadingOverlay'); }
};

// ========== LOADING STATE FUNCTIONS ==========
const showLoading = () => {
    const overlay = DOM.loadingOverlay;
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.querySelector('p').textContent = 'Memuat data...';
    }
};

const hideLoading = () => {
    const overlay = DOM.loadingOverlay;
    if (overlay) overlay.classList.add('hidden');
};

const showLoadingWithMessage = (message) => {
    const overlay = DOM.loadingOverlay;
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.classList.remove('hidden');
    }
};

// ========== SANITIZATION & VALIDATION ==========
const validateTransaction = (amount, description, type, category = 'Lainnya') => {
    const cleanAmount = Number(amount);
    
    if (isNaN(cleanAmount) || cleanAmount < CONFIG.MIN_AMOUNT) {
        showToast(`Masukkan jumlah yang valid (minimal Rp ${CONFIG.MIN_AMOUNT})`);
        return { valid: false, error: 'Invalid amount' };
    }
    
    const sanitizedDescription = sanitizeInput(description, 'description');
    if (!sanitizedDescription || sanitizedDescription.length < 1) {
        showToast('Masukkan deskripsi (minimal 1 karakter)');
        return { valid: false, error: 'Invalid description' };
    }
    
    if (!type || !['income', 'expense'].includes(type)) {
        showToast('Pilih jenis transaksi yang valid');
        return { valid: false, error: 'Invalid type' };
    }
    
    return { 
        valid: true, 
        data: {
            amount: cleanAmount,
            description: sanitizedDescription,
            type: type,
            category: sanitizeInput(category, 'category')
        }
    };
};

// ========== CORE FUNCTIONS ==========
const saveAndSync = debounce(() => {
    // Always save to local first
    saveTransactionsToLocal(transactions);
    
    // If user is logged in and online, sync to cloud
    if (currentUser && navigator.onLine) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(async () => {
            try {
                if (transactions.length === 0) {
                    // If no transactions, delete all from cloud
                    await deleteAllFromCloud();
                    console.log('✅ Cloud data cleared');
                } else {
                    // Sync current transactions to cloud
                    const result = await syncToCloud(transactions);
                    if (result.success) {
                        console.log('✅ Data tersinkron ke cloud');
                    } else {
                        console.error('Sync to cloud failed:', result.error);
                    }
                }
            } catch (error) {
                console.error('Sync to cloud error:', error);
                showToast('⚠️ Gagal sinkron ke cloud');
            }
            syncTimeout = null;
        }, CONFIG.SYNC_DELAY);
    }
}, CONFIG.SYNC_DELAY);

// ========== ADD TRANSACTION ==========
const addTransaction = (amount, description, type, category, date) => {
    const validation = validateTransaction(amount, description, type, category);
    if (!validation.valid) return false;
    
    const { amount: cleanAmount, description: cleanDescription, type: cleanType, category: cleanCategory } = validation.data;
    
    const now = new Date().toISOString();
    const newTransaction = {
        id: generateSecureId(),
        amount: cleanAmount,
        description: cleanDescription,
        type: cleanType,
        category: cleanCategory || 'Lainnya',
        date: new Date(date).toISOString(),
        createdAt: now,
        updatedAt: now
    };

    transactions.unshift(newTransaction);
    saveAndSync();
    refreshAllUI();
    showToast('✅ Transaksi berhasil ditambahkan!');
    return true;
};

// ========== UPDATE TRANSACTION ==========
const updateTransaction = (id, amount, description, type, category, date) => {
    const validation = validateTransaction(amount, description, type, category);
    if (!validation.valid) return false;
    
    const { amount: cleanAmount, description: cleanDescription, type: cleanType, category: cleanCategory } = validation.data;
    
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) {
        showToast('⚠️ Transaksi tidak ditemukan');
        return false;
    }
    
    const now = new Date().toISOString();
    transactions[index] = {
        ...transactions[index],
        amount: cleanAmount,
        description: cleanDescription,
        type: cleanType,
        category: cleanCategory || 'Lainnya',
        date: new Date(date).toISOString(),
        updatedAt: now
    };
    
    saveAndSync();
    refreshAllUI();
    showToast('✅ Transaksi berhasil diupdate!');
    return true;
};

// ========== DELETE TRANSACTION (FIXED) ==========
const deleteTransaction = async (id) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) {
        showToast('⚠️ Transaksi tidak ditemukan');
        return;
    }
    
    if (confirm(`Hapus transaksi "${transaction.description}"?`)) {
        // Remove from local array
        transactions = transactions.filter(t => t.id !== id);
        saveTransactionsToLocal(transactions);
        
        // Delete from cloud if user is logged in and online
        if (currentUser && navigator.onLine) {
            try {
                const result = await deleteTransactionFromCloud(id);
                if (result.success) {
                    console.log('✅ Transaksi dihapus dari cloud');
                } else {
                    console.error('Gagal hapus dari cloud:', result.error);
                    showToast('⚠️ Transaksi dihapus dari lokal, gagal sync ke cloud');
                }
            } catch (error) {
                console.error('Error deleting from cloud:', error);
                showToast('⚠️ Gagal menghapus dari cloud');
            }
        }
        
        refreshAllUI();
        showToast('🗑️ Transaksi dihapus!');
    }
};

// ========== DELETE ALL DATA ==========
const deleteAllData = async () => {
    if (!confirm('⚠️ PERINGATAN! Ini akan menghapus SEMUA transaksi Anda. Data TIDAK bisa dikembalikan. Lanjutkan?')) {
        return;
    }
    
    showLoadingWithMessage('Menghapus semua data...');
    
    try {
        transactions = [];
        saveTransactionsToLocal(transactions);
        
        if (currentUser) {
            await deleteAllFromCloud();
        }
        
        refreshAllUI();
        hideLoading();
        showToast('✅ Semua data telah dihapus!');
    } catch (error) {
        console.error('Delete all data failed:', error);
        hideLoading();
        showToast('⚠️ Gagal menghapus data');
    }
};

// ========== EXPORT CSV ==========
const exportToCSV = () => {
    if (transactions.length === 0) {
        showToast('Tidak ada data untuk diekspor');
        return;
    }

    try {
        const headers = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah'];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString('id-ID'),
            t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            sanitizeInput(t.category),
            sanitizeInput(t.description),
            t.amount
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kantongin_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('📁 Data berhasil diekspor!');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('⚠️ Gagal mengekspor data');
    }
};

// ========== SYNC FROM CLOUD (FIXED) ==========
const syncFromCloud = async () => {
    if (!currentUser) return;
    if (isSyncing) return;
    
    isSyncing = true;
    showLoadingWithMessage('Menyinkronkan data...');

    try {
        const cloudTransactions = await fetchFromCloud();
        const cloudIds = new Set(cloudTransactions.map(t => t.id));
        const localIds = new Set(transactions.map(t => t.id));
        
        // Find transactions that are only in local (need to upload to cloud)
        const localOnly = transactions.filter(t => !cloudIds.has(t.id));
        
        // Find transactions that are only in cloud (need to add to local)
        const cloudOnly = cloudTransactions.filter(t => !localIds.has(t.id));
        
        // Find transactions that exist in both (check for updates)
        const commonTransactions = cloudTransactions.filter(t => localIds.has(t.id));
        const updatedFromCloud = [];
        
        commonTransactions.forEach(cloudT => {
            const localT = transactions.find(t => t.id === cloudT.id);
            if (localT) {
                const cloudTime = new Date(cloudT.updatedAt || cloudT.createdAt || cloudT.date);
                const localTime = new Date(localT.updatedAt || localT.createdAt || localT.date);
                if (cloudTime > localTime) {
                    updatedFromCloud.push(cloudT);
                }
            }
        });
        
        let changesMade = false;
        
        // Upload local-only transactions to cloud
        if (localOnly.length > 0 && navigator.onLine) {
            await syncToCloud(localOnly);
            console.log(`📤 Mengupload ${localOnly.length} transaksi ke cloud`);
            changesMade = true;
        }
        
        // Add cloud-only transactions to local
        if (cloudOnly.length > 0) {
            transactions = [...cloudOnly, ...transactions];
            changesMade = true;
            console.log(`📥 Menambahkan ${cloudOnly.length} transaksi dari cloud`);
        }
        
        // Update transactions that are newer in cloud
        if (updatedFromCloud.length > 0) {
            const updatedIds = new Set(updatedFromCloud.map(t => t.id));
            transactions = transactions.filter(t => !updatedIds.has(t.id));
            transactions = [...updatedFromCloud, ...transactions];
            changesMade = true;
            console.log(`🔄 Mengupdate ${updatedFromCloud.length} transaksi dari cloud`);
        }
        
        // Sort transactions by date
        if (changesMade) {
            transactions.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
            saveTransactionsToLocal(transactions);
            refreshAllUI();
            
            let message = '✅ Data tersinkron';
            if (cloudOnly.length > 0) message += ` (${cloudOnly.length} baru)`;
            if (updatedFromCloud.length > 0) message += ` (${updatedFromCloud.length} diupdate)`;
            if (localOnly.length > 0) message += ` (${localOnly.length} diupload)`;
            showToast(message);
        } else {
            showToast('✅ Data sudah sinkron');
        }
        
    } catch (error) {
        console.error('Sync from cloud failed:', error);
        showToast('⚠️ Gagal sinkron data dari cloud');
    } finally {
        isSyncing = false;
        hideLoading();
    }
};

// ========== REFRESH UI ==========
const refreshAllUI = () => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
        renderBalance(transactions);
        renderTransactionList(transactions, openEditModal, deleteTransaction);
        renderStatistics(transactions);
        updateFilterDropdown();
        refreshTimeout = null;
    }, 100);
};

// ========== UPDATE FILTER DROPDOWN ==========
const updateFilterDropdown = () => {
    const monthFilter = DOM.monthFilter;
    if (monthFilter) {
        monthFilter.innerHTML = generateMonthOptions(transactions);
    }
};

// ========== HANDLE TRANSACTION SAVE ==========
const handleSaveTransaction = (e) => {
    const { amount, description, category, type, date, editId } = e.detail;
    
    if (!amount || amount <= 0) {
        showToast('Masukkan jumlah yang valid');
        return;
    }
    if (!description || description.trim() === '') {
        showToast('Masukkan deskripsi');
        return;
    }
    if (!type) {
        showToast('Pilih jenis transaksi (Pemasukan/Pengeluaran)');
        return;
    }

    const success = editId 
        ? updateTransaction(editId, amount, description, type, category, date)
        : addTransaction(amount, description, type, category, date);

    if (success) {
        closeModal();
        resetModal();
    }
};

// ========== HANDLE NAVIGATION ==========
const handleTabNavigation = (tabName) => {
    if (tabName === 'stats') {
        renderStatistics(transactions);
    }
};

// ========== HANDLE ACCOUNT PAGE ==========
const openAccountPage = async () => {
    const accountPage = document.getElementById('accountPage');
    const mainAppDiv = DOM.mainApp;
    
    if (!accountPage) return;
    
    try {
        const module = await import('./ui/account.js');
        module.renderAccountPage('accountPageContainer');
        if (mainAppDiv) mainAppDiv.classList.add('hidden');
        accountPage.classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load account page:', error);
        showToast('⚠️ Gagal membuka pengaturan');
    }
};

// ========== HANDLE LOGIN ==========
const handleLogin = async () => {
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (!googleLoginBtn) return;
    
    googleLoginBtn.disabled = true;
    const originalText = googleLoginBtn.innerHTML;
    googleLoginBtn.innerHTML = '⏳ Mengalihkan...';
    
    try {
        await signInWithGoogle();
    } catch (error) {
        console.error('Login failed:', error);
        showToast('⚠️ Gagal login, coba lagi');
    } finally {
        googleLoginBtn.disabled = false;
        googleLoginBtn.innerHTML = originalText;
    }
};

// ========== HANDLE LOGOUT ==========
const handleLogout = async () => {
    if (!confirm('Yakin ingin keluar?')) return;
    
    showLoadingWithMessage('Logout...');
    try {
        await signOut();
        currentUser = null;
        transactions = [];
        const loginScreen = DOM.loginScreen;
        const mainApp = DOM.mainApp;
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        hideLoading();
        showToast('👋 Anda telah logout');
    } catch (error) {
        console.error('Logout failed:', error);
        hideLoading();
        showToast('⚠️ Gagal logout');
    }
};

// ========== REGISTER SERVICE WORKER ==========
const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.warn('Service Worker registration skipped:', error);
                });
        });
    }
};

// ========== HANDLE ONLINE/OFFLINE ==========
const handleOnlineStatus = () => {
    if (navigator.onLine) {
        showToast('📡 Kembali online, menyinkronkan data...');
        if (currentUser) {
            syncToCloud(transactions).catch(() => {});
            setTimeout(() => syncFromCloud(), 1000);
        }
    } else {
        showToast('📴 Anda offline, data disimpan secara lokal');
    }
};

// ========== INIT APPLICATION ==========
const initApp = async () => {
    if (isInitialized) {
        console.warn('App already initialized');
        return;
    }

    console.log('🚀 Initializing Kantongin...');
    isInitialized = true;

    try {
        // Initialize core modules
        initModal();
        initNavigation(handleTabNavigation);
        initTheme();
        await handleAuthCallback();
        
        const session = await restoreSession();
        const loginScreen = DOM.loginScreen;
        const mainApp = DOM.mainApp;

        if (session.success && session.user) {
            currentUser = session.user;
            transactions = loadTransactionsFromLocal();
            
            // Render UI
            renderProfile(currentUser);
            refreshAllUI();
            
            // Show main app
            if (loginScreen) loginScreen.classList.add('hidden');
            if (mainApp) mainApp.classList.remove('hidden');
            
            // Sync from cloud (non-blocking)
            setTimeout(() => syncFromCloud(), 500);
            
        } else {
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (mainApp) mainApp.classList.add('hidden');
        }

        // Set up event listeners
        setupEventListeners();
        
        // Register service worker
        registerServiceWorker();
        
        // Online/offline handlers
        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);

        console.log('✅ App initialized successfully');
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        showToast('⚠️ Gagal memuat aplikasi, refresh halaman');
        hideLoading();
    }
};

// ========== SETUP EVENT LISTENERS ==========
const setupEventListeners = () => {
    // Login button (Google)
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleLogin);
    }

    // Email auth UI
    const emailSignInBtn = document.getElementById('emailSignInBtn');
    const emailSignUpBtn = document.getElementById('emailSignUpBtn');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const authMessage = document.getElementById('authMessage');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordStrengthEl = document.getElementById('passwordStrength');
    const passwordStrengthFill = document.getElementById('passwordStrengthFill');
    const passwordSuggestion = document.getElementById('passwordSuggestion');

    const setAuthMessage = (message, isError = false) => {
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.style.color = isError ? '#b91c1c' : '#166534';
        }
    };

    // Password visibility toggle
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordBtn.textContent = 'Sembunyikan';
            } else {
                passwordInput.type = 'password';
                togglePasswordBtn.textContent = 'Tampilkan';
            }
        });
    }

    // Password strength meter
    const evaluatePasswordStrength = (pwd) => {
        if (!pwd || pwd.length === 0) {
            return {
                score: 0,
                label: '-',
                color: '#7A6654',
                suggestion: 'Gunakan kombinasi huruf, angka, dan simbol.'
            };
        }

        let score = 0;
        if (pwd.length >= 8) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

        let label = 'Lemah';
        let color = '#b91c1c';
        let suggestion = 'Tambahkan angka, huruf kapital, atau simbol.';

        if (score === 2) {
            label = 'Sedang';
            color = '#b45309';
            suggestion = 'Tambahkan huruf kapital atau simbol untuk lebih kuat.';
        } else if (score >= 3) {
            label = 'Kuat';
            color = '#166534';
            suggestion = 'Kata sandi Anda cukup kuat.';
        }

        return { score, label, color, suggestion };
    };

    const updatePasswordStrengthUI = (val) => {
        const { score, label, color, suggestion } = evaluatePasswordStrength(val);
        if (passwordStrengthEl) {
            passwordStrengthEl.textContent = `Kekuatan: ${label}`;
            passwordStrengthEl.style.color = color;
        }
        if (passwordStrengthFill) {
            passwordStrengthFill.style.width = `${score * 25}%`;
            passwordStrengthFill.style.background = color;
        }
        if (passwordSuggestion) {
            passwordSuggestion.textContent = suggestion;
            passwordSuggestion.style.color = '#7A6654';
        }
    };

    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const val = e.target.value || '';
            updatePasswordStrengthUI(val);
        });
        updatePasswordStrengthUI(passwordInput.value || '');
    }

    if (emailSignInBtn && emailInput && passwordInput) {
        emailSignInBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            emailSignInBtn.disabled = true;
            const original = emailSignInBtn.textContent;
            emailSignInBtn.textContent = '⏳ Masuk...';
            setAuthMessage('');
            try {
                const email = emailInput.value.trim();
                const password = passwordInput.value;
                const result = await signInWithEmail(email, password);
                if (result.success) {
                    setAuthMessage('✅ Berhasil masuk.');
                    const session = await restoreSession();
                    if (session.success && session.user) {
                        currentUser = session.user;
                        transactions = loadTransactionsFromLocal();
                        renderProfile(currentUser);
                        refreshAllUI();
                        DOM.loginScreen.classList.add('hidden');
                        DOM.mainApp.classList.remove('hidden');
                        setTimeout(() => syncFromCloud(), 500);
                    }
                } else {
                    setAuthMessage(result.message || '⚠️ Gagal masuk', true);
                }
            } catch (err) {
                console.error('Email sign-in error:', err);
                setAuthMessage('⚠️ Gagal masuk', true);
            } finally {
                emailSignInBtn.disabled = false;
                emailSignInBtn.textContent = original;
            }
        });
    }

    const isPasswordStrongEnough = (pwd) => {
        const { score } = evaluatePasswordStrength(pwd);
        return score >= 2;
    };

    if (emailSignUpBtn && emailInput && passwordInput) {
        emailSignUpBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const strength = evaluatePasswordStrength(password);

            if (!isPasswordStrongEnough(password)) {
                setAuthMessage(`⚠️ Kata sandi terlalu lemah. ${strength.suggestion}`, true);
                return;
            }

            emailSignUpBtn.disabled = true;
            const original = emailSignUpBtn.textContent;
            emailSignUpBtn.textContent = '⏳ Mendaftar...';
            setAuthMessage('');
            try {
                const result = await signUpWithEmail(email, password);
                if (result.success) {
                    setAuthMessage('✅ Berhasil terdaftar. Silakan cek email untuk verifikasi jika diperlukan.');
                } else {
                    setAuthMessage(result.message || '⚠️ Gagal daftar', true);
                }
            } catch (err) {
                console.error('Email sign-up error:', err);
                setAuthMessage('⚠️ Gagal daftar', true);
            } finally {
                emailSignUpBtn.disabled = false;
                emailSignUpBtn.textContent = original;
            }
        });
    }

    if (forgotPasswordBtn && emailInput) {
        forgotPasswordBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            if (!email) {
                setAuthMessage('Masukkan email Anda terlebih dahulu.', true);
                return;
            }

            forgotPasswordBtn.disabled = true;
            const original = forgotPasswordBtn.textContent;
            forgotPasswordBtn.textContent = '⏳ Mengirim...';
            try {
                const result = await resetPassword(email);
                setAuthMessage(result.message || 'Link reset kata sandi telah dikirim.', result.success ? false : true);
            } catch (err) {
                console.error('Reset password error:', err);
                setAuthMessage('⚠️ Gagal mengirim tautan reset.', true);
            } finally {
                forgotPasswordBtn.disabled = false;
                forgotPasswordBtn.textContent = original;
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtnPremium');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', deleteAllData);
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }

    // Save transaction event
    document.addEventListener('save-transaction', handleSaveTransaction);
    document.addEventListener('open-modal', () => openAddModal());

    // FAB and quick action buttons
    const fab = document.getElementById('fab');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const quickIncomeBtn = document.getElementById('quickIncomeBtn');
    const quickExpenseBtn = document.getElementById('quickExpenseBtn');

    const openModalHandler = () => openAddModal();
    if (fab) fab.addEventListener('click', openModalHandler);
    if (addTransactionBtn) addTransactionBtn.addEventListener('click', openModalHandler);
    if (quickIncomeBtn) quickIncomeBtn.addEventListener('click', openModalHandler);
    if (quickExpenseBtn) quickExpenseBtn.addEventListener('click', openModalHandler);

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openAccountPage);
    }

    // Close account page
    document.addEventListener('close-account-page', () => {
        const accountPage = document.getElementById('accountPage');
        const mainApp = DOM.mainApp;
        if (accountPage) accountPage.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
    });

    // Month filter
    const monthFilter = DOM.monthFilter;
    if (monthFilter) {
        monthFilter.innerHTML = generateMonthOptions(transactions);
        monthFilter.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            updateTransactionFilter(selectedValue, transactions, openEditModal, deleteTransaction);
            showToast(selectedValue === 'all' ? 'Menampilkan semua transaksi' : 'Filter bulan diubah');
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+N or Cmd+N to open add transaction
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openAddModal();
        }
        // Escape to close modal
        if (e.key === 'Escape') {
            closeModal();
        }
    });
};

// ========== CLEANUP ==========
const cleanup = () => {
    isInitialized = false;
    if (syncTimeout) {
        clearTimeout(syncTimeout);
        syncTimeout = null;
    }
    if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
    }
    window.removeEventListener('online', handleOnlineStatus);
    window.removeEventListener('offline', handleOnlineStatus);
    document.removeEventListener('save-transaction', handleSaveTransaction);
    document.removeEventListener('open-modal', () => openAddModal());
    document.removeEventListener('close-account-page', () => {});
};

// ========== START APP ==========
initApp();

// ========== EXPOSE FOR DEBUGGING ==========
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    window.__KANTONGIN__ = {
        transactions: () => transactions,
        currentUser: () => currentUser,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refreshAllUI,
        syncFromCloud,
        cleanup,
        DOM
    };
}