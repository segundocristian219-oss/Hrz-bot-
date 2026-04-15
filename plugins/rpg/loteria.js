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

            /*
            const ownerList = global.owner || global.config?.owner || [];
            const checkOwner = isOwner || ownerList.some(owner => owner[0].replace(/\D/g, '') === m.sender.split('@')[0]);

            if (!checkOwner) {
                return conn.reply(m.chat, `Este comando aún no está disponible.`, m);
            }
            */

            if (!m.isGroup) return m.reply("El sistema de lotería solo está disponible en grupos.");

            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

            const costo = 500; 
            const num = parseInt(args[0]);

            if (isNaN(num) || num < 1 || num > 10) {
                let menu = `╭━━━〔 🎰 LOTERÍA 〕━━━╮\n`;
                menu += `┃ Uso: ${usedPrefix + command} <1-10>\n`;
                menu += `┃ Costo: ${formatCol(costo)} Col\n`;
                menu += `┃ Premio: 25K - 150K Col\n`;
                menu += `┃\n`;
                menu += `┃ 💰 Balance: ${formatCol(user.col || 0)} Col\n`;
                menu += `╰━━━━━━━━━━━━━━╯`;
                return conn.reply(m.chat, menu, m);
            }

            if ((user.col || 0) < costo) {
                return conn.reply(m.chat, `💸 Fondos insuficientes\nCosto: ${formatCol(costo)} Col\nSaldo: ${formatCol(user.col || 0)} Col`, m);
            }

            let saldo = (user.col || 0) - costo;

            const ganador = Math.floor(Math.random() * 10) + 1;
            const esJackpot = Math.random() < 0.05; 

            const premio = esJackpot
                ? (Math.floor(Math.random() * 50000) + 100000)
                : (Math.floor(Math.random() * 25000) + 25000);

            const gano = num === ganador;

            if (gano) saldo += premio;

            await global.User.updateOne(
                { id: m.sender },
                { $set: { col: saldo, lastLoteria: Date.now() } }
            );

            const { key } = await conn.sendMessage(m.chat, { 
                text: `🎟️ BOLETO\n\n👤 ${m.pushName}\n🎯 Número: ${num}\n⏳ Procesando...`
            }, { quoted: m });

            await delay(1200);

            let bolas = ['🔘','🔘','🔘','🔘','🔘'];
            const pool = ['🟢','🟡','🔴','🟣','🔵'];

            for (let i = 0; i < bolas.length; i++) {
                bolas[i] = pool[Math.floor(Math.random() * pool.length)];

                await conn.sendMessage(m.chat, {
                    text: `🎰 SORTEO\n\n[ ${bolas.join(' | ')} ]`,
                    edit: key
                });

                await delay(450);
            }

            await delay(900);

            let barra = '▰▰▰▰▰▰▰▰▰▰';

            let resTxt = `╭━━━〔 🎰 RESULTADO 〕━━━╮\n`;
            resTxt += `┃ 🎯 Tu número: ${num}\n`;
            resTxt += `┃ 🎲 Ganador: ${ganador}\n`;
            resTxt += `┃ ${barra}\n`;

            if (gano) {
                resTxt += esJackpot ? `┃ 💎 JACKPOT\n` : `┃ 🎉 GANASTE\n`;
                resTxt += `┃ +${formatCol(premio)} Col\n`;
                await m.react("🔥");
            } else {
                resTxt += `┃ 💀 PERDISTE\n`;
                resTxt += `┃ -${formatCol(costo)} Col\n`;
                await m.react("❌");
            }

            resTxt += `┃ ${barra}\n`;
            resTxt += `┃ 💰 Saldo: ${formatCol(saldo)} Col\n`;
            resTxt += `╰━━━━━━━━━━━━━━╯`;

            await conn.sendMessage(m.chat, { text: resTxt, edit: key });

        } catch (e) {
            console.error(e);
            await m.react("⚠️");
        }
    }
};

export default loteriaCommand;
