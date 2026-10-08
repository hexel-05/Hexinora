function parseReceipt(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        throw new Error('Hasil OCR kosong atau bukan string');
    }

    // Bersihkan markdown code fence kalau Gemini masih mengirim ```json ... ```
    const cleanedText = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    let data;

    try {
        data = JSON.parse(cleanedText);
    } catch (error) {
        throw new Error('Hasil OCR bukan JSON yang valid');
    }

    if (!Array.isArray(data.items)) {
        throw new Error('Field items tidak valid');
    }

    if (data.items.length === 0) {
        throw new Error('Tidak ada item yang terbaca dari nota');
    }

    const items = data.items.map((item, index) => {
        const barang = item.barang?.toString().trim();

        const jumlah = Number(item.jumlah);
        const harga = Number(item.harga);
        const total = Number(item.total);

        if (!barang) {
            throw new Error(`Nama barang item ${index + 1} kosong`);
        }

        if (!Number.isFinite(jumlah) || jumlah <= 0) {
            throw new Error(`Jumlah item ${index + 1} tidak valid`);
        }

        if (!Number.isFinite(harga) || harga < 0) {
            throw new Error(`Harga item ${index + 1} tidak valid`);
        }

        if (!Number.isFinite(total) || total < 0) {
            throw new Error(`Total item ${index + 1} tidak valid`);
        }

        return {
            barang,
            jumlah,
            harga,
            total
        };
    });

    const calculatedTotal = items.reduce(
        (sum, item) => sum + item.total,
        0
    );

    const grandTotal =
        data.grand_total == null
            ? calculatedTotal
            : Number(data.grand_total);

    if (!Number.isFinite(grandTotal) || grandTotal < 0) {
        throw new Error('Grand total tidak valid');
    }

    // Toleransi kecil untuk pembulatan OCR
    const difference = Math.abs(calculatedTotal - grandTotal);

    if (difference > 1) {
        console.warn(
            `Total item berbeda dari grand total: item=${calculatedTotal}, grand_total=${grandTotal}, difference=${difference}`
        );
    }

    return {
        tanggal: data.tanggal || null,
        waktu: data.waktu || null,
        toko: data.toko || null,
        items,
        grand_total: grandTotal
    };
}

module.exports = {
    parseReceipt
};