/*const antisubPlugin = {
    name: 'antisub',
    alias: ['antisubs'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { conn, text, chat }) => {
        if (!text) return m.reply(`*¿Deseas activar o desactivar?*\nUso: .antisub on / off`);

        const input = text.toLowerCase();

        if (input === 'on') {
            chat.antisub = true;
            await chat.save();
            await m.reply(`*MODO ANTISUB ACTIVADO*\n\nAhora los sub-bots ignorarán este grupo y solo responderá el bot principal.`);
        } else if (input === 'off') {
            chat.antisub = false;
            await chat.save();
            await m.reply(`*MODO ANTISUB DESACTIVADO*\n\nLos sub-bots pueden volver a responder en este grupo.`);
        } else {
            await m.reply(`*Opción no válida.*\nUse: .antisub on / off`);
        }
    }
};

export default antisubPlugin;*/
