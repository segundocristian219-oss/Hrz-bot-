import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = {
    BASE_COL: 1000
};

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const mathGame = {
    name: 'math',
    alias: ['mate', 'calculo'],
    category: 'game',
    async before(m, { conn }) {
        const txt = (m.text || "").trim();
        if (!txt || m.isBaileys || m.fromMe || new RegExp('^[#!./]').test(txt)) return false;

        global.mathGames = global.mathGames || {};
        const gameId = `${m.chat}-${m.sender}`;
        if (!global.mathGames[gameId]) return false;

        const game = global.mathGames[gameId];
        const userAns = parseInt(txt);

        if (userAns === game.result) {
            await m.react("✅");
            
            const reward = Math.floor(Math.random() * 400) + 100;
            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

            let newCol = (user.col || ECO_CONFIG.BASE_COL) + reward;
            await global.User.updateOne({ id: m.sender }, { $set: { col: newCol } });

            await conn.sendMessage(m.chat, {
                text: `『 DESAFÍO COMPLETADO 』\n\n✦ @${m.sender.split('@')[0]} eres un genio matemático\n\n◈ RESPUESTA: ${game.result}\n✦ PREMIO: +${formatCol(reward)} Col\n✧ BALANCE: ${formatCol(newCol)} Col\n──────────────────`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });

            delete global.mathGames[gameId];
            return true;
        } else {
            game.attempts++;
            await m.react("❌");

            if (game.attempts >= 2) {
                await conn.sendMessage(m.chat, {
                    text: `『 GAME OVER 』\n\n💀 Se agotaron los intentos, @${m.sender.split('@')[0]}\nLa respuesta era: ${game.result}\n──────────────────`,
                    contextInfo: { mentionedJid: [m.sender] }
                }, { quoted: m });
                delete global.mathGames[gameId];
                return true;
            }

            const hint = Math.abs(userAns - game.result) < 5 ? "Estás muy cerca" : (userAns < game.result ? "Es un número más alto" : "Es un número más bajo");

            await conn.sendMessage(m.chat, {
                text: `『 INCORRECTO 』\n\n✦ @${m.sender.split('@')[0]}\n† Pista: ${hint}\n† Intento: ${game.attempts}/2`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });
            return true;
        }
    },
    run: async (m, { conn }) => {
        global.mathGames = global.mathGames || {};
        const gameId = `${m.chat}-${m.sender}`;

        if (global.mathGames[gameId]) {
            return conn.sendMessage(m.chat, { 
                text: `⚠️ Termina el reto actual, @${m.sender.split('@')[0]}:\n\n◈ ${global.mathGames[gameId].equation}`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });
        }

        const operators = ['+', '-', '*'];
        const op = operators[Math.floor(Math.random() * operators.length)];
        let num1, num2;

        if (op === '*') {
            num1 = Math.floor(Math.random() * 12) + 1;
            num2 = Math.floor(Math.random() * 12) + 1;
        } else {
            num1 = Math.floor(Math.random() * 100) + 1;
            num2 = Math.floor(Math.random() * 100) + 1;
        }

        const equation = `${num1} ${op} ${num2}`;
        const result = eval(equation);

        global.mathGames[gameId] = {
            equation,
            result,
            attempts: 0
        };

        return conn.sendMessage(m.chat, {
            text: `『 RETO MATEMÁTICO 』\n\nHola @${m.sender.split('@')[0]}, resuelve:\n\n◈ ${equation}\n\n✦ Tienes 2 intentos\n──────────────────`,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: m });
    }
};

export default mathGame;
