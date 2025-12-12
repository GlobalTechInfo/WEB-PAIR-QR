import { Storage } from 'megajs';

const auth = {
    email: '',        // use your MEGA email
    password: '',       // use your MEGA password
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246'
};

export const upload = async (data, name) => {
    try {
        if (!auth.email || !auth.password || !auth.userAgent) {
            throw new Error("Missing required authentication fields");
        }

        console.log("Using auth:", auth);

        const storage = await new Storage(auth).ready;

        const file = await storage.upload({ name }, data).complete;

        const url = await file.link();

        await storage.close();

        return url;

    } catch (err) {
        throw err;
    }
};
