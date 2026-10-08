const { ensureUser } = require('../modules/users/user.service');
const { handleStart } = require('./handlers/start.handler');
const { handleHistory } = require('./handlers/history.handler');
const { handlePhoto } = require('./handlers/upload.handler');

const waitingForPhoto = new Set();

async function handleTelegramUpdate(update) {
    const message = update.message;

    if (!message || !message.from) {
        return {
            status: 'ignored'
        };
    }

    const user = await ensureUser(message.from);

    const text = message.text || '';
    const chatId = message.chat.id;

    // =========================
    // /start
    // =========================
    if (text === '/start') {
        return {
            status: 'received',
            command: 'start',
            chatId,
            user,
            response: await handleStart(user)
        };
    }

    // =========================
    // /upload
    // =========================
    if (text === '/upload') {
        waitingForPhoto.add(chatId);

        return {
            status: 'received',
            command: 'upload',
            chatId,
            user,
            response:
                '📸 Upload Nota\n\n' +
                'Silakan kirim foto nota lu di sini.\n\n' +
                'Pastikan foto jelas dan seluruh bagian nota terlihat.'
        };
    }

    // =========================
    // FOTO
    // =========================
    if (message.photo) {
        if (!waitingForPhoto.has(chatId)) {
            return {
                status: 'received',
                command: 'photo_without_upload',
                chatId,
                user,
                response:
                    '⚠️ Kirim /upload dulu sebelum mengirim foto nota.'
            };
        }

        // User sudah mengirim foto.
        // Hapus state supaya foto berikutnya tidak ikut diproses.
        waitingForPhoto.delete(chatId);

        const result = await handlePhoto(
            message,
            user,
            chatId
        );

        if (result.duplicate) {
            return {
                status: 'received',
                command: 'photo',
                chatId,
                user,
                response:
                    '⚠️ Nota ini sudah pernah dicatat.'
            };
        }

        return {
            status: 'received',
            command: 'photo',
            chatId,
            user,
            response:
                '✅ Upload nota berhasil dicatat.'
        };
    }

    // =========================
    // /riwayat
    // =========================
    if (text === '/riwayat') {
        return {
            status: 'received',
            command: 'history',
            chatId,
            user,
            response: await handleHistory(user.id)
        };
    }

    return {
        status: 'received',
        command: 'unknown',
        chatId,
        user,
        response:
            'Perintah tidak dikenali.\n\n' +
            'Gunakan /start, /upload, atau /riwayat.'
    };
}

module.exports = {
    handleTelegramUpdate
};