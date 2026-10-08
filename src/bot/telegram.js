const {
    getUpdates,
    sendMessage,
    deleteWebhook
} = require('../integrations/telegram/telegram.client');

const { handleTelegramUpdate } = require('./router');

async function startBot() {
    await deleteWebhook();

    console.log('Telegram bot starting...');

    let offset = 0;

    while (true) {
        try {
            const updates = await getUpdates(offset);

            for (const update of updates) {
                offset = update.update_id + 1;

                const result = await handleTelegramUpdate(update);

                if (result.chatId && result.response) {
                    await sendMessage(
                        result.chatId,
                        result.response
                    );
                }
            }
        } catch (error) {
            console.error('Telegram polling error:', error.message);

            await new Promise(resolve => {
                setTimeout(resolve, 3000);
            });
        }
    }
}

module.exports = {
    startBot
};