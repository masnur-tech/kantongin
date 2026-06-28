// ========================================
// ACCOUNT - User Account Settings Page
// ========================================

import { getCurrentUser, signOut, supabase } from '../auth.js';
import { showToast } from '../utils/helpers.js';

let currentUser = null;

// Render halaman pengaturan akun
export function renderAccountPage(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  currentUser = getCurrentUser();

  container.innerHTML = `
    <div class="account-page">
      <div class="account-header">
        <button class="back-btn" id="accountBackBtn">← Kembali</button>
        <h2>Pengaturan Akun</h2>
      </div>
      
      <div class="account-section">
        <div class="section-title">
          <span class="section-icon">👤</span>
          <h3>Profil</h3>
        </div>
        <div class="profile-info-card">
          <div class="profile-avatar-large" id="accountAvatar">
            ${getAvatarInitial()}
          </div>
          <div class="profile-fields">
            <div class="profile-field">
              <label>Nama Lengkap</label>
              <div class="field-value-with-edit">
                <span id="displayName">${currentUser?.user_metadata?.full_name || 'Pengguna'}</span>
                <button class="edit-field-btn" data-field="name">✏️ Edit</button>
              </div>
            </div>
            <div class="profile-field">
              <label>Email</label>
              <div class="field-value">${currentUser?.email || '-'}</div>
              <div class="field-note">Email terverifikasi</div>
            </div>
            <div class="profile-field">
              <label>ID Pengguna</label>
              <div class="field-value-small">${currentUser?.id?.slice(0, 16)}...</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="account-section">
        <div class="section-title">
          <span class="section-icon">🔒</span>
          <h3>Keamanan</h3>
        </div>
        <div class="settings-list-account">
          <div class="account-setting-item">
            <div class="setting-info">
              <span class="setting-icon">🔄</span>
              <div>
                <div class="setting-label">Ganti Password</div>
                <div class="setting-desc">Ubah password akun Google Anda</div>
              </div>
            </div>
            <button class="account-setting-btn" id="changePasswordBtn">Ubah</button>
          </div>
          <div class="account-setting-item">
            <div class="setting-info">
              <span class="setting-icon">📱</span>
              <div>
                <div class="setting-label">Perangkat Terhubung</div>
                <div class="setting-desc">Kelola perangkat yang pernah login</div>
              </div>
            </div>
            <button class="account-setting-btn" id="devicesBtn">Kelola</button>
          </div>
          <div class="account-setting-item">
            <div class="setting-info">
              <span class="setting-icon">🗑️</span>
              <div>
                <div class="setting-label">Hapus Akun</div>
                <div class="setting-desc danger-text">Hapus semua data dan akun permanen</div>
              </div>
            </div>
            <button class="account-setting-btn danger" id="deleteAccountBtn">Hapus</button>
          </div>
        </div>
      </div>
      
      <div class="account-section">
        <div class="section-title">
          <span class="section-icon">📊</span>
          <h3>Data & Privasi</h3>
        </div>
        <div class="settings-list-account">
          <div class="account-setting-item">
            <div class="setting-info">
              <span class="setting-icon">📥</span>
              <div>
                <div class="setting-label">Export Data</div>
                <div class="setting-desc">Download semua data transaksi (JSON)</div>
              </div>
            </div>
            <button class="account-setting-btn" id="exportFullDataBtn">Export</button>
          </div>
          <div class="account-setting-item">
            <div class="setting-info">
              <span class="setting-icon">🗄️</span>
              <div>
                <div class="setting-label">Backup Manual</div>
                <div class="setting-desc">Buat backup data ke cloud</div>
              </div>
            </div>
            <button class="account-setting-btn" id="manualBackupBtn">Backup</button>
          </div>
          <div class="account-setting-item">
            <div class="setting-info">
              <span class="setting-icon">🔄</span>
              <div>
                <div class="setting-label">Restore Data</div>
                <div class="setting-desc">Pulihkan dari backup sebelumnya</div>
              </div>
            </div>
            <button class="account-setting-btn" id="restoreDataBtn">Restore</button>
          </div>
        </div>
      </div>
      
      <div class="account-section">
        <div class="section-title">
          <span class="section-icon">⚙️</span>
          <h3>Aplikasi</h3>
        </div>
        <div class="settings-list-account">
          <div class="account-setting-item">
            <div class="setting-info">
              <img src="/icons/darkmode.svg" class="setting-icon" alt="Dark Mode">
              <div>
                <div class="setting-label">Mode Gelap</div>
                <div class="setting-desc">Tampilan gelap untuk kenyamanan mata</div>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="accountDarkModeToggle" ${localStorage.getItem('kantongin_darkmode') === 'true' ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="account-setting-item">
            <div class="setting-info">
              <span class="setting-icon">🔔</span>
              <div>
                <div class="setting-label">Notifikasi</div>
                <div class="setting-desc">Pengingat budget dan laporan bulanan</div>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="notificationToggle">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="account-setting-item">
            <div class="setting-info">
              <span class="setting-icon">💱</span>
              <div>
                <div class="setting-label">Mata Uang</div>
                <div class="setting-desc">IDR - Rupiah Indonesia</div>
              </div>
            </div>
            <button class="account-setting-btn" id="currencyBtn">Ganti</button>
          </div>
        </div>
      </div>
      
      <div class="account-section">
        <div class="section-title">
          <span class="section-icon">🧪</span>
          <h3>Test Notifikasi</h3>
        </div>
        <div class="settings-list-account">
          <div class="account-setting-item">
            <div class="setting-info">
              <button class="account-setting-btn" id="testNotificationBtn">Test Sekarang</button>
            </div>
          </div>
          <div class="account-setting-item">
            <div class="setting-info">
              <button class="account-setting-btn" id="debugScheduleBtn">Debug Jadwal</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="account-section">
        <div class="section-title">
          <span class="section-icon">ℹ️</span>
          <h3>Tentang</h3>
        </div>
        <div class="about-content">
          <p><strong>Kantongin</strong> - Personal Finance Tracker</p>
          <p>Versi 2.0.1</p>
          <p>Dibuat dengan ❤️ untuk membantu mengelola keuangan</p>
          <p class="about-link">Kebijakan Privasi | Syarat & Ketentuan</p>
        </div>
      </div>
      
      <div class="logout-section">
        <button class="logout-btn-full" id="accountLogoutBtn">
          <img src="/icons/logout.svg" alt="Logout" width="18" height="18">
          Keluar dari Kantongin
        </button>
      </div>
    </div>
  `;

  attachAccountEvents();
}

