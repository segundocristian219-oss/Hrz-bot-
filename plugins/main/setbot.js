const antisubPlugin = {
    name: 'antisub',
    alias: ['antisubs'],
    category: 'group',
    admin: true,
    group: true,
    run: async (m, { text, chat }) => {
        if (!text) return m.reply(`*¿Estado del filtro?*\nUso: .antisub on (Solo Principal) / off (Solo Sub-bots)`);

        const input = text.toLowerCase();
        if (input === 'on') {
            chat.antisub = true;
            await chat.save();
            await m.reply(`*FILTRO ACTIVADO*\n\nPropiedad: Principal\nEstado: Solo el bot principal responderá en este grupo.`);
        } else if (input === 'off') {
            chat.antisub = false;
            await chat.save();
            await m.reply(`*FILTRO DESACTIVADO*\n\nPropiedad: Sub-bots\nEstado: Solo los sub-bots responderán en este grupo.`);
        } else {
            await m.reply(`*Opción no válida.*\nUse: .antisub on / off`);
        }
    }
};

export default antisubPlugin;
