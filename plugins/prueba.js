const geturl = {
    name: 'geturl',
    category: 'tools',
    run: async (conn, m) => {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || (quoted.mediaWhiteList ? quoted.mediaWhiteList[0] : '');

        if (!/image|video|audio|sticker|document/.test(mime)) return;

        try {
            const media = await quoted.download?.() || await conn.downloadMediaMessage(quoted);
            if (!media) return;

            let mediaType = 'document';
            if (/image/.test(mime)) mediaType = 'image';
            else if (/video/.test(mime)) mediaType = 'video';
            else if (/audio/.test(mime)) mediaType = 'audio';

            const upload = await conn.waUploadToServer(media, { 
                mimetype: mime,
                fileType: mediaType 
            });

            const directUrl = upload.url;

            await conn.sendMessage(m.chat, { 
                text: directUrl 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
        }
    }
};

export default geturl;
