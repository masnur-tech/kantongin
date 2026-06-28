// ========================================
// CONSTANTS - Warna, kategori, konfigurasi
// ========================================

// Palet warna (earth tone)
export const COLORS = {
    primary: '#7C9A92',
    primaryDark: '#5E7A72',
    success: '#4A7B6D',
    danger: '#C87A6E',
    warning: '#D4C5B7',
    background: '#FDF8EC',
    surface: '#FFFFFF',
    text: '#5C4B3C',
    textLight: '#7A6654',
    border: 'rgba(124, 154, 146, 0.15)'
};

// Warna untuk grafik
export const CHART_COLORS = ['#7C9A92', '#C87A6E', '#D4C5B7', '#9BB5AE', '#5C4B3C', '#4A7B6D'];

// Daftar kategori dengan path SVG (PERBAIKI PATH: /icons/ BUKAN /icon/)
export const CATEGORIES = [
    { name: 'Makanan', icon: '/icons/category-makanan.svg' },
    { name: 'Transportasi', icon: '/icons/category-transportasi.svg' },
    { name: 'Belanja', icon: '/icons/category-belanja.svg' },
    { name: 'Tagihan', icon: '/icons/category-tagihan.svg' },
    { name: 'Hiburan', icon: '/icons/category-hiburan.svg' },
    { name: 'Lainnya', icon: '/icons/category-lainnya.svg' }
];

// Tipe transaksi
export const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense'
};