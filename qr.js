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

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: state.keys,
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Safari'),
    });

    // On QR update → send image directly
    sock.ev.on('connection.update', async (update) => {
        const { qr } = update;
        if (qr) {
            console.log('QR Code received, generating image...');

            // Convert QR to PNG buffer
            const qrImage = await qrcode.toBuffer(qr, { type: 'image/png', quality: 1, margin: 1 });

            // Set headers and send image directly
            res.type('png');
            return res.end(qrImage, 'binary');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('✅ WhatsApp connected!');
            const userJid = sock.user.id;

            // Send success message
            setTimeout(async () => {
                try {
                    await sock.sendMessage(userJid, { text: MESSAGE });
                    console.log('✅ Login message sent');
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
                qr();
            } else if (reason === DisconnectReason.timedOut) {
                console.log('⏳ Timed out, reconnecting...');
                qr();
            } else {
                console.log('🔁 Reconnect failed');
            }
        }
    });
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = router;
