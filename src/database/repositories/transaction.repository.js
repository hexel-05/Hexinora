const crypto = require('crypto');
const { pool } = require('../client');

function createTransactionCode(receipt) {
    const normalized = {
        tanggal: receipt.tanggal || '',
        waktu: receipt.waktu || '',
        toko: (receipt.toko || '').trim().toLowerCase(),
        grand_total: Number(receipt.grand_total),
        items: receipt.items.map(item => ({
            barang: item.barang.trim().toLowerCase(),
            jumlah: Number(item.jumlah),
            harga: Number(item.harga),
            total: Number(item.total)
        }))
    };

    return crypto
        .createHash('sha256')
        .update(JSON.stringify(normalized))
        .digest('hex');
}

async function getLatestTransactions(userId, limit = 5) {
    const query = `
        SELECT
            t.id,
            t.merchant,
            t.transaction_date,
            t.transaction_time,
            t.total_amount,
            c.name AS category,
            COALESCE(
                json_agg(
                    json_build_object(
                        'product_name', ti.product_name,
                        'quantity', ti.quantity,
                        'unit_price', ti.unit_price,
                        'total_amount', ti.total_amount
                    )
                    ORDER BY ti.id
                ) FILTER (WHERE ti.id IS NOT NULL),
                '[]'::json
            ) AS items
        FROM transactions t
        LEFT JOIN categories c
            ON c.id = t.category_id
        LEFT JOIN transaction_items ti
            ON ti.transaction_id = t.id
        WHERE t.user_id = $1
        GROUP BY
            t.id,
            t.merchant,
            t.transaction_date,
            t.transaction_time,
            t.total_amount,
            c.name
        ORDER BY
            t.transaction_date DESC,
            t.transaction_time DESC
        LIMIT $2;
    `;

    const result = await pool.query(query, [userId, limit]);

    return result.rows;
}

async function transactionExistsByFileHash(userId, fileHash) {
    const result = await pool.query(
        `
        SELECT id
        FROM transactions
        WHERE user_id = $1
          AND file_hash = $2
        LIMIT 1;
        `,
        [userId, fileHash]
    );

    return result.rows.length > 0;
}

async function createTransaction({
    userId,
    accountId,
    categoryId = null,
    receipt,
    fileHash
}) {
    const transactionCode = createTransactionCode(receipt);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const transactionResult = await client.query(
            `
            INSERT INTO transactions (
                user_id,
                account_id,
                category_id,
                type,
                merchant,
                transaction_date,
                transaction_time,
                total_amount,
                transaction_code,
                file_hash,
                source
            )
            VALUES (
                $1,
                $2,
                $3,
                'expense',
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                'receipt'
            )
            ON CONFLICT (user_id, file_hash)
            WHERE file_hash IS NOT NULL
            DO NOTHING
            RETURNING id;
            `,
            [
                userId,
                accountId,
                categoryId,
                receipt.toko,
                receipt.tanggal,
                receipt.waktu,
                receipt.grand_total,
                transactionCode,
                fileHash
            ]
        );

        // Kalau tidak ada row yang dikembalikan,
        // berarti transaksi sudah pernah dicatat.
        if (transactionResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return {
                duplicate: true,
                transactionCode
            };
        }

        // transactionId baru dipakai setelah berhasil INSERT.
        const transactionId = transactionResult.rows[0].id;

        for (const item of receipt.items) {
            await client.query(
                `
                INSERT INTO transaction_items (
                    transaction_id,
                    product_name,
                    quantity,
                    unit_price,
                    total_amount
                )
                VALUES ($1, $2, $3, $4, $5);
                `,
                [
                    transactionId,
                    item.barang,
                    item.jumlah,
                    item.harga,
                    item.total
                ]
            );
        }

        await client.query('COMMIT');

        return {
            duplicate: false,
            id: transactionId,
            transactionCode
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    getLatestTransactions,
    transactionExistsByFileHash,
    createTransaction
};