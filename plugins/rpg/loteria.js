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
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL, streak: 0 });

            let num = parseInt(args[0]);
            let apuesta = args[1] === 'all' ? (user.col || 0) : parseInt(args[1]) || 500;

            if (isNaN(num) || num < 1 || num > 10) {
                let menu = `╭━━━〔 🎰 LOTERÍA MENU 〕━━━╮\n`;
                menu += `┃ Uso: ${usedPrefix + command} <1-10> [apuesta]\n`;
                menu += `┃ Ej: ${usedPrefix + command} 7 2000\n`;
                menu += `┃ Ej: ${usedPrefix + command} 3 all\n`;
                menu += `┃\n`;
                menu += `┃ 💰 Balance: ${formatCol(user.col || 0)}\n`;
                menu += `┃ 🔥 Racha: ${user.streak || 0}\n`;
                menu += `╰━━━━━━━━━━━━━━╯`;
                return conn.reply(m.chat, menu, m);
            }

            if ((user.col || 0) < apuesta || apuesta <= 0) {
                return conn.reply(m.chat, `💸 Fondos insuficientes\nApuesta: ${formatCol(apuesta)}\nSaldo: ${formatCol(user.col || 0)}`, m);
            }

            let saldo = (user.col || 0) - apuesta;

            const ganador = Math.floor(Math.random() * 10) + 1;

            const baseChance = 0.1;
            const streakBonus = Math.min((user.streak || 0) * 0.01, 0.05);
            const gano = Math.random() < (baseChance + streakBonus) && num === ganador;

            const esJackpot = Math.random() < 0.05;

            let premio = esJackpot
                ? (Math.floor(Math.random() * 50000) + 100000)
                : (Math.floor(Math.random() * 25000) + 25000);

            let multiplicador = 1 + ((user.streak || 0) * 0.1);
            if (multiplicador > 2) multiplicador = 2;

            premio = Math.floor(premio * multiplicador * (apuesta / 500));

            if (gano) {
                saldo += premio;
                user.streak = (user.streak || 0) + 1;
            } else {
                user.streak = 0;
            }

            await global.User.updateOne(
                { id: m.sender },
                { $set: { col: saldo, streak: user.streak, lastLoteria: Date.now() } }
            );

            const { key } = await conn.sendMessage(m.chat, { 
                text: `🎟️ BOLETO\n\n👤 ${m.pushName}\n🎯 Número: ${num}\n💰 Apuesta: ${formatCol(apuesta)}\n⏳ Procesando...`
            }, { quoted: m });

            await delay(1000);

            let bolas = ['🔘','🔘','🔘','🔘','🔘'];
            const pool = ['🟢','🟡','🔴','🟣','🔵'];

            for (let i = 0; i < bolas.length; i++) {
                bolas[i] = pool[Math.floor(Math.random() * pool.length)];

                await conn.sendMessage(m.chat, {
                    text: `🎰 SORTEO\n\n[ ${bolas.join(' | ')} ]`,
                    edit: key
                });

                await delay(400);
            }

            await delay(800);

            let barra = '▰▰▰▰▰▰▰▰▰▰';

            let resTxt = `╭━━━〔 🎰 RESULTADO 〕━━━╮\n`;
            resTxt += `┃ 🎯 Número: ${num}\n`;
            resTxt += `┃ 🎲 Ganador: ${ganador}\n`;
            resTxt += `┃ 🔥 Racha: ${user.streak}\n`;
            resTxt += `┃ ${barra}\n`;

            if (gano) {
                resTxt += esJackpot ? `┃ 💎 JACKPOT\n` : `┃ 🎉 GANASTE\n`;
                resTxt += `┃ +${formatCol(premio)} Col\n`;
                await m.react("🔥");
            } else {
                resTxt += `┃ 💀 PERDISTE\n`;
                resTxt += `┃ -${formatCol(apuesta)} Col\n`;
                await m.react("❌");
            }

            resTxt += `┃ ${barra}\n`;
            resTxt += `┃ 💰 Saldo: ${formatCol(saldo)}\n`;
            resTxt += `╰━━━━━━━━━━━━━━╯`;

            await conn.sendMessage(m.chat, { text: resTxt, edit: key });

        } catch (e) {
            console.error(e);
            await m.react("⚠️");
        }
    }
};

export default loteriaCommand;
