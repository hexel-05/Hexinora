const { pool } = require('../client');

async function getOrCreateDefaultAccount(userId) {
    const query = `
        INSERT INTO accounts (
            user_id,
            name,
            type,
            balance,
            currency
        )
        VALUES ($1, 'Cash', 'cash', 0, 'IDR')
        ON CONFLICT (user_id, name)
        DO UPDATE SET
            updated_at = NOW()
        RETURNING *;
    `;

    const result = await pool.query(query, [userId]);

    return result.rows[0];
}

module.exports = {
    getOrCreateDefaultAccount
};