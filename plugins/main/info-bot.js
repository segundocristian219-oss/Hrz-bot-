const info = {
    name: 'infobot',
    alias: ['info'],
    category: 'owner',
    run: async (m, { conn, text, command }) => {
     let txt = `Hola, soy *${name()}*, un bot desarrollado para WhatsApp.

Actualmente cuento con más de 100 funciones activas y me encuentro en constante evolución. Si detectas algún error en mi funcionamiento, puedes informarlo directamente usando el comando *#report*.

Si deseas tener todas mis funciones en tu propio número de forma gratuita, utiliza el comando *#code* para convertirte en sub-bot. El sistema operará directamente bajo tu cuenta sin costo alguno.

Tu privacidad es nuestra prioridad. Somos un equipo de desarrollo responsable: no recopilamos ni almacenamos información de tus interacciones. Todas tus conversaciones permanecen protegidas por el cifrado de extremo a extremo de WhatsApp.`

     await conn.sendMessage(m.chat, {
      image: { url: global.img2() },
      text: txt
    }, { quoted: m });
   }
  };


export default info;