function getAvatarInitial() {
  const user = getCurrentUser();
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U';
  return name.charAt(0).toUpperCase();
}

function attachAccountEvents() {
  const backBtn = document.getElementById('accountBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const event = new CustomEvent('close-account-page');
      document.dispatchEvent(event);
    });
  }

  const editNameBtn = document.querySelector('[data-field="name"]');
  if (editNameBtn) {
    editNameBtn.addEventListener('click', () => showEditNameModal());
  }

  const changePwdBtn = document.getElementById('changePasswordBtn');
  if (changePwdBtn) {
    changePwdBtn.addEventListener('click', () => {
      window.open('https://myaccount.google.com/security', '_blank');
    });
  }

  const devicesBtn = document.getElementById('devicesBtn');
  if (devicesBtn) {
    devicesBtn.addEventListener('click', () => {
      window.open('https://myaccount.google.com/device-activity', '_blank');
    });
  }

  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', confirmDeleteAccount);
  }

  const exportBtn = document.getElementById('exportFullDataBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportFullData());
  }

  const backupBtn = document.getElementById('manualBackupBtn');
  if (backupBtn) {
    backupBtn.addEventListener('click', () => manualBackup());
  }

  const restoreBtn = document.getElementById('restoreDataBtn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => restoreData());
  }

  const darkToggle = document.getElementById('accountDarkModeToggle');
  if (darkToggle) {
    darkToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('kantongin_darkmode', 'true');
      } else {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('kantongin_darkmode', 'false');
      }
    });
  }

  const notificationToggle = document.getElementById('notificationToggle');
  if (notificationToggle) {
    const savedState = localStorage.getItem('kantongin_notifications') === 'true';
    notificationToggle.checked = savedState;
    
    notificationToggle.addEventListener('change', (e) => {
      localStorage.setItem('kantongin_notifications', e.target.checked);
      if (e.target.checked) {
        scheduleMonthlyReports();
        showToast('Notifikasi bulanan diaktifkan');
      } else {
        clearMonthlyReportSchedules();
        showToast('Notifikasi bulanan dinonaktifkan');
      }
    });
  }

  const currencyBtn = document.getElementById('currencyBtn');
  if (currencyBtn) {
    currencyBtn.addEventListener('click', () => {
      showToast('Multi currency akan hadir di update berikutnya');
    });
  }

  const logoutBtn = document.getElementById('accountLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Yakin ingin keluar?')) {
        await signOut();
        window.location.reload();
      }
    });
  }

  const testNotificationBtn = document.getElementById('testNotificationBtn');
  if (testNotificationBtn) {
    testNotificationBtn.addEventListener('click', testNotification);
  }

  const debugScheduleBtn = document.getElementById('debugScheduleBtn');
  if (debugScheduleBtn) {
    debugScheduleBtn.addEventListener('click', debugNotificationSchedule);
  }
}

