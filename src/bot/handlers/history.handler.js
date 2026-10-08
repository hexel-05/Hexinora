const {
    getLatestTransactions
} = require('../../database/repositories/transaction.repository');

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(Number(amount));
}

function formatDate(date) {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short'
    }).format(new Date(date));
}

function formatTime(time) {
    return String(time).slice(0, 5);
}

async function handleHistory(userId) {
    const transactions = await getLatestTransactions(userId, 5);

    if (transactions.length === 0) {
        return '📋 Riwayat\n\nBelum ada transaksi.';
    }

    let total = 0;

    const lines = [
        '📋 Riwayat',
        ''
    ];

    transactions.forEach((transaction, index) => {
        total += Number(transaction.total_amount);

        lines.push(
            `${index + 1} · ${transaction.merchant || 'Transaksi'}`,
            `    ${formatDate(transaction.transaction_date)} · ${formatTime(transaction.transaction_time)}`,
        );

        transaction.items.slice(0, 2).forEach(item => {
            lines.push(
                `    ${item.product_name} ×${item.quantity}`
            );
        });

        lines.push(
            `    ${formatRupiah(transaction.total_amount)}`,
            ''
        );
    });

    lines.push(
        '────────────',
        `💸 ${formatRupiah(total)} · ${transactions.length} transaksi`
    );

    return lines.join('\n');
}

module.exports = {
    handleHistory
};