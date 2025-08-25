const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8000;

// Set __path to project root
const __path = process.cwd();

// Increase Event Listener limit (safe for high-load apps)
require('events').EventEmitter.defaultMaxListeners = 500;

// Middleware: Parse request body BEFORE routes
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from 'public' folder (e.g., HTML, CSS, JS, images)
app.use(express.static(path.join(__path, 'public')));

// Routes
const qrRoute = require('./qr');     // QR login (returns QR image in JSON)
const pairRoute = require('./pair'); // Pairing code login

app.use('/qr', qrRoute);
app.use('/code', pairRoute);
app.use('/pair', (req, res) => {
    res.sendFile(path.join(__path, 'pair.html'));
});
app.use('/', (req, res) => {
    res.sendFile(path.join(__path, 'main.html'));
});

// Optional: 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).send('Route not found');
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`📁 Project root: ${__path}`);
});

module.exports = app;
