const API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const FILE_URL = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function callTelegram(method, payload = {}) {
    const response = await fetch(`${API_URL}/${method}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(data.description || 'Telegram API error');
    }

    return data.result;
}

async function getUpdates(offset) {
    return callTelegram('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['message']
    });
}

async function sendMessage(chatId, text) {
    return callTelegram('sendMessage', {
        chat_id: chatId,
        text
    });
}

async function deleteWebhook() {
    return callTelegram('deleteWebhook', {
        drop_pending_updates: false
    });
}

async function getFile(fileId) {
    return callTelegram('getFile', {
        file_id: fileId
    });
}

async function deleteMessage(chatId, messageId) {
    return callTelegram('deleteMessage', {
        chat_id: chatId,
        message_id: messageId
    });
}

async function downloadFile(filePath) {
    const response = await fetch(`${FILE_URL}/${filePath}`);

    if (!response.ok) {
        throw new Error(`Telegram file download failed: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return buffer;
}

module.exports = {
    getUpdates,
    sendMessage,
    deleteWebhook,
    getFile,
    downloadFile,
    deleteMessage
};