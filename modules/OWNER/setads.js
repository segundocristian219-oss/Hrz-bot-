export const setMsgModule = {
    category: 'owner',
    commands: {
        setmsg: {
            name: 'setmsg',
            alias: ['setcomunicado', 'setads'],
            run: async (m, { conn, text, isROwner }) => {
                if (!isROwner) return;
                if (global.conn.user.jid != conn.user.jid) return;

                if (!text) return m.reply('⚠️ Indica el nuevo mensaje para el menú.\nEjemplo: #setmsg ¡Nueva actualización disponible!');

                try {
                    await m.react('🕓');

                    global.ads.mensaje = text.trim();

                    await m.react('✅');
                    await m.reply(`✅ *Mensaje actualizado con éxito*\n\n*Nuevo mensaje:* ${global.ads.mensaje}`);
                } catch (e) {
                    console.error(e);
                    await m.react('❌');
                    await m.reply('❌ Ocurrió un error al intentar actualizar el mensaje.');
                }
            }
        }
    }
};
