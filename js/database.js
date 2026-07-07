// ========================================
// DATABASE - LocalStorage + Supabase Sync
// ========================================

import { supabase } from './auth.js';
import { getCurrentUser } from './auth.js';

// ========== LOCAL STORAGE ==========
export function saveTransactionsToLocal(transactions) {
    try {
        localStorage.setItem('kantongin_transactions', JSON.stringify(transactions));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

export function loadTransactionsFromLocal() {
    try {
        const saved = localStorage.getItem('kantongin_transactions');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return [];
    }
}

// ========== SYNC TO CLOUD ==========
export async function syncToCloud(transactions) {
    const user = getCurrentUser();
    if (!user) return { success: true, message: 'No user logged in' };
    if (!transactions || transactions.length === 0) {
        // If no transactions, delete all from cloud
        return await deleteAllFromCloud();
    }

    try {
        // Prepare data for upsert
        const dataToSync = transactions.map(t => ({
            id: String(t.id),
            user_id: user.id,
            amount: t.amount,
            description: t.description || '',
            type: t.type || 'expense',
            date: t.date || new Date().toISOString(),
            category: t.category || 'Lainnya',
            created_at: t.createdAt || t.date || new Date().toISOString(),
            updated_at: t.updatedAt || t.createdAt || t.date || new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('transactions')
            .upsert(dataToSync, { 
                onConflict: 'id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Sync to cloud error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Sync to cloud error:', error);
        return { success: false, error };
    }
}

// ========== FETCH FROM CLOUD ==========
export async function fetchFromCloud() {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (error) {
            console.error('Fetch from cloud error:', error);
            return [];
        }

        // Transform data to match local format
        return (data || []).map(t => ({
            id: t.id,
            amount: t.amount,
            description: t.description || '',
            type: t.type || 'expense',
            date: t.date || new Date().toISOString(),
            category: t.category || 'Lainnya',
            createdAt: t.created_at || t.date || new Date().toISOString(),
            updatedAt: t.updated_at || t.created_at || t.date || new Date().toISOString()
        }));
    } catch (error) {
        console.error('Fetch from cloud error:', error);
        return [];
    }
}

// ========== DELETE SINGLE TRANSACTION FROM CLOUD ==========
export async function deleteTransactionFromCloud(transactionId) {
    const user = getCurrentUser();
    if (!user) return { success: true, message: 'No user logged in' };

    try {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', String(transactionId))
            .eq('user_id', user.id);

        if (error) {
            console.error('Delete from cloud error:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error('Delete from cloud error:', error);
        return { success: false, error };
    }
}

// ========== DELETE ALL FROM CLOUD ==========
export async function deleteAllFromCloud() {
    const user = getCurrentUser();
    if (!user) return { success: true, message: 'No user logged in' };

    try {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id);

        if (error) {
            console.error('Delete all from cloud error:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error('Delete all from cloud error:', error);
        return { success: false, error };
    }
}

// ========== CHECK IF TRANSACTION EXISTS IN CLOUD ==========
export async function checkTransactionExists(transactionId) {
    const user = getCurrentUser();
    if (!user) return false;

    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('id')
            .eq('id', String(transactionId))
            .eq('user_id', user.id)
            .single();

        if (error) return false;
        return !!data;
    } catch (error) {
        return false;
    }
}