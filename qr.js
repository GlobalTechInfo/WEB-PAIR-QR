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

// Clear old session on startup
const SESSION_DIR = './auth_info_baileys_qr';
if (fs.existsSync(SESSION_DIR)) {
    fs.emptyDirSync(SESSION_DIR);
}

// Default message after successful login
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

router.get('/', async (req, res) => {
    const { number } = req.query; // Optional: for future use

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: state.keys,
        },
        printQRInTerminal: false, // We'll handle QR manually
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Safari'),
    });

    // Function to generate QR code from text
    const generateQrCode = async (qrData) => {
        try {
            return await qrcode.toDataURL(qrData); // Returns base64 data URL
        } catch (err) {
            console.error('QR Code generation error:', err);
            return null;
        }
    };

    // Handle QR code generation
    sock.ev.on('connection.update', async ({ qr }) => {
        if (qr) {
            console.log('QR Code generated, sending to client...');
            const qrCodeDataUrl = await generateQrCode(qr);
            if (qrCodeDataUrl && !res.headersSent) {
                return res.json({ success: true, qr: qrCodeDataUrl });
            }
        }
    });

    // Handle connection success
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('WhatsApp connection opened successfully.');

            const userJid = sock.user.id;

            // Send success message after login
            setTimeout(async () => {
                try {
                    await sock.sendMessage(userJid, { text: MESSAGE });
                    console.log('Login success message sent.');
                } catch (err) {
                    console.error('Failed to send welcome message:', err);
                }

                // Optional: cleanup auth folder after use
                // await fs.emptyDirSync(SESSION_DIR);
            }, 2000);
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

            console.log('Connection closed:', DisconnectReason[reason]);

            if (reason === DisconnectReason.restartRequired) {
                console.log('Restarting...');
                await delay(3000);
                return qr();
            } else if (reason === DisconnectReason.timedOut) {
                console.log('Connection timed out. Retrying...');
                return qr();
            } else {
                console.log('Reconnect failed. Please try again.');
            }
        }
    });
});

// Helper delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = router;
