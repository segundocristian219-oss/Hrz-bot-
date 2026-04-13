import { jidNormalizedUser } from '@whiskeysockets/baileys';

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const workCommand = {
    name: 'work',
    alias: ['trabajar', 'chamba', 'chambear'],
    category: 'rpg',
    run: async (m, { conn }) => {
        let user = await global.User.findOne({ id: m.sender });
        if (!user) user = await global.User.create({ id: m.sender, col: 1000 });

        const now = Date.now();
        const cooldown = 10 * 60 * 1000; 
        const lastWork = user.lastWork || 0;

        if (now - lastWork < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastWork)) / 1000);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            return m.reply(`⨯ Necesitas descansar. Regresa en: ${mins}m ${secs}s`);
        }

        const amount = Math.floor(Math.pow(Math.random(), 3) * 99999) + 1;

        const winLore = [
            "Desarrollaste un bot para una empresa y te pagaron el contrato.",
            "Reparaste la placa base de un telefono de alta gama.",
            "Hackeaste la seguridad de una corporacion rival y vendiste los datos.",
            "Trabajaste como guardia de seguridad en un evento VIP.",
            "Minaste criptomonedas aprovechando la electricidad de tu vecino.",
            "Ganaste un torneo de programacion clandestino.",
            "Encontraste una billetera perdida y el dueño te dio una recompensa.",
            "Ayudaste a descargar mercancía pesada en el muelle de la ciudad."
        ];
        
        const lore = winLore[Math.floor(Math.random() * winLore.length)];
        let newCol = (user.col || 1000) + amount;
        
        if (newCol < 1000) newCol = 1000;

        await global.User.updateOne({ id: m.sender }, { $set: { col: newCol, lastWork: now } });

        const txt = `『 JORNADA EXITOSA 』\n\n◈ ${lore}\n──────────────────\n✦ Ganancia: +${formatCol(amount)} Col\n✧ Balance Actual: ${formatCol(newCol)} Col\n──────────────────`;

        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
    }
};

export default workCommand;
