import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from '../identifier.js';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            const sender = await getRealJid(conn, m.key.participant || m.key.remoteJid, m);

            if (!global.db?.data) return;
            const chat = global.db.data.chats[chatJid];
            if (!chat || !chat.antiLink) return;

            const text = (m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         m.message.imageMessage?.caption || 
                         m.message.videoMessage?.caption || "").trim();

            const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
            const linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i;

            if (linkRegex.test(text) || linkRegex1.test(text)) {
                // Obtenemos metadata fresca y forzamos la verificación
                const groupMetadata = await conn.groupMetadata(chatJid).catch(() => null);
                if (!groupMetadata) return;

                const participants = groupMetadata.participants || [];
                
                // Normalizamos el ID del bot (quitando el :1, :2 etc del multidispositivo)
                const botJid = jidNormalizedUser(conn.user.id);

                // Buscamos al bot y al usuario en la lista
                const botPart = participants.find(p => jidNormalizedUser(p.id) === botJid);
                const userPart = participants.find(p => jidNormalizedUser(p.id) === sender);

                // Verificación estricta de Admin
                const isBotAdmin = botPart?.admin === 'admin' || botPart?.admin === 'superadmin';
                const isAdmin = userPart?.admin === 'admin' || userPart?.admin === 'superadmin';
                const isOwner = global.owner.some(([num]) => num.replace(/\D/g, '') === sender.split('@')[0]);

                if (isAdmin || isOwner) return;

                // Ignorar si es el link de este mismo grupo
                const code = await conn.groupInviteCode(chatJid).catch(() => null);
                if (code && text.includes(code)) return;

                if (isBotAdmin) {
                    // 1. Borrar mensaje
                    await conn.sendMessage(chatJid, { delete: m.key });
                    
                    // 2. Expulsar al usuario
                    const response = await conn.groupParticipantsUpdate(chatJid, [sender], 'remove');
                    
                    // Si la expulsión fue exitosa (código 200), avisamos
                    if (response[0]?.status === '200') {
                        await conn.sendMessage(chatJid, { 
                            text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} fue eliminado por hacer spam.`, 
                            mentions: [sender] 
                        });
                    }
                } else {
                    // Solo enviamos el aviso si realmente NO somos admin
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ENLACE DETECTADO 」*\n\n@${sender.split('@')[0]} Los enlaces no están permitidos.\n\n> El sistema no puede eliminarte porque no soy Administrador.`, 
                        mentions: [sender] 
                    }, { quoted: m });
                }
            }
        } catch (e) {
            console.error("[AntiLink Critical Error]:", e);
        }
    });
}