function showEditNameModal() {
  const currentName = getCurrentUser()?.user_metadata?.full_name || '';
  const newName = prompt('Masukkan nama baru:', currentName);

  if (newName && newName !== currentName) {
    updateUserName(newName);
  }
}

async function updateUserName(newName) {
  const user = getCurrentUser();
  if (!user) return;

  const { error } = await supabase.auth.updateUser({
    data: { full_name: newName }
  });

  if (error) {
    showToast('Gagal update nama: ' + error.message);
  } else {
    showToast('Nama berhasil diupdate!');
    renderAccountPage('accountPageContainer');
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) userNameSpan.textContent = newName;
  }
}

// FIXED: Delete account with proper error handling
function confirmDeleteAccount() {
  const confirmed = confirm(
    '⚠️ PERINGATAN BERAT ⚠️\n\n' +
    'Tindakan ini akan MENGHAPUS PERMANEN:\n' +
    '• Semua data transaksi Anda\n' +
    '• Akun Anda dari sistem\n\n' +
    'Data TIDAK BISA dikembalikan.\n\n' +
    'Ketik "HAPUS" untuk mengonfirmasi:'
  );

  if (confirmed) {
    const userInput = prompt('Ketik "HAPUS" untuk konfirmasi final:');
    if (userInput === 'HAPUS') {
      deleteAccountPermanently();
    } else {
      showToast('Konfirmasi dibatalkan');
    }
  }
}

async function deleteAccountPermanently() {
  showToast('Menghapus akun...');

  const user = getCurrentUser();
  if (!user) return;

  // Hapus data transaksi dari Supabase
  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Delete transactions error:', deleteError);
  }

  // Hapus data lokal
  localStorage.clear();

  // Sign out
  await signOut();

  showToast('Akun dan semua data telah dihapus');
  setTimeout(() => window.location.reload(), 1500);
}

function exportFullData() {
  const transactions = JSON.parse(localStorage.getItem('kantongin_transactions') || '[]');
  const exportData = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    user: {
      email: getCurrentUser()?.email,
      name: getCurrentUser()?.user_metadata?.full_name
    },
    transactions: transactions,
    settings: {
      darkMode: localStorage.getItem('kantongin_darkmode') === 'true'
    }
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kantongin_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data berhasil diekspor!');
}

async function manualBackup() {
  showToast('Membackup ke cloud...');

  const transactions = JSON.parse(localStorage.getItem('kantongin_transactions') || '[]');
  const user = getCurrentUser();

  if (user && transactions.length > 0) {
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
          category: t.category
        })),
        { onConflict: 'id' }
      );

    if (error) {
      showToast('Backup gagal: ' + error.message);
    } else {
      showToast('Backup berhasil!');
    }
  } else {
    showToast('Tidak ada data untuk di-backup');
  }
}

