import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerTripleGifTest = {
    name: 'vtestgif',
    alias: ['vgif3', 'pruebagif'],
    category: 'system',
    run: async (m, { conn }) => {
        try {
            m.react('🧪');

            const videoUrl = 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(response.data);

            const msg1 = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: '*── 「 PRUEBA 1: NEWSLETTER OVERLAY 」 ──*',
                    gifPlayback: true,
                    gifAttribution: 1,
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '0@newsletter',
                            serverMessageId: 1,
                            newsletterName: 'VOKER-SYSTEM-V2'
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, msg1.message, { messageId: msg1.key.id });

            const msg2 = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: '*── 「 PRUEBA 2: SOURCE LABEL INJECTION 」 ──*',
                    gifPlayback: true,
                    gifAttribution: 1,
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        sourceLabel: 'VOKER-SYSTEM-V2',
                        sourceUrl: 'https://dix.lat',
                        showAdAttribution: true
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, msg2.message, { messageId: msg2.key.id });

            const msg3 = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: '*── 「 PRUEBA 3: AD ATTRIBUTION HACK 」 ──*',
                    gifPlayback: true,
                    gifAttribution: 1,
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        externalAdReply: {
                            title: 'VOKER-SYSTEM-V2',
                            body: 'Verified Media',
                            mediaType: 2,
                            thumbnailUrl: 'https://dix.lat/logo.png',
                            showAdAttribution: true
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, msg3.message, { messageId: msg3.key.id });

            m.react('✅');

        } catch (error) {
            console.error(error);
            m.react('❌');
        }
    }
};

export default vokerTripleGifTest;
