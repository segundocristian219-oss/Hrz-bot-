import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import axios from 'axios';

const vokerTripleTest = {
    name: 'vtest',
    alias: ['tripletest', 'voker3'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('🧪');

            const videoUrl = 'https://raw.githubusercontent.com/DeylinEliac/voker-assets/main/video_demo.mp4';
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(response.data);

            const msg1 = generateWAMessageFromContent(m.chat, {
                videoMessage: {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption: '*── 「 PRUEBA 1: VIDEO + GIPHY HACK 」 ──*',
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
                extendedTextMessage: {
                    text: '*── 「 PRUEBA 2: IDENTIDAD PREMIUM 」 ──*\nMensaje con estética de canal oficial.',
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '1203631600301@newsletter',
                            serverMessageId: 100,
                            newsletterName: 'VOKER-OFFICIAL-BRAND'
                        }
                    }
                }
            }, { userJid: conn.user.id, quoted: m });
            await conn.relayMessage(m.chat, msg2.message, { messageId: msg2.key.id });

            const msg3 = generateWAMessageFromContent(m.chat, {
                extendedTextMessage: {
                    text: '*── 「 PRUEBA 3: TEXTO VERDE LIMPIO 」 ──*\nSin botones y sin vistas previas.',
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        sourceLabel: 'VOKER-SYSTEM-V2',
                        sourceUrl: ''
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

export default vokerTripleTest;
