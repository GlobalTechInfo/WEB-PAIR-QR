const express = require('express');
const fs = require('fs-extra');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
let router = express.Router();

const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    DisconnectReason,
} = require('baileys');

// Session folder (will be cleared on each new QR)
const SESSION_DIR = './auth_info_baileys_qr';
if (fs.existsSync(SESSION_DIR)) {
    fs.emptyDirSync(SESSION_DIR);
}

// Success message after login
const MESSAGE = process.env.MESSAGE || `
*SESSION GENERATED SUCCESSFULLY* ✅

*🌟 Join the official channel for more updates and support!* 🌟
https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04

Ask me anything here:
ngl.link/septorch

Instagram: instagram.com/septorch29  
TikTok: tiktok.com/@septorch

Stay tuned on our channel:
https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04

*SEPTORCH--WHATSAPP-BOT*
`;

// QR Route
router.get('/', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: state.keys,
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Safari'),
    });

    // Generate QR code as Data URL
    const generateQrCode = async (qrData) => {
        try {
            return await qrcode.toDataURL(qrData);
        } catch (err) {
            console.error('QR Generation Error:', err);
            return null;
        }
    };

    // Handle QR update
    sock.ev.on('connection.update', async (update) => {
        const { qr } = update;
        if (qr) {
            console.log('New QR Code generated');
            const qrCodeDataUrl = await generateQrCode(qr);
            if (qrCodeDataUrl && !res.headersSent) {
                return res.json({ success: true, qr: qrCodeDataUrl });
            }
        }
    });

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Handle connection open
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('✅ WhatsApp connected successfully!');
            const userJid = sock.user.id;

            // Send welcome message
            setTimeout(async () => {
                try {
                    await sock.sendMessage(userJid, { text: MESSAGE });
                    console.log('✅ Login message sent to self.');
                } catch (err) {
                    console.error('Failed to send message:', err);
                }
            }, 2000);
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log('❌ Connection closed:', DisconnectReason[reason]);

            if (reason === DisconnectReason.restartRequired) {
                console.log('🔄 Restarting...');
                await delay(3000);
                return qr();
            } else if (reason === DisconnectReason.timedOut) {
                console.log('⏳ Timed out, reconnecting...');
                return qr();
            } else {
                console.log('🔁 Reconnect failed. Please restart.');
                if (!res.headersSent) {
                    res.json({ success: false, error: 'Connection failed' });
                }
            }
        }
    });
});

// Helper delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = router;
