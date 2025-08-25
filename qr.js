router.get("/", async (req, res) => {
  const {
    default: SuhailWASocket,
    useMultiFileAuthState,
    Browsers,
    delay,
    DisconnectReason,
    makeInMemoryStore,
  } = require("@whiskeysockets/baileys");

  const store = makeInMemoryStore({
    logger: pino().child({ level: "silent", stream: "store" }),
  });

  async function SUHAIL() {
    const { state, saveCreds } = await useMultiFileAuthState(
      __dirname + "/auth_info_baileys"
    );

    try {
      let Smd = SuhailWASocket({
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
        auth: state,
      });

      let qrSent = false; // ✅ Prevent multiple responses

      // ✅ Timeout safeguard (15s)
      const qrTimeout = setTimeout(() => {
        if (!qrSent) {
          qrSent = true;
          res.status(504).send("QR code not generated in time. Please retry.");
        }
      }, 15000);

      Smd.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect, qr } = s;

        // ✅ Send QR code only once
        if (qr && !qrSent) {
          qrSent = true;
          clearTimeout(qrTimeout); // stop timeout
          res.setHeader("Content-Type", "image/png");
          try {
            const qrBuffer = await toBuffer(qr);
            res.end(qrBuffer);
          } catch (error) {
            console.error("Error generating QR Code buffer:", error);
            res.status(500).send("Failed to generate QR Code");
          }
        }

        if (connection == "open") {
          clearTimeout(qrTimeout); // ✅ also stop timeout when session opens
          await delay(3000);
          let user = Smd.user.id;

          //==================== SESSION ID ======================
          function randomMegaId(length = 6, numberLength = 4) {
            const characters =
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let result = "";
            for (let i = 0; i < length; i++) {
              result += characters.charAt(
                Math.floor(Math.random() * characters.length)
              );
            }
            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
            return `${result}${number}`;
          }

          const auth_path = "./auth_info_baileys/";
          const mega_url = await upload(
            fs.createReadStream(auth_path + "creds.json"),
            `${randomMegaId()}.json`
          );

          const Scan_Id = mega_url.replace("https://mega.nz/file/", "");

          console.log(`
====================  SESSION ID  ==========================                   
SESSION-ID ==> ${Scan_Id}
-------------------   SESSION CLOSED   -----------------------
`);

          let msgsss = await Smd.sendMessage(user, { text: Scan_Id });
          await Smd.sendMessage(user, { text: MESSAGE }, { quoted: msgsss });
          await delay(1000);
          try {
            await fs.emptyDirSync(__dirname + "/auth_info_baileys");
          } catch (e) {}
        }

        Smd.ev.on("creds.update", saveCreds);

        if (connection === "close") {
          clearTimeout(qrTimeout); // ✅ ensure timeout is cleared on close
          let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
          if (reason === DisconnectReason.connectionClosed) {
            console.log("Connection closed!");
          } else if (reason === DisconnectReason.connectionLost) {
            console.log("Connection Lost from Server!");
          } else if (reason === DisconnectReason.restartRequired) {
            console.log("Restart Required, Restarting...");
            SUHAIL().catch((err) => console.log(err));
          } else if (reason === DisconnectReason.timedOut) {
            console.log("Connection TimedOut!");
          } else {
            console.log("Connection closed with bot. Please run again.");
            console.log(reason);
            await delay(5000);
            exec("pm2 restart qasim");
            process.exit(0);
          }
        }
      });
    } catch (err) {
      console.log(err);
      exec("pm2 restart qasim");
      await fs.emptyDirSync(__dirname + "/auth_info_baileys");
    }
  }

  SUHAIL().catch(async (err) => {
    console.log(err);
    await fs.emptyDirSync(__dirname + "/auth_info_baileys");
    exec("pm2 restart qasim");
  });

  return await SUHAIL();
});
