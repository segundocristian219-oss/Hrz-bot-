const info = {
    name: 'infobot',
    alias: ['info'],
    category: 'owner',
    run: async (m, { conn, text, command }) => {
     let txt = `hola, soy *${name()}* un bot desarrollado para WhatsApp actualmente tengo mas de 100 funciones activas estoy en constante desarrollo y puedo tener fallas menores si detectas errores usá el comando #report para reportar los errores usá el comando #code para convertirte en sub-bot y tener el bot completamente gratis en tu grupo sin costo alguno el bot operará bajo tu número nota importante nosotros somos un equipo de desarrolladores legales y ponemos tu privacidad primero no recopilamos ni almacenamos información de los usuarios que interactúan con nuestro sistema tus conversaciones están cifrada de extremo extremo........`
     await conn.sendMessage(m.chat, {
      text: txt
    }, { quoted: m });
   }
  };




export default info;