import axios from 'axios';

const vokerTripleFinalForce = {
    name: 'vtestgif',
    alias: ['vgif3', 'pruebagif'],
    category: 'system',
    run: async (m, { conn }) => {
        m.react('🧪');

        let videoBuffer;
        const videoUrl = 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
        
        try {
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            videoBuffer = Buffer.from(response.data);
        } catch (e) {
            return m.react('❌');
        }

        // PRUEBA 1: Inyección vía ViewOnce (A veces salta filtros de metadatos)
        try {
            await conn.sendMessage(m.chat, {
                video: videoBuffer,
                caption: '*── 「 PRUEBA 1: NATIVO + GIPHY 」 ──*',
                gifPlayback: true,
                gifAttribution: 1,
                viewOnce: true,
                contextInfo: {
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '0@newsletter',
                        serverMessageId: 1,
                        newsletterName: 'VOKER-SYSTEM-V2'
                    }
                }
            }, { quoted: m });
        } catch (e) {}

        // PRUEBA 2: Inyección vía AdReply (La más estable para que no se borre)
        try {
            await conn.sendMessage(m.chat, {
                video: videoBuffer,
                caption: '*── 「 PRUEBA 2: AD REPLY HACK 」 ──*',
                gifPlayback: true,
                gifAttribution: 1,
                contextInfo: {
                    externalAdReply: {
                        title: 'VOKER-SYSTEM-V2',
                        body: 'Verified Media',
                        mediaType: 2,
                        thumbnailUrl: 'https://dix.lat/logo.png',
                        showAdAttribution: true,
                        sourceUrl: 'https://dix.lat'
                    }
                }
            }, { quoted: m });
        } catch (e) {}

        // PRUEBA 3: Inyección vía Mentions (Engaña al renderizado de etiqueta)
        try {
            await conn.sendMessage(m.chat, {
                video: videoBuffer,
                caption: '*── 「 PRUEBA 3: MENTION HACK 」 ──*',
                gifPlayback: true,
                gifAttribution: 1,
                mentions: [m.sender],
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 1,
                    sourceLabel: 'VOKER-SYSTEM-V2'
                }
            }, { quoted: m });
        } catch (e) {}

        m.react('✅');
    }
};

export default vokerTripleFinalForce;
