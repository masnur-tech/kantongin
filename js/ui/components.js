// ========================================
// COMPONENTS - Render UI (Balance, Transaction List, Stats)
// ========================================

import {
    formatRupiah,
    formatDateRelative,
    getCategoryIcon,
    escapeHtml,
    calculateBalance,
    calculateTotalIncome,
    calculateTotalExpense,
    calculateExpenseByCategory,
    showToast
} from '../utils/helpers.js';

import { renderExpenseChart } from '../utils/chart.js';

// Global variable untuk filter
let currentMonthFilter = 'all';

// ========== RENDER BALANCE CARD ==========
export function renderBalance(transactions) {
    const balanceAmount = document.getElementById('balanceAmount');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');

    if (balanceAmount) {
        const balance = calculateBalance(transactions);
        balanceAmount.textContent = formatRupiah(balance);
    }
    if (totalIncomeEl) totalIncomeEl.textContent = formatRupiah(calculateTotalIncome(transactions));
    if (totalExpenseEl) totalExpenseEl.textContent = formatRupiah(calculateTotalExpense(transactions));

    // Monthly summary
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncomeEl = document.getElementById('monthlyIncome');
    const monthlyExpenseEl = document.getElementById('monthlyExpense');
    if (monthlyIncomeEl) monthlyIncomeEl.textContent = formatRupiah(monthlyIncome);
    if (monthlyExpenseEl) monthlyExpenseEl.textContent = formatRupiah(monthlyExpense);
}

// ========== FUNGSI FILTER TRANSAKSI ==========
export function filterTransactionsByMonth(transactions, filterValue) {
    if (filterValue === 'all') return transactions;

    const [year, month] = filterValue.split('-');
    return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === parseInt(year, 10) && d.getMonth() + 1 === parseInt(month, 10);
    });
}

// ========== GENERATE OPSI BULAN UNTUK DROPDOWN ==========
export function generateMonthOptions(transactions) {
    const months = new Set();

    transactions.forEach(t => {
        const d = new Date(t.date);
        const yearMonth = `${d.getFullYear()}-${d.getMonth() + 1}`;
        months.add(yearMonth);
    });

    const sortedMonths = Array.from(months).sort().reverse();

    let options = '<option value="all">📅 Semua waktu</option>';
    sortedMonths.forEach(ym => {
        const [year, month] = ym.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthName = monthNames[parseInt(month) - 1];
        options += `<option value="${ym}">📅 ${monthName} ${year}</option>`;
    });

    return options;
}

