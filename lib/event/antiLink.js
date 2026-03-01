import { jidNormalizedUser } from '@whiskeysockets/baileys';

export default function(conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe || !m.key.remoteJid.endsWith('@g.us')) return;

            const chatJid = m.key.remoteJid;
            const chat = await global.Chat.findOne({ id: chatJid });
            
            // Si la base de datos no existe o antiLink está en false, no hace nada
            if (!chat || !chat.antiLink) return;

            const sender = m.key.participant || m.key.remoteJid;
            const text = (m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         m.message.imageMessage?.caption || 
                         m.message.videoMessage?.caption || "").trim();

            // Regex mejorada para capturar enlaces de grupos, canales y wa.me
            const linkRegex = /(chat.whatsapp.com\/[0-9A-Za-z]{20,24}|whatsapp.com\/channel\/[0-9A-Za-z]{20,24}|wa.me\/[0-9]+)/i;
            const isChannelForward = !!m.message.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo;

            if (linkRegex.test(text) || isChannelForward) {
                // Obtener metadata (priorizar caché para evitar lentitud)
                const groupMetadata = global.groupCache?.get(chatJid) || await conn.groupMetadata(chatJid).catch(() => null);
                if (!groupMetadata) return;

                const participants = groupMetadata.participants || [];
                const botJid = jidNormalizedUser(conn.user.id);
                const senderJid = jidNormalizedUser(sender);

                const getAdminStatus = (targetJid) => {
                    const p = participants.find(p => jidNormalizedUser(p.id) === targetJid || (p.lid && jidNormalizedUser(p.lid) === targetJid));
                    return !!(p?.admin || p?.isCommunityAdmin);
                };

                const isBotAdmin = getAdminStatus(botJid);
                const isAdmin = getAdminStatus(senderJid);
                const isOwner = global.owner.some(([num]) => num.replace(/\D/g, '') === senderJid.split('@')[0]);

                // Excepción para Admins y Owners
                if (isAdmin || isOwner) return;

                // Si es el link del mismo grupo, lo ignoramos
                if (text.includes('chat.whatsapp.com/')) {
                    const code = await conn.groupInviteCode(chatJid).catch(() => null);
                    if (code && text.includes(code)) return;
                }

                // EJECUCIÓN DE ACCIONES
                if (isBotAdmin) {
                    // Borrar mensaje
                    await conn.sendMessage(chatJid, { delete: m.key });
                    
                    // Expulsar usuario
                    await conn.groupParticipantsUpdate(chatJid, [sender], 'remove');
                    
                    // Notificar
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ANTI-LINK DETECTADO 」*\n\n> El usuario @${senderJid.split('@')[0]} ha sido eliminado por enviar enlaces no permitidos.`, 
                        mentions: [sender] 
                    });
                } else {
                    // Si el bot no es admin, solo avisa
                    await conn.sendMessage(chatJid, { 
                        text: `*「 ADVERTENCIA 」*\n\nSe detectó un enlace de @${senderJid.split('@')[0]}, pero no tengo permisos de Administrador para eliminarlo.`, 
                        mentions: [sender] 
                    }, { quoted: m });
                }
            }
        } catch (e) {
            console.error('Error en AntiLink:', e);
        }
    });
}
