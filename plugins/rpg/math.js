const clean = (str) => str.trim();

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
            await conn.sendMessage(m.chat, {
                text: `🎉 ¡@${m.sender.split('@')[0]} eres un genio matemático!\n\nLa respuesta correcta era: *${game.result}*`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });

            delete global.mathGames[gameId];
            return true;
        } else {
            game.attempts++;
            await m.react("❌");

            if (game.attempts >= 2) {
                await conn.sendMessage(m.chat, {
                    text: `❌ *JUEGO TERMINADO*\n\nSe agotaron los intentos, @${m.sender.split('@')[0]}.\nLa respuesta era: *${game.result}*`,
                    contextInfo: { mentionedJid: [m.sender] }
                }, { quoted: m });
                delete global.mathGames[gameId];
                return true;
            }

            const hint = Math.abs(userAns - game.result) < 5 ? "¡Estás muy cerca!" : (userAns < game.result ? "Es un número más alto." : "Es un número más bajo.");

            await conn.sendMessage(m.chat, {
                text: `❌ *Incorrecto* @${m.sender.split('@')[0]}\n💡 ${hint}\n_Intento ${game.attempts}/2_`,
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
                text: `⚠️ Ya tienes un reto activo, @${m.sender.split('@')[0]}. Resuelve: *${global.mathGames[gameId].equation}*`,
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
            text: `🧮 *RETO MATEMÁTICO PERSONAL*\n\nHola @${m.sender.split('@')[0]}, resuelve:\n\n💡 *${equation}*\n\n_Solo tú puedes responder. Tienes 2 intentos._`,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: m });
    }
};

export default mathGame;