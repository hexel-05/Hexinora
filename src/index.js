require('dotenv').config();

const express = require('express');

const { testConnection } = require('./database/client');
const { startBot } = require('./bot/telegram');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        app: 'Hexinora',
        status: 'running'
    });
});

app.listen(PORT, async () => {
    console.log(`Hexinora running on port ${PORT}`);

    try {
        await testConnection();
        await startBot();
    } catch (error) {
        console.error('Startup failed:', error.message);
    }
});