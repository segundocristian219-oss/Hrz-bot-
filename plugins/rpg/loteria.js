import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = { BASE_COL: 1000 };
const formatCol = (num) => Number(num).toLocaleString('de-DE');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loteriaCommand = {
    name: 'loteria',
    alias: ['lotto', 'sorteo', 'ticket', 'casino'],
    category: 'economy',
    run: async (m, { conn, args, usedPrefix, command, isOwner }) => {
        try {
            if (!isOwner) {
                return conn.reply(m.chat, `✦ Este comando todavía no está disponible para la versión *6.0.1*.\n✧ Por favor, espera la nueva actualización *6.0.2* para acceder al Sistema de Lotería.`, m);
            }

            if (!m.isGroup) return m.reply("『 ❗ 』 El Sistema de Lotería solo está habilitado en terminales de Grupo.");

            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

            const costo = 500; 
            const num = parseInt(args[0]);

            if (isNaN(num) || num < 1 || num > 10) {
                let menu = `『 🎰 LOTERÍA IMPERIAL 🎰 』\n\n`;
                menu += `> *ADQUISICIÓN DE BOLETOS*\n`;
                menu += `Para participar, selecciona un terminal digital (1-10).\n\n`;
                menu += `◈ *CÓDIGO:* ${usedPrefix + command} <1-10>\n`;
                menu += `◈ *VALOR:* ${formatCol(costo)} Col\n`;
                menu += `◈ *JACKPOT:* 50.000 - 100.000 Col\n\n`;
                menu += `✦ *TU BOLSA:* ${formatCol(user.col || 0)} Col\n`;
                menu += `────────────────────`;
                return conn.reply(m.chat, menu, m);
            }

            if ((user.col || 0) < costo) {
                return conn.reply(m.chat, `『 💸 』 *TRANSACCIÓN FALLIDA*\n\nFondos insuficientes para procesar el boleto.\n✧ *Costo:* ${formatCol(costo)} Col\n✦ *Balance:* ${formatCol(user.col)} Col`, m);
            }

            const ahora = Date.now();
            const ganador = Math.floor(Math.random() * 10) + 1;
            const esJackpot = Math.random() < 0.05; 
            const premio = esJackpot ? (Math.floor(Math.random() * 50000) + 100000) : (Math.floor(Math.random() * 25000) + 25000);
            const gano = num === ganador;

            let finalCol = (user.col || ECO_CONFIG.BASE_COL) - costo;
            if (gano) finalCol += premio;
            if (finalCol < ECO_CONFIG.BASE_COL) finalCol = ECO_CONFIG.BASE_COL;

            await global.User.updateOne({ id: m.sender }, { $set: { col: finalCol, lastLoteria: ahora } });

            const { key } = await conn.sendMessage(m.chat, { 
                text: `『 🎟️ BOLETO SELLADO 』\n\n👤 *CLIENTE:* ${m.pushName.toUpperCase()}\n🔢 *NÚMERO:* [ ${num} ]\n📦 *ESTADO:* Procesando compra...` 
            }, { quoted: m });

            await delay(1500);
            await conn.sendMessage(m.chat, { text: `『 🎰 TÓMBOLA ACTIVA 』\n\nLos bombos están girando... 🌀\n[ 🔘 | 🔘 | 🔘 | 🔘 | 🔘 ]`, edit: key });

            await delay(1500);
            await conn.sendMessage(m.chat, { text: `『 🎰 TÓMBOLA ACTIVA 』\n\nExtrayendo esfera premiada... 🔮\n[ 🟢 | 🟡 | 🔴 | 🟡 | 🟢 ]`, edit: key });

            await delay(2000);

            let resTxt = `『 🏆 RESULTADO DEL SORTEO 🏆 』\n\n`;
            resTxt += `◈ *TU ELECCIÓN:* [ ${num} ]\n`;
            resTxt += `🎯 *NÚMERO GANADOR:* [ ${ganador} ]\n`;
            resTxt += `────────────────────\n\n`;

            if (gano) {
                resTxt += esJackpot ? `🌟 ¡JACKPOT LEGENDARIO! 🌟\n` : `✨ ¡HAS GANADO EL SORTEO! ✨\n`;
                resTxt += `💰 *PREMIO:* +${formatCol(premio)} Col\n`;
                await m.react("🔥");
            } else {
                resTxt += `🌑 *DERROTA*\n`;
                resTxt += `💸 *PÉRDIDA:* -${formatCol(costo)} Col\n`;
                resTxt += `> _La suerte no estuvo de tu lado esta vez._\n`;
                await m.react("💀");
            }

            resTxt += `\n✧ *NUEVO BALANCE:* ${formatCol(finalCol)} Col\n────────────────────`;

            await conn.sendMessage(m.chat, { text: resTxt, edit: key });

        } catch (e) {
            console.error(e);
            await m.react("⚠️");
        }
    }
};

export default loteriaCommand;
        
