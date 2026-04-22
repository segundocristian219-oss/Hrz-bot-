import { jidNormalizedUser } from '@whiskeysockets/baileys';

const groupConfig = {
    name: 'config',
    alias: ['configuracion', 'settings', 'groupinfo'],
    category: 'main',
    admin: true, 
    run: async (m, { conn, usedPrefix, command }) => {
        try {
            if (!m.isGroup) return m.reply("『 ❗ 』 Este comando solo puede usarse en grupos.");

            const groupMetadata = await conn.groupMetadata(m.chat);
            const { subject, description, creation, owner, participants } = groupMetadata;
            
            const admins = participants.filter(p => p.admin || p.isCommunityAdmin);
            const listAdmins = admins.length;

            let chat = await global.Chat.findOne({ id: m.chat });
            if (!chat) chat = await global.Chat.create({ id: m.chat });

            const dateCreation = new Date(creation * 1000).toLocaleDateString('es-ES');

            let configMsg = `『 ⚙️ CONFIGURACIÓN DEL GRUPO 』\n\n`;
            configMsg += `📝 *Nombre:* ${subject}\n`;
            configMsg += `👤 *Creador:* @${owner ? owner.split('@')[0] : 'No disponible'}\n`;
            configMsg += `📅 *Creado el:* ${dateCreation}\n`;
            configMsg += `👥 *Miembros:* ${participants.length}\n`;
            configMsg += `👮 *Administradores:* ${listAdmins}\n\n`;
            
            configMsg += `『 🛡️ ESTADO DEL BOT 』\n`;
            configMsg += `🤖 *Estado:* ${chat.isBanned ? '🔴 Suspendido' : '🟢 Activo'}\n`;
            configMsg += `👋 *Bienvenida:* ${chat.welcome ? '✅' : '❌'}\n`;
            configMsg += `🔞 *NSFW:* ${chat.nsfw ? '✅' : '❌'}\n`;
            configMsg += `🔗 *Antilink:* ${chat.antiLink ? '✅' : '❌'}\n`;
            configMsg += `🚫 *Antisub:* ${chat.antisub ? '✅' : '❌'}\n`;
            configMsg += `🛡️ *Modo Admin:* ${chat.modoadmin ? '✅' : '❌'}\n\n`;

            configMsg += `📖 *Descripción:* \n${description ? description : 'Sin descripción.'}\n\n`;
            configMsg += `> Para cambiar ajustes usa los comandos correspondientes.`;

            return conn.sendMessage(m.chat, { 
                text: configMsg,
                mentions: [owner].filter(i => i),
                contextInfo: { ...global.channelInfo }
            }, { quoted: m });

        } catch (e) {
            console.error("Error en comando config:", e);
            m.reply("『 ❗ 』 Hubo un error al obtener la configuración.");
        }
    }
};

export default groupConfig;
          
