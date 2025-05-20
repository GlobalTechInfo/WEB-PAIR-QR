const { Storage } = require("megajs");

const auth = {
    email: 'jakejasons580@gmail.com',
    password: 'Septorch111$$',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246'
};

const upload = (data, name) => {
    return new Promise((resolve, reject) => {
        if (!auth.email || !auth.password || !auth.userAgent) {
            return reject(new Error("Missing required authentication fields"));
        }

        const storage = new Storage(auth);

        storage.on('ready', () => {
            const uploader = storage.upload({ name, allowUploadBuffering: true }); // ✅ Fixed here

            uploader.on('complete', file => {
                file.link((err, url) => {
                    storage.close();
                    if (err) return reject(err);
                    resolve(url);
                });
            });

            uploader.on('error', err => {
                storage.close();
                reject(err);
            });

            data.pipe(uploader);
        });

        storage.on('error', err => {
            reject(err);
        });
    });
};

module.exports = { upload };
