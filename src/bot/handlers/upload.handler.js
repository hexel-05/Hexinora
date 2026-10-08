const crypto = require('crypto');

const {
    getOrCreateDefaultAccount
} = require('../../database/repositories/account.repository');

const {
    transactionExistsByFileHash,
    createTransaction
} = require('../../database/repositories/transaction.repository');

const {
    sendMessage,
    deleteMessage,
    getFile,
    downloadFile
} = require('../../integrations/telegram/telegram.client');

const {
    analyzeReceipt
} = require('../../integrations/gemini/gemini.client');

const {
    parseReceipt
} = require('../../modules/transactions/receipt.service');

async function handlePhoto(message, user, chatId) {
    if (!message.photo || message.photo.length === 0) {
        throw new Error('Photo tidak ditemukan');
    }

    // Kirim pesan sementara setelah foto diterima
    const processingMessage = await sendMessage(
        chatId,
        '⏳ Tunggu sebentar, nota lagi gue proses...'
    );

    try {
        const photo = message.photo[message.photo.length - 1];

        const file = await getFile(photo.file_id);
        const buffer = await downloadFile(file.file_path);

        const fileHash = crypto
            .createHash('sha256')
            .update(buffer)
            .digest('hex');

        const isDuplicate = await transactionExistsByFileHash(
            user.id,
            fileHash
        );

        if (isDuplicate) {
            await deleteMessage(
                chatId,
                processingMessage.message_id
            );

            return {
                duplicate: true
            };
        }

        console.log('Photo downloaded:', {
            fileId: photo.file_id,
            filePath: file.file_path,
            size: buffer.length
        });

        const ocrResult = await analyzeReceipt(
            buffer,
            'image/jpeg'
        );

        console.log('Gemini OCR result:');
        console.log(ocrResult);

        const receipt = parseReceipt(ocrResult);

        console.log('Parsed receipt:');
        console.dir(receipt, { depth: null });

        const account = await getOrCreateDefaultAccount(user.id);

        const savedTransaction = await createTransaction({
            userId: user.id,
            accountId: account.id,
            categoryId: null,
            receipt,
            fileHash
        });

        // Hapus pesan "tunggu sebentar"
        await deleteMessage(
            chatId,
            processingMessage.message_id
        );

        return {
            receipt,
            transactionId: savedTransaction.id,
            duplicate: savedTransaction.duplicate
        };

    } catch (error) {
        // Hapus pesan processing kalau terjadi error
        try {
            await deleteMessage(
                chatId,
                processingMessage.message_id
            );
        } catch (deleteError) {
            console.error(
                'Gagal menghapus pesan processing:',
                deleteError.message
            );
        }

        throw error;
    }
}

module.exports = {
    handlePhoto
};