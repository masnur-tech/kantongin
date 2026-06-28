// ========================================
// AUTH - Supabase Authentication
// ========================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CONFIG = {
    supabaseUrl: (typeof window !== 'undefined' && window.__SUPABASE_URL__) || 'https://gzsbdujrgqwdbrcokpfm.supabase.co',
    supabaseAnonKey: (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c2JkdWpyZ3F3ZGJyY29rcGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODc4OTcsImV4cCI6MjA5NjM2Mzg5N30.xSoTuoVNRZ2Jj0-nRxjQNT1reDV6FcyP_rWG8NsYzac',
    storageKey: 'kantongin_session',
    cacheDuration: 30000
};

export const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

let currentUser = null;
let sessionCache = null;
let cacheTimestamp = null;

export const AuthError = {
    NETWORK: 'NETWORK_ERROR',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    UNKNOWN: 'UNKNOWN_ERROR'
};

const Storage = {
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn(`Failed to parse storage key "${key}":`, error);
            return null;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Failed to set storage key "${key}":`, error);
            return false;
        }
    },
    remove(key) {
        localStorage.removeItem(key);
    },
    clear() {
        localStorage.removeItem(CONFIG.storageKey);
    }
};

const isOnline = () => (typeof navigator !== 'undefined' ? navigator.onLine : true);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handleSupabaseError = (error) => {
    if (!isOnline()) {
        return { success: false, error: AuthError.NETWORK, message: 'Tidak ada koneksi internet' };
    }

    if (error?.message?.includes('JWT expired')) {
        return { success: false, error: AuthError.SESSION_EXPIRED, message: 'Sesi kadaluarsa, silakan login ulang' };
    }

    if (error?.message?.includes('Invalid login credentials')) {
        return { success: false, error: AuthError.INVALID_CREDENTIALS, message: 'Login gagal, coba lagi' };
    }

    return {
        success: false,
        error: AuthError.UNKNOWN,
        message: error?.message || 'Terjadi kesalahan tidak diketahui'
    };
};

const isCacheValid = () => Boolean(sessionCache && cacheTimestamp && (Date.now() - cacheTimestamp < CONFIG.cacheDuration));

const updateCache = (session) => {
    sessionCache = session;
    cacheTimestamp = Date.now();
    if (session?.user) {
        currentUser = session.user;
    }
};

const invalidateCache = () => {
    sessionCache = null;
    cacheTimestamp = null;
    currentUser = null;
};

const getStoredSession = () => Storage.get(CONFIG.storageKey);

const storeSession = (session) => {
    if (session) {
        Storage.set(CONFIG.storageKey, {
            user: session.user,
            expires_at: session.expires_at,
            refresh_token: session.refresh_token
        });
        updateCache(session);
    } else {
        Storage.remove(CONFIG.storageKey);
        invalidateCache();
    }
};

export async function signInWithGoogle() {
    try {
        if (!isOnline()) {
            return { success: false, error: AuthError.NETWORK, message: 'Tidak ada koneksi internet' };
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return handleSupabaseError(error);
    }
}

/**
 * Sign up with email + password
 */
export async function signUpWithEmail(email, password) {
    try {
        if (!isOnline()) return { success: false, error: AuthError.NETWORK, message: 'Tidak ada koneksi internet' };

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Supabase may require email confirmation; return data for UI handling
        return { success: true, data };
    } catch (error) {
        return handleSupabaseError(error);
    }
}

/**
 * Sign in with email + password
 */
export async function signInWithEmail(email, password) {
    try {
        if (!isOnline()) return { success: false, error: AuthError.NETWORK, message: 'Tidak ada koneksi internet' };

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data?.session) {
            storeSession(data.session);
            currentUser = data.session.user;
            return { success: true, user: data.session.user };
        }

        return { success: true, data };
    } catch (error) {
        return handleSupabaseError(error);
    }
}

/**
 * Reset password via email
 */
export async function resetPassword(email) {
    try {
        if (!isOnline()) return { success: false, error: AuthError.NETWORK, message: 'Tidak ada koneksi internet' };

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/`
        });

        if (error) throw error;
        return { success: true, message: 'Link reset kata sandi telah dikirim ke email Anda.' };
    } catch (error) {
        return handleSupabaseError(error);
    }
}

export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        Storage.clear();
        invalidateCache();
        return { success: true };
    } catch (error) {
        return handleSupabaseError(error);
    }
}

export async function restoreSession() {
    if (isCacheValid() && sessionCache?.user) {
        currentUser = sessionCache.user;
        return { success: true, user: sessionCache.user, source: 'cache' };
    }

    const storedSession = getStoredSession();
    if (storedSession?.user) {
        if (storedSession.expires_at && Date.now() < storedSession.expires_at) {
            currentUser = storedSession.user;
            updateCache({ user: storedSession.user, expires_at: storedSession.expires_at });
            return { success: true, user: storedSession.user, source: 'storage' };
        }
    }

    if (!isOnline() && storedSession?.user) {
        currentUser = storedSession.user;
        return { success: true, user: storedSession.user, source: 'offline' };
    }

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
            storeSession(session);
            return { success: true, user: session.user, source: 'supabase' };
        }

        Storage.remove(CONFIG.storageKey);
        invalidateCache();
        return { success: false };
    } catch (error) {
        const result = handleSupabaseError(error);
        if (result.error === AuthError.NETWORK && storedSession?.user) {
            currentUser = storedSession.user;
            return { success: true, user: storedSession.user, source: 'fallback' };
        }
        return result;
    }
}

export async function handleAuthCallback() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const errorCode = hashParams.get('error');

    if (window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (errorCode) {
        return {
            success: false,
            error: AuthError.UNKNOWN,
            message: 'Login dengan Google gagal, coba lagi'
        };
    }

    if (accessToken) {
        try {
            await delay(500);
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (session?.user) {
                storeSession(session);
                return { success: true, user: session.user };
            }

            return { success: false, message: 'No session found after callback' };
        } catch (error) {
            return handleSupabaseError(error);
        }
    }

    return restoreSession();
}

export async function refreshSession() {
    try {
        if (!isOnline()) {
            return { success: false, error: AuthError.NETWORK, message: 'Tidak ada koneksi internet' };
        }

        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) throw error;

        if (session?.user) {
            storeSession(session);
            return { success: true, user: session.user };
        }

        return { success: false, message: 'Failed to refresh session' };
    } catch (error) {
        const result = handleSupabaseError(error);
        if (result.error === AuthError.SESSION_EXPIRED) {
            Storage.remove(CONFIG.storageKey);
            invalidateCache();
        }
        return result;
    }
}

export function getCurrentUser() {
    return currentUser;
}

export function isLoggedIn() {
    return Boolean(currentUser && currentUser.email);
}

export async function getSession() {
    if (isCacheValid() && sessionCache?.user) {
        return { success: true, user: sessionCache.user };
    }
    return restoreSession();
}

export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            currentUser = session.user;
            storeSession(session);
        } else if (event === 'SIGNED_OUT') {
            invalidateCache();
            Storage.clear();
        }

        if (callback) {
            callback(event, session?.user || null);
        }
    });
}

export async function validateSession() {
    try {
        const storedSession = getStoredSession();
        if (!storedSession?.user) {
            return { valid: false };
        }

        if (storedSession.expires_at) {
            const timeUntilExpiry = storedSession.expires_at - Date.now();
            if (timeUntilExpiry < 300000 && timeUntilExpiry > 0) {
                const result = await refreshSession();
                return { valid: result.success, session: result.user };
            }
        }

        if (currentUser) {
            return { valid: true, user: currentUser };
        }

        const result = await restoreSession();
        return { valid: result.success, user: result.user || null };
    } catch (error) {
        console.error('Session validation failed:', error);
        return { valid: false, error: error.message };
    }
}

let validationTimeout = null;
export const autoValidateSession = () => {
    if (validationTimeout) clearTimeout(validationTimeout);
    validationTimeout = setTimeout(async () => {
        await validateSession();
        validationTimeout = null;
    }, 1000);
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoValidateSession);
    } else {
        autoValidateSession();
    }
}
