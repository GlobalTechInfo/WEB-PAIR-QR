const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const { Boom } = require("@hapi/boom");

// 🟢 Your custom message with SEPTORCH branding
const MESSAGE = process.env.MESSAGE || `
*SESSION GENERATED SUCCESSFULY* ✅

*🌟 Join the official channel for more courage, updates, and support!* 🌟
https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04  

*Ask me any question Here* 

ngl.link/septorch

Instagram: instagram.com/septorch29

TikTok: tiktok.com/@septorch


I will answer your question on the channel 
https://whatsapp.com/channel/0029Vb1ydGk8qIzkvps0nZ04  


*SEPTORCH--WHATTSAPP-BOT*
`;

const { upload } = require('./mega');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");

// Clear auth folder on startup
if (fs.existsSync('./auth_info_baileys')) {
    fs.emptyDirSync(__dirname + '/auth_info_baileys');
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    async function SUHAIL() {
        const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_baileys`);
        try {
            let Smd = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                // 🔥 CUSTOM DEVICE NAME FOR WHATSAPP PAIRING SCREEN
                browser: ["SEPTORCH", "Safari", "Mac OS X 10_15_7"], // Shows as "SEPTORCH on Safari"
            });

            if (!Smd.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Smd.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Smd.ev.on('creds.update', saveCreds);
            Smd.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    try {
                        await delay(10000);

                        const auth_path = './auth_info_baileys/';
                        let user = Smd.user.id;

                        // 🔥 CUSTOM FILENAME GENERATOR WITH SEPTORCH PREFIX
                        function randomMegaId(prefix = "SEPTORCH", suffixLength = 6, numberLength = 4) {
                            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                            let suffix = '';
                            for (let i = 0; i < suffixLength; i++) {
                                suffix += characters.charAt(Math.floor(Math.random() * characters.length));
                            }
                            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                            return `${prefix}-${suffix}${number}`;
                        }

                        // Upload credentials to Mega
                        const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${randomMegaId()}.json`);
                        const Id_session = mega_url.replace('https://mega.nz/file/',  '');

                        const Scan_Id = Id_session;

                        // Send session ID and message to user
                        let msgsss = await Smd.sendMessage(user, { text: Scan_Id });
                        await Smd.sendMessage(user, { text: MESSAGE }, { quoted: msgsss });
                        await delay(1000);
                        try { await fs.emptyDirSync(__dirname + '/auth_info_baileys'); } catch (e) {}

                    } catch (e) {
                        console.log("Error during file upload or message send: ", e);
                    }

                    await delay(100);
                    await fs.emptyDirSync(__dirname + '/auth_info_baileys');
                }

                // Handle connection closures
                if (connection === "close") {
                    let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                    if (reason === DisconnectReason.connectionClosed) {
                        console.log("Connection closed!");
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.log("Connection Lost from Server!");
                    } else if (reason === DisconnectReason.restartRequired) {
                        console.log("Restart Required, Restarting...");
                        SUHAIL().catch(err => console.log(err));
                    } else if (reason === DisconnectReason.timedOut) {
                        console.log("Connection TimedOut!");
                    } else {
                        console.log('Connection closed with bot. Please run again.');
                        console.log(reason);
                        await delay(5000);
                        exec('pm2 restart qasim');
                    }
                }
            });

        } catch (err) {
            console.log("Error in SUHAIL function: ", err);
            exec('pm2 restart qasim');
            console.log("Service restarted due to error");
            SUHAIL();
            await fs.emptyDirSync(__dirname + '/auth_info_baileys');
            if (!res.headersSent) {
                await res.send({ code: "Try After Few Minutes" });
            }
        }
    }

    await SUHAIL();
});

module.exports = router;
