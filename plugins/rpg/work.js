import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = {
    MIN_WORK: 100,
    MAX_WORK: 1000,
    BASE_COL: 1000
};

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const workCommand = {
    name: 'work',
    alias: ['trabajar', 'chamba', 'chambear'],
    category: 'rpg',
    run: async (m, { conn }) => {
        let user = await global.User.findOne({ id: m.sender });
        if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

        const now = Date.now();
        const cooldown = 10 * 60 * 1000; 
        const lastWork = user.lastWork || 0;

        if (now - lastWork < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastWork)) / 1000);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            return m.reply(`⨯ Necesitas descansar\nRegresa en: ${mins}m ${secs}s`);
        }

        const amount = Math.floor(Math.random() * (ECO_CONFIG.MAX_WORK - ECO_CONFIG.MIN_WORK + 1)) + ECO_CONFIG.MIN_WORK;

        const winLore = [
            "Optimizaste una base de datos y recibiste un pago",
            "Reparaste un error de sintaxis en un script crítico",
            "Configuraste un servidor proxy con éxito",
            "Realizaste mantenimiento preventivo a un sistema",
            "Ayudaste a un usuario a vincular su dispositivo",
            "Desplegaste una API sin errores en el primer intento"
        ];
        
        const lore = winLore[Math.floor(Math.random() * winLore.length)];
        let currentBalance = user.col || ECO_CONFIG.BASE_COL;
        let newCol = currentBalance + amount;
        
        if (newCol < ECO_CONFIG.BASE_COL) newCol = ECO_CONFIG.BASE_COL;

        await global.User.updateOne({ id: m.sender }, { $set: { col: newCol, lastWork: now } });

        const txt = `『 JORNADA EXITOSA 』\n\n◈ ${lore}\n──────────────────\n✦ Ganancia: +${formatCol(amount)} Col\n✧ Balance Actual: ${formatCol(newCol)} Col\n──────────────────`;

        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
    }
};

export default workCommand;
