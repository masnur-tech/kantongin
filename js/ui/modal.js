// ========================================
// MODAL - Add/Edit Transaction Modal
// ========================================

import { CATEGORIES, TRANSACTION_TYPES } from '../utils/constants.js';
import { formatDateForInput } from '../utils/helpers.js';

let currentEditId = null;

// Buat struktur modal di DOM jika belum ada
export function initModal() {
    if (document.getElementById('transactionModal')) return;

    const modalHTML = `
    <div id="transactionModal" class="modal hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modalTitle">Tambah Transaksi</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="amount-input-wrapper">
            <span class="currency-prefix">Rp</span>
            <input type="number" id="modalAmount" class="amount-input-premium" placeholder="0" min="0">
          </div>
          
          <div class="type-selector-premium">
            <button class="type-premium expense-type active" data-type="expense">
              <span>💸</span> Pengeluaran
            </button>
            <button class="type-premium income-type" data-type="income">
              <span>💰</span> Pemasukan
            </button>
          </div>
          
          <input type="text" id="modalDescription" class="modal-input" placeholder="Deskripsi">
          
          <div class="category-grid" id="categoryGrid"></div>
          
          <input type="date" id="modalDate" class="modal-input">
        </div>
        <div class="modal-footer">
          <button class="modal-cancel">Batal</button>
          <button class="modal-save">Simpan</button>
        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Generate category chips dengan <img> untuk icon
    const categoryGrid = document.getElementById('categoryGrid');
    if (categoryGrid) {
        categoryGrid.innerHTML = CATEGORIES.map(cat => `
      <button class="category-chip" data-cat="${cat.name}">
        <img src="${cat.icon}" alt="${cat.name}" width="20" height="20" style="vertical-align: middle; margin-right: 6px;">
        ${cat.name}
      </button>
    `).join('');
    }

    // Set default date to today
    const dateInput = document.getElementById('modalDate');
    if (dateInput) {
        dateInput.value = formatDateForInput(new Date().toISOString());
    }

    // Validasi input number tidak boleh negatif
    const amountInput = document.getElementById('modalAmount');
    if (amountInput) {
        amountInput.addEventListener('input', (e) => {
            if (e.target.value < 0) {
                e.target.value = 0;
            }
        });
        amountInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                const currentValue = parseInt(e.target.value) || 0;
                if (currentValue <= 0) {
                    e.preventDefault();
                    e.target.value = 0;
                }
            }
        });
    }

    // Event listeners untuk modal
    attachModalEvents();
}

function attachModalEvents() {
    const modal = document.getElementById('transactionModal');
    const closeBtn = document.querySelector('.modal-close');
    const cancelBtn = document.querySelector('.modal-cancel');
    const saveBtn = document.querySelector('.modal-save');

    // Close modal
    const closeModal = () => modal.classList.add('hidden');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Type selector - update UI class
    const typeBtns = document.querySelectorAll('.type-premium');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            console.log('UI Type changed to:', btn.dataset.type);
        });
    });

    // Category chips
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
        });
    });

    // Save button - ambil data LANGSUNG dari DOM
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // Ambil semua data langsung dari DOM
            const amountRaw = document.getElementById('modalAmount')?.value || '0';
            const amount = parseInt(amountRaw, 10);
            const description = document.getElementById('modalDescription')?.value || '';
            const selectedChip = document.querySelector('.category-chip.selected');
            const category = selectedChip?.dataset.cat || 'Lainnya';
            const date = document.getElementById('modalDate')?.value || formatDateForInput(new Date().toISOString());

            // Ambil type dari tombol yang aktif di DOM
            const activeTypeBtn = document.querySelector('.type-premium.active');
            const type = activeTypeBtn?.dataset.type || 'expense';

            console.log('💾 Save clicked - Type:', type, 'Amount:', amount, 'Category:', category, 'Raw:', amountRaw);

            // Validasi amount
            if (isNaN(amount) || amount <= 0) {
                console.log('❌ Invalid amount:', amount);
                // Trigger toast from app.js via custom event
                const event = new CustomEvent('show-toast', {
                    detail: { message: 'Masukkan jumlah yang valid (minimal Rp 1)', type: 'error' }
                });
                document.dispatchEvent(event);
                return;
            }

            // Kirim event dengan data
            const event = new CustomEvent('save-transaction', {
                detail: {
                    amount: amount,
                    description: description,
                    category: category,
                    type: type,
                    date: date,
                    editId: currentEditId
                }
            });
            document.dispatchEvent(event);
        });
    }
}

// Buka modal untuk tambah baru
export function openAddModal() {
    currentEditId = null;

    document.getElementById('modalTitle').textContent = 'Tambah Transaksi';
    document.getElementById('modalAmount').value = '';
    document.getElementById('modalDescription').value = '';
    document.getElementById('modalDate').value = formatDateForInput(new Date().toISOString());

    // Reset type UI: expense aktif, income tidak aktif
    const typeBtns = document.querySelectorAll('.type-premium');
    typeBtns.forEach(btn => {
        if (btn.dataset.type === 'expense') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Reset category and choose a default category
    const categoryChips = document.querySelectorAll('.category-chip');
    categoryChips.forEach(chip => chip.classList.remove('selected'));
    const defaultChip = Array.from(categoryChips).find(chip => chip.dataset.cat === 'Lainnya') || categoryChips[0];
    if (defaultChip) defaultChip.classList.add('selected');

    document.getElementById('transactionModal').classList.remove('hidden');
    console.log('📂 Modal opened, default type: expense (from UI)');
}

// Buka modal untuk edit
export function openEditModal(transaction) {
    currentEditId = transaction.id;

    document.getElementById('modalTitle').textContent = 'Edit Transaksi';
    document.getElementById('modalAmount').value = transaction.amount;
    document.getElementById('modalDescription').value = transaction.description;
    document.getElementById('modalDate').value = formatDateForInput(transaction.date);

    // Set type UI sesuai data transaksi
    const typeBtns = document.querySelectorAll('.type-premium');
    typeBtns.forEach(btn => {
        if (btn.dataset.type === transaction.type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Set category
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.toggle('selected', chip.dataset.cat === transaction.category);
    });

    document.getElementById('transactionModal').classList.remove('hidden');
    console.log('✏️ Edit modal opened, type:', transaction.type);
}

// Tutup modal
export function closeModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) modal.classList.add('hidden');
}

// Get data dari modal (kompatibilitas)
export function getModalData() {
    const amountRaw = document.getElementById('modalAmount')?.value || '0';
    const amount = parseInt(amountRaw, 10);
    const description = document.getElementById('modalDescription')?.value || '';
    const selectedChip = document.querySelector('.category-chip.selected');
    const category = selectedChip?.dataset.cat || 'Lainnya';
    const date = document.getElementById('modalDate')?.value || formatDateForInput(new Date().toISOString());
    const activeTypeBtn = document.querySelector('.type-premium.active');
    const type = activeTypeBtn?.dataset.type || 'expense';

    console.log('📊 getModalData - amount:', amountRaw, 'parsed:', amount);

    return {
        amount: amount,
        description,
        category,
        type,
        date,
        editId: currentEditId
    };
}

// Reset modal setelah save
export function resetModal() {
    currentEditId = null;
}