export const dfail = (type, m, conn) => {
    const messages = {
        rowner: `> ❒ Solo mi creador puede usar este comando.`,
        owner: `> ❒ Solo mi creador puede usar este comando.`,
        group: `> ✎ Este comando sólo se puede usar en grupos.`,
        private: `De esto solo hablo en privado.`,
        admin: `> ♛ Sólo los administradores pueden ejecutar este comando.`,
        nsfw: `> ❒ El contenido NSFW está desactivado.`,
        botAdmin: `> ✰ Necesito ser administrador.`,
        self: `『 ✖ 』 Comando exclusivo para el host de la cuenta.`,
        isPrem: `> ❒ *Acceso Restringido*\n\n> Este comando es exclusivo para los bots con suscripción Premium.`
    };
    if (messages[type] && m.chat) conn.reply(m.chat, messages[type], m).catch(() => null);
};
