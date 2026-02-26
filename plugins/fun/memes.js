import axios from 'axios';

global.tempReactions = global.tempReactions || {};

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn, usedPrefix, command }) => {
        try {
            await m.react('🕒');
            const { data: res } = await axios.get(`https://Api.deylin.xyz/api/search/memes?apikey=by_deylin`);
            
            if (!res.success || !res.memes || res.memes.length === 0) return m.react('❌');

            const randomMeme = res.memes[Math.floor(Math.random() * res.memes.length)];
            const caption = `*── 「 VOKER MEME 」 ──*\n\n> 😂 ¡Interactúa para más!\n\n*🔄 Reacciona para otro meme*`;

            const sentMsg = await conn.sendMessage(m.chat, { image: { url: randomMeme }, caption }, { quoted: m });

            const msgId = sentMsg.key.id;
            global.tempReactions[msgId] = {
                emoji: '🔄',
                command: `${usedPrefix}${command}`
            };

            setTimeout(() => { delete global.tempReactions[msgId] }, 5 * 60 * 1000);

            await conn.sendMessage(m.chat, { react: { text: '🔄', key: sentMsg.key } });
            await m.react('✅');

        } catch (error) {
            console.error(error);
            await m.react('❌');
        }
    }
};

export const handleReactionEvent = async (conn, m) => {
    if (!m?.message?.reactionMessage) return;
    
    const reaction = m.message.reactionMessage;
    const msgId = reaction.key.id;
    const emoji = reaction.text;

    if (global.tempReactions[msgId] && global.tempReactions[msgId].emoji === emoji) {
        if (m.key.fromMe) return;
        
        await conn.sendMessage(m.key.remoteJid, { text: global.tempReactions[msgId].command }, { quoted: m });
    }
};

export default memesCommand;
