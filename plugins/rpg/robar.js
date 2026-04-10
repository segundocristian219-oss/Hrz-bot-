const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const stealCommand = {
    name: 'steal',
    alias: ['robar', 'hurtar'],
    category: 'economy',
    run: async (m, { conn, isOwner }) => {
        let targetId = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null);
        
        if (!targetId) return m.reply("⨯ Etiqueta a alguien o responde a su mensaje para robarle.");
        if (targetId === m.sender) return m.reply("⨯ No puedes robarte a ti mismo.");

        const user = await global.User.findOne({ id: m.sender });
        const target = await global.User.findOne({ id: targetId });

        if (!user) return m.reply("⨯ No tienes una cuenta registrada.");
        if (!target) return m.reply("⨯ La victima no tiene una cuenta registrada.");
        if ((target.col || 0) < 100) return m.reply("⨯ La victima es demasiado pobre para ser robada.");

        const now = Date.now();
        const cooldown = 30 * 60 * 1000; // 30 minutos

        if (!isOwner && user.lastSteal && (now - user.lastSteal) < cooldown) {
            const remaining = cooldown - (now - user.lastSteal);
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            return m.reply(`⨯ Debes esperar ${minutes}m ${seconds}s para volver a robar.`);
        }

        // Lógica de probabilidades
        const chance = Math.random();
        let stealTxt = "";

        if (chance < 0.30) { 
            // 30% Probabilidad de fallar
            stealTxt = `『 INTENTO FALLIDO 』\n\n`;
            stealTxt += `✦ @${m.sender.split('@')[0]} intento robarle a @${targetId.split('@')[0]} pero lo descubrieron y huyo con las manos vacias.`;
        } else {
            // 70% Probabilidad de éxito
            // Usamos una curva para que los montos bajos sean mas comunes
            const randomPower = Math.pow(Math.random(), 3); 
            let amount = Math.floor(randomPower * (10000 - 100) + 100);
            
            // Si la victima tiene menos de lo que queremos robar, le quitamos todo lo que tenga en cartera
            if (target.col < amount) amount = target.col;

            const newUserCol = (user.col || 0) + amount;
            const newTargetCol = target.col - amount;

            await global.User.updateOne({ id: m.sender }, { $set: { col: newUserCol, lastSteal: now } });
            await global.User.updateOne({ id: targetId }, { $set: { col: newTargetCol } });

            stealTxt = `『 ROBO EXITOSO 』\n\n`;
            stealTxt += `✦ Ladron: @${m.sender.split('@')[0]}\n`;
            stealTxt += `✦ Victima: @${targetId.split('@')[0]}\n`;
            stealTxt += `──────────────────\n`;
            stealTxt += `◈ Botin: ${formatCol(amount)} Col\n`;
            stealTxt += `──────────────────\n\n`;
            stealTxt += `> Solo se puede robar el dinero de la cartera.`;
        }

        await conn.sendMessage(m.chat, { text: stealTxt, mentions: [m.sender, targetId] }, { quoted: m });
    }
};

export default stealCommand;
          