// ========== RENDER TRANSACTION LIST (DENGAN FILTER) ==========
export function renderTransactionList(transactions, onEdit, onDelete) {
    const container = document.getElementById('transactionList');
    if (!container) return;

    // Apply filter
    const filteredTransactions = filterTransactionsByMonth(transactions, currentMonthFilter);

    if (filteredTransactions.length === 0) {
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>Belum ada transaksi</p>
                    <button class="empty-add-btn" id="emptyAddBtn">+ Tambah Sekarang</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p>Tidak ada transaksi untuk bulan ini</p>
                    <button class="empty-add-btn" id="emptyAddBtnFilter">+ Tambah Transaksi</button>
                </div>
            `;
        }

        const emptyAddBtn = document.getElementById('emptyAddBtn') || document.getElementById('emptyAddBtnFilter');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', () => {
                const event = new CustomEvent('open-modal');
                document.dispatchEvent(event);
            });
        }
        return;
    }

    container.innerHTML = filteredTransactions.slice(0, 30).map(transaction => `
        <div class="transaction-item" data-id="${transaction.id}">
            <div class="transaction-left">
                <div class="transaction-icon">
                    <img src="${getCategoryIcon(transaction.category)}" alt="${transaction.category}" width="32" height="32">
                </div>
                <div class="transaction-info">
                    <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                    <div class="transaction-category">${escapeHtml(transaction.category)}</div>
                    <div class="transaction-date">${formatDateRelative(transaction.date)}</div>
                </div>
            </div>
            <div class="transaction-right">
                <div class="transaction-amount ${transaction.type === 'income' ? 'income-text' : 'expense-text'}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formatRupiah(transaction.amount)}
                </div>
                <button class="transaction-delete" data-id="${transaction.id}">
                    <img src="/icons/delete.svg" alt="Delete" width="20" height="20">
                </button>
            </div>
        </div>
    `).join('');

    // Event listener untuk edit (klik item)
    document.querySelectorAll('.transaction-item').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.transaction-delete')) return;
            if (onEdit) onEdit(el.dataset.id);
        });
    });

    // Event listener untuk delete
    document.querySelectorAll('.transaction-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Hapus transaksi ini?')) {
                if (onDelete) onDelete(btn.dataset.id);
            }
        });
    });
}

// ========== UPDATE FILTER DAN REFRESH LIST ==========
export function updateTransactionFilter(filterValue, transactions, onEdit, onDelete) {
    currentMonthFilter = filterValue;
    renderTransactionList(transactions, onEdit, onDelete);
}

// ========== RENDER STATISTICS PAGE ==========
export function renderStatistics(transactions) {
    const totalIncome = calculateTotalIncome(transactions);
    const totalExpense = calculateTotalExpense(transactions);

    const statsTotalIncome = document.getElementById('statsTotalIncome');
    const statsTotalExpense = document.getElementById('statsTotalExpense');
    const statsDailyAvg = document.getElementById('statsDailyAvg');

    if (statsTotalIncome) statsTotalIncome.textContent = formatRupiah(totalIncome);
    if (statsTotalExpense) statsTotalExpense.textContent = formatRupiah(totalExpense);

    const dailyAvg = totalExpense / 30;
    if (statsDailyAvg) statsDailyAvg.textContent = formatRupiah(Math.round(dailyAvg));

    const expenseByCategory = calculateExpenseByCategory(transactions);

    // Render chart
    renderExpenseChart('expenseChart', expenseByCategory);

    // Insight
    const insightText = document.getElementById('statsInsight');
    const categories = Object.keys(expenseByCategory);
    const amounts = Object.values(expenseByCategory);

    if (insightText) {
        if (categories.length > 0 && totalExpense > 0) {
            const topIndex = amounts.indexOf(Math.max(...amounts));
            const topCategory = categories[topIndex];
            const topAmount = amounts[topIndex];
            const percentage = Math.round((topAmount / totalExpense) * 100);
            insightText.innerHTML = `📊 Pengeluaran terbesar Anda ada di <strong>${topCategory}</strong> sebesar ${formatRupiah(topAmount)} (${percentage}% dari total pengeluaran).`;
        } else {
            insightText.innerHTML = '💡 Tambahkan pengeluaran untuk melihat insight keuangan Anda.';
        }
    }

    // Daftar kategori
    const categoryList = document.getElementById('statsCategoryList');
    if (categoryList) {
        if (categories.length === 0) {
            categoryList.innerHTML = '<div class="empty-small">Belum ada data pengeluaran</div>';
        } else {
            const sorted = [...categories].map((cat, i) => ({ cat, amt: amounts[i] }))
                .sort((a, b) => b.amt - a.amt);

            categoryList.innerHTML = sorted.map(item => `
                <div class="category-row">
                    <div class="category-name">
                        <img src="${getCategoryIcon(item.cat)}" alt="${item.cat}" width="24" height="24">
                        ${item.cat}
                    </div>
                    <div class="category-amount">${formatRupiah(item.amt)}</div>
                </div>
            `).join('');
        }
    }
}

// ========== RENDER PROFILE PAGE ==========
export function renderProfile(user) {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    const userNameSpan = document.getElementById('userName');

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';

    if (profileName) profileName.textContent = displayName;
    if (profileEmail) profileEmail.textContent = user?.email || '';
    if (profileAvatar) profileAvatar.textContent = displayName.charAt(0).toUpperCase();
    if (userNameSpan) userNameSpan.textContent = displayName;
}

// Export current filter untuk debugging
export function getCurrentFilter() {
    return currentMonthFilter;
}