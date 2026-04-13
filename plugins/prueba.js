import axios from 'axios';
import { generateWAMessageContent } from '@whiskeysockets/baileys';

const musicViewCommand = {
    name: 'musicview',
    alias: ['testmusic', 'audioview'],
    category: 'prueba',
    run: async (m, { conn, text }) => {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        if (!/video/.test(mime)) {
            m.react('⚠️');
            return conn.reply(m.chat, `> ⍰ Responde a un video.`, m);
        }

        try {
            m.react('🕒');

            const media = await q.download();
            const title = text?.split('|')[0]?.trim() || "KIRITO MUSIC";
            const author = text?.split('|')[1]?.trim() || "VOKER SYSTEM";
            const albumArtUrl = "https://api.dix.lat/media2/1773637265253.jpg";

            const resp = await axios.get(albumArtUrl, { responseType: 'arraybuffer' });
            const thumbnail = Buffer.from(resp.data);

            const messageContent = await generateWAMessageContent(
                { video: media, mimetype: 'video/mp4' },
                { upload: conn.waUploadToServer }
            );

            const videoMsg = messageContent.videoMessage;

            await conn.relayMessage(m.chat, {
                videoMessage: {
                    ...videoMsg,
                    jpegThumbnail: thumbnail,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        externalAdReply: {
                            title: title,
                            body: author,
                            mediaType: 2,
                            renderLargerThumbnail: true,
                            thumbnail: thumbnail,
                            sourceUrl: "https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29"
                        }
                    }
                }
            }, { quoted: m });

            m.react('✅');

        } catch (e) {
            m.react('❌');
            conn.reply(m.chat, `> ❌ Error: ${e.message}`, m);
        }
    }
};

export default musicViewCommand;