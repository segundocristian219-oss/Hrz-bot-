const info = {
    name: 'infobot',
    alias: ['info'],
    category: 'owner',
    run: async (m, { conn, text, command }) => {
     let txt = 'hola'
     await conn.sendMessage(m.chat, {
      text: txt
    }, { quoted: m });
   }
  };




export default info;