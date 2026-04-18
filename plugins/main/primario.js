const handler = async (m, { conn, text, usedPrefix, command, isROwner, isAdmin }) => {
    if (!m.isGroup) return;
    if (!isAdmin && !isROwner) return global.dfail('admin', m, conn);

    // Obtenemos el JID del bot mencionado o al que se le responde el mensaje
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^\d]/g, '') + '@s.whatsapp.net' : null;

    if (!who) return m.reply(`*¿A qué bot quieres poner como primario?*\nUso: ${usedPrefix + command} @mención`);

    // Guardamos el ID del bot elegido en la base de datos del chat
    await global.Chat.findOneAndUpdate(
        { id: m.chat },
        { $set: { primaryBot: who, isBanned: false } }, // Al poner primario, aseguramos que no esté baneado
        { upsert: true }
    );

    await m.reply(`✅ *Configuración actualizada*\n\nAhora solo el bot @${who.split('@')[0]} responderá en este grupo. Los demás subbots guardarán silencio.`);
};

handler.help = ['setprimary'];
handler.command = ['setprimary', 'botprincipal'];
handler.group = true;

export default handler;