function restoreData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.transactions && Array.isArray(data.transactions)) {
          localStorage.setItem('kantongin_transactions', JSON.stringify(data.transactions));
          showToast('Data berhasil direstore! Silakan refresh halaman.');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast('Format file tidak valid');
        }
      } catch (err) {
        showToast('Gagal membaca file');
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

// Monthly notification scheduling functions
let monthlyReportSchedule = null;
let budgetReminderSchedule = null;

async function checkMonthlyBudget() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  const transactions = JSON.parse(localStorage.getItem('kantongin_transactions') || '[]');
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });
  
  const stats = calculateMonthlyStats(monthlyTransactions);
  const currentDate = localStorage.getItem('kantongin_last_budget_check');
  
  if (currentDate && new Date(currentDate) >= new Date(currentYear, currentMonth - 1)) {
    return;
  }
  
  // Generate budget reminder toast
  let message = `📊 Laporan Bulanan ${currentMonth}/${currentYear}: `;
  
  const totalIncome = stats.totalIncome;
  const totalExpense = stats.totalExpense;
  const balance = stats.balance;
  
  if (totalExpense > 0) {
    const topCategories = Object.entries(stats.categoryExpense)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (topCategories.length > 0) {
      message += `Pengeluaran terbesar: ${topCategories[0][0]} (${formatRupiah(topCategories[0][1])})`;
    }
  }
  
  if (balance < 0) {
    message += ` | Saldo negatif: ${formatRupiah(balance)}`;
  }
  
  if (monthlyTransactions.length === 0) {
    message += ` | Belum ada transaksi bulan ini`;  
  }
  
  showToast(message, 8000, 'info');
  localStorage.setItem('kantongin_last_budget_check', new Date().toISOString());
}

async function scheduleMonthlyReports() {
  if (monthlyReportSchedule) {
    clearTimeout(monthlyReportSchedule);
  }
  
  const now = new Date();
  const currentDay = now.getDate();
  
  if (currentDay === 1) {
    monthlyReportSchedule = setTimeout(() => {
      checkMonthlyBudget();
      scheduleMonthlyReports();
    }, 24 * 60 * 60 * 1000);
  } else {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const timeUntilNextMonth = nextMonth - now;
    monthlyReportSchedule = setTimeout(() => {
      checkMonthlyBudget();
      scheduleMonthlyReports();
    }, timeUntilNextMonth);
  }
}

function clearMonthlyReportSchedules() {
  if (monthlyReportSchedule) {
    clearTimeout(monthlyReportSchedule);
    monthlyReportSchedule = null;
  }
}

function calculateMonthlyStats(transactions) {
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpense = {};
  
  for (const t of transactions) {
    if (!t.amount) continue;
    
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpense += t.amount;
      const category = t.category || 'Lainnya';
      categoryExpense[category] = (categoryExpense[category] || 0) + t.amount;
    }
  }
  
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryExpense,
    transactionCount: transactions.length
  };
}

function formatRupiah(amount) {
  return 'Rp ' + Math.abs(amount).toLocaleString('id-ID');
}

function testNotification() {
  showToast('✅ Notifikasi aktif! Laporan bulanan akan dikirim pada tanggal 1 setiap bulan.', 5000, 'success');
}

function debugNotificationSchedule() {
  const isEnabled = localStorage.getItem('kantongin_notifications') === 'true';
  const lastCheck = localStorage.getItem('kantongin_last_budget_check');
  
  let status = `Status Notifikasi: ${isEnabled ? 'AKTIF' : 'NONAKTIF'}\n`;
  status += `Jadwal Laporan Bulanan: ${isEnabled ? 'AKTIF' : 'MENUNGGU'}${isEnabled ? ' (Setiap tanggal 1)' : ''}\n`;
  status += `Terakhir Diperiksa: ${lastCheck ? new Date(lastCheck).toLocaleString('id-ID') : 'Belum pernah'}`;
  
  showToast(status, 6000, 'info');
}