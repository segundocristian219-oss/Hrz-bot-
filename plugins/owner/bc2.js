const bc2 = {
    name: 'broadcastall',
    alias: ['bc2', 'bcall'],
    category: 'owner',
    run: async (m, { conn, isROwner }) => {
        if (!isROwner) return m.reply('Solo el desarrollador principal puede usar este comando.');

        const rawText = m.text || m.body || '';
        const commandMatch = rawText.match(/^\.\w+\s+(.*)/s);
        const cleanText = commandMatch ? commandMatch[1] : '';
        const content = cleanText || (m.quoted ? (m.quoted.text || m.quoted.caption || '') : '');

        if (!content && !m.quoted) return m.reply('⚠ USO INCORRECTO\n\nEscribe el mensaje o etiqueta contenido.');

        const allBots = [conn, ...global.conns.filter(c => c.ws?.isOpen)];
        
        await m.reply(`🚀 Enviando a todos los bots activos...\n🤖 Cantidad: ${allBots.length}`);

        let totalSuccess = 0;
        let totalErrors = 0;

        for (const bot of allBots) {
            try {
                const getGroups = await bot.groupFetchAllParticipating();
                const groups = Object.values(getGroups);

                for (const group of groups) {
                    try {
                        if (m.quoted) {
                            await bot.copyNForward(group.id, m.quoted.fakeObj, true);
                        } else {
                            await bot.sendMessage(group.id, { text: content });
                        }
                        totalSuccess++;
                        await new Promise(res => setTimeout(res, 3500));
                    } catch (err) {
                        totalErrors++;
                    }
                }
                await new Promise(res => setTimeout(res, 5000));
            } catch (e) {
                console.error(e);
            }
        }

        await m.reply(`✅ Finalizado\n\n✨ Éxito: ${totalSuccess}\n❌ Error: ${totalErrors}\n🤖 Bots: ${allBots.length}`);
    }
};

export default bc2;
