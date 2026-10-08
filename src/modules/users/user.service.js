const {
    getOrCreateUser
} = require('../../database/repositories/user.repository');

const {
    getOrCreateDefaultAccount
} = require('../../database/repositories/account.repository');

const {
    createDefaultCategories
} = require('../../database/repositories/category.repository');

async function ensureUser(telegramUser) {
    const telegramId = telegramUser.id;

    const name =
        telegramUser.first_name ||
        telegramUser.username ||
        null;

    const user = await getOrCreateUser(telegramId, name);

    await getOrCreateDefaultAccount(user.id);
    await createDefaultCategories(user.id);

    return user;
}

module.exports = {
    ensureUser
};