const { pool } = require('../client');

async function getOrCreateUser(telegramId, name = null) {
    const query = `
        INSERT INTO users (telegram_id, name)
        VALUES ($1, $2)
        ON CONFLICT (telegram_id)
        DO UPDATE SET
            name = COALESCE(EXCLUDED.name, users.name),
            updated_at = NOW()
        RETURNING id, telegram_id, name, created_at, updated_at;
    `;

    const result = await pool.query(query, [telegramId, name]);

    return result.rows[0];
}

module.exports = {
    getOrCreateUser
};