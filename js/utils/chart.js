// ========================================
// CHART - Inisialisasi dan render grafik
// ========================================

import { CHART_COLORS } from './constants.js';
import { formatRupiah } from './helpers.js';

let expenseChartInstance = null;

// Render donut chart pengeluaran per kategori
export function renderExpenseChart(canvasId, expenseByCategory) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hapus chart lama jika ada
    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }

    const categories = Object.keys(expenseByCategory);
    const amounts = Object.values(expenseByCategory);

    if (categories.length === 0) {
        // Tampilkan chart kosong
        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Belum ada data'],
                datasets: [{ data: [1], backgroundColor: ['#E0E0E0'], borderWidth: 0 }]
            },
            options: { cutout: '65%', plugins: { legend: { position: 'bottom' } } }
        });
        return;
    }

    expenseChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: CHART_COLORS.slice(0, categories.length),
                borderWidth: 0,
                borderRadius: 6,
                spacing: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = Math.round((value / total) * 100);
                            return `${label}: ${formatRupiah(value)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}