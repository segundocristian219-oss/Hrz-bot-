const antisubPlugin = {
    name: 'antisub',
    alias: ['antisubs'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { text, chat, conn }) => {
        if (!text) return conn.reply(m.chat, `*¿Estado del filtro?*\nUso: .antisub on / off`, m);

        const input = text.toLowerCase();
        if (input === 'on') {
            chat.antisub = true;
            await chat.save();
            await conn.reply(m.chat, `*「 ANTISUB ACTIVADO 」*\n\nSolo el bot principal responderá en este grupo.`, m);
        } else if (input === 'off') {
            chat.antisub = false;
            await chat.save();
            await conn.reply(m.chat, `*「 ANTISUB DESACTIVADO 」*\n\nTodos los bots responderán en este grupo.`, m);
        } else {
            await conn.reply(m.chat, `*Opción no válida.*\nUse: .antisub on / off`, m);
        }
    }
};

export default antisubPlugin;
