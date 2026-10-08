const { pool } = require('../client');

async function createDefaultCategories(userId) {
    const categories = [
        ['Makan', 'expense'],
        ['Transportasi', 'expense'],
        ['Nongkrong', 'expense'],
        ['Belanja', 'expense'],
        ['Tagihan', 'expense'],
        ['Lainnya', 'expense'],
        ['Gaji', 'income'],
        ['Lainnya (Pemasukan)', 'income']
    ];

    for (const [name, type] of categories) {
        await pool.query(
            `
            INSERT INTO categories (user_id, name, type)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, name) DO NOTHING;
            `,
            [userId, name, type]
        );
    }
}

module.exports = {
    createDefaultCategories
};