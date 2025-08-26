// qr.js
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

// Session folder
const SESSION_DIR = './auth_info_baileys_qr';
if (fs.existsSync(SESSION_DIR)) {
    fs.emptyDirSync(SESSION_DIR);
}

// Success message after login
const MESSAGE = `
*SESSION GENERATED SUCCESSFULLY* ✅

*🌟 Join the official channel for more updates and support!* 🌟
https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04  

*Ask me any question Here* 
ngl.link/septorch

Instagram: instagram.com/septorch29  
TikTok: tiktok.com/@septorch

I will answer your question on the channel  
https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04  

*SEPTORCH--WHATSAPP-BOT*
`;

router.get('/', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    let sock;
    let qrSent = false; // Prevent multiple responses

    try {
        sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS('Safari'),
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { qr, connection, lastDisconnect } = update;

            // Handle QR code
            if (qr && !qrSent) {
                try {
                    console.log('🔄 Generating QR code for login...');
                    const qrImage = await qrcode.toBuffer(qr, {
                        type: 'image/png',
                        margin: 1,
                        scale: 10, // High quality QR
                    });

                    res.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Cache-Control': 'no-store',
                    });
                    res.end(qrImage, 'binary');
                    qrSent = true;
                } catch (err) {
                    console.error('❌ QR Generation Failed:', err);
                    if (!res.headersSent) {
                        res.status(500).send('QR generation failed');
                    }
                    qrSent = true;
                }
            }

            // Connection opened
            if (connection === 'open') {
                console.log('✅ WhatsApp connected successfully!');
                const userJid = sock.user.id;

                // Send welcome message
                setTimeout(async () => {
                    try {
                        await sock.sendMessage(userJid, { text: MESSAGE });
                        console.log('📩 Success message sent to self');
                    } catch (err) {
                        console.error('❌ Failed to send message:', err);
                    }
                }, 2000);
            }

            // Handle disconnection
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log('🔌 Connection closed:', DisconnectReason[reason]);

                // Restart process via PM2
                if ([
                    DisconnectReason.restartRequired,
                    DisconnectReason.timedOut,
                    DisconnectReason.connectionLost,
                ].includes(reason)) {
                    console.log('🔁 Restarting process...');
                }
                process.exit();
            }
        });

    } catch (err) {
        console.error('❌ Socket Error:', err);
        if (!res.headersSent) {
            res.status(500).send('Failed to initialize WhatsApp session');
        }
        qrSent = true;
    }

    // Fallback timeout
    setTimeout(() => {
        if (!qrSent) {
            console.error('⏰ QR generation timeout');
            if (!res.headersSent) {
                res.status(500).send('QR timeout — try again');
            }
            qrSent = true;
        }
    }, 30000);
});

// Helper: Make cacheable signal key store
function makeCacheableSignalKeyStore(store, logger) {
    return {
        get: (type, ids) => {
            const data = {};
            for (const id of ids) {
                if (store[type]?.has(id)) {
                    data[id] = store[type].get(id);
                }
            }
            return data;
        },
        set: (type, values) => {
            for (const [key, value] of Object.entries(values)) {
                if (!store[type]) store[type] = new Map();
                store[type].set(key, value);
            }
            logger?.debug({ type, count: Object.keys(values).length }, 'Updated store');
        }
    };
}

module.exports = router;
