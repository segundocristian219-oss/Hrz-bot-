const info = {
    name: 'infobot',
    alias: ['info'],
    category: 'owner',
    run: async (m, { conn, text, isROwner, command }) => {
     let txt = 'hola'
     await conn.sendMessage(m.chat, {
      caption: txt
    }, { quoted: m });
};


export default info;