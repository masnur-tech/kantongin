// ========================================
// DATABASE - LocalStorage + Supabase Sync
// ========================================

import { supabase } from './auth.js';
import { getCurrentUser } from './auth.js';

// ========== LOCAL STORAGE ==========
export function saveTransactionsToLocal(transactions) {
    localStorage.setItem('kantongin_transactions', JSON.stringify(transactions));
}

export function loadTransactionsFromLocal() {
    const saved = localStorage.getItem('kantongin_transactions');
    return saved ? JSON.parse(saved) : [];
}

// ========== SYNC TO CLOUD ==========
export async function syncToCloud(transactions) {
    const user = getCurrentUser();
    if (!user || !transactions || transactions.length === 0) return { success: true };

    const { error } = await supabase
        .from('transactions')
        .upsert(
            transactions.map(t => ({
                id: String(t.id),
                user_id: user.id,
                amount: t.amount,
                description: t.description,
                type: t.type,
                date: t.date,
                category: t.category || 'Lainnya'
            })),
            { onConflict: 'id' }
        );

    if (error) {
        console.error('Sync to cloud error:', error);
        return { success: false, error };
    }

    return { success: true };
}

// ========== FETCH FROM CLOUD ==========
export async function fetchFromCloud() {
    const user = getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    if (error) {
        console.error('Fetch from cloud error:', error);
        return [];
    }

    return data || [];
}

// ========== DELETE ALL FROM CLOUD ==========
export async function deleteAllFromCloud() {
    const user = getCurrentUser();
    if (!user) return { success: true };

    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Delete from cloud error:', error);
        return { success: false, error };
    }

    return { success: true };
}