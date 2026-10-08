async function handleStart(user) {
    return (
        `Halo, ${user.name || 'lu'}.\n\n` +
        `Gue Hexinora, asisten keuangan pribadi lu.\n\n` +
        `Kirim foto nota untuk mulai mencatat pengeluaran.`
    );
}

module.exports = {
    handleStart
};