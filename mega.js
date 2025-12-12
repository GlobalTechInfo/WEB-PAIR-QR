import { Storage } from 'megajs';

const auth = {
    email: 'your mega email',       // your MEGA email
    password: 'password',    // your MEGA password
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246'
};

export const upload = async (data, name) => {
    try {
        if (!auth.email || !auth.password) {
            throw new Error("Missing MEGA authentication info");
        }

        if (typeof data === 'string') data = Buffer.from(data);

        const storage = await new Storage(auth).ready;

        const file = await storage.upload({ name, allowUploadBuffering: true }, data).complete;

        const url = await file.link();

        await storage.close();

        return url;

    } catch (err) {
        console.error("Error uploading file to MEGA:", err);
        throw err;
    }
};
