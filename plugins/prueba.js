import axios from 'axios';

const musicViewCommand = {
    name: 'musicview',
    alias: ['testmusic', 'audioview'],
    category: 'prueba',
    run: async (m, { conn, text }) => {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        if (!/video|audio/.test(mime)) {
            m.react('⚠️');
            return conn.reply(m.chat, `> ⍰ Responde a un video o audio para enviarlo con estructura de música.`, m);
        }

        try {
            m.react('🕒');

            const media = await q.download();
            const title = text.split('|')[0]?.trim() || name();
            const author = text.split('|')[1]?.trim() || name();
            const albumArt = "https://api.dix.lat/media2/1773637265253.jpg";

            await conn.relayMessage(m.chat, {
                audioMessage: {
                    url: null,
                    mimetype: 'audio/mp4',
                    seconds: 30,
                    ptt: false,
                    contextInfo: {
                        externalAdReply: {
                            title: title,
                            body: author,
                            mediaType: 2,
                            mediaUrl: "https://www.instagram.com/adele",
                            thumbnailUrl: albumArt,
                            sourceUrl: "https://www.instagram.com/adele",
                            showAdAttribution: true,
                            renderLargerThumbnail: true
                        }
                    },
                    annotations: [
                        {
                            polygonVertices: [
                                { x: 0.25, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.41553908586502075 },
                                { x: 0.75, y: 0.5844531059265137 },
                                { x: 0.25, y: 0.5844531059265137 }
                            ],
                            shouldSkipConfirmation: true,
                            embeddedContent: {
                                embeddedMusic: {
                                    musicContentMediaId: "991565763443567",
                                    songId: "227020654558518",
                                    author: author,
                                    title: title,
                                    artworkDirectPath: albumArt,
                                    artistAttribution: `https://www.instagram.com/_u/${author.toLowerCase().replace(/\s/g, '')}`,
                                    isExplicit: false,
                                    musicSongStartTimeInMs: "0"
                                }
                            },
                            embeddedAction: true
                        }
                    ]
                }
            }, { quoted: m });

            m.react('✅');

        } catch (error) {
            console.error(`> [ERROR]: ${error.message}`);
            m.react('❌');
        }
    }
};

export default musicViewCommand;
