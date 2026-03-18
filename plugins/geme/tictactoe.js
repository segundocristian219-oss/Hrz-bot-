const ticTacToeGame = {
    name: 'tictactoe',
    alias: ['ttt', 'x0', 'tresenraya'],
    category: 'game',
    async before(m) {
        const txt = (m.text || "").trim();
        if (!/^[1-9]$/.test(txt) || m.isBaileys || m.fromMe) return false;

        global.tttGames = global.tttGames || {};
        if (!global.tttGames[m.chat]) return false;

        const game = global.tttGames[m.chat];
        if (m.sender !== game.playerX && m.sender !== game.playerO) return false;

        const currentTurnJid = game.turn === 'X' ? game.playerX : game.playerO;
        if (m.sender !== currentTurnJid) {
            await m.react("⏳");
            return true;
        }

        const position = parseInt(txt) - 1;
        if (game.board[position] !== ' ') {
            await m.react("❓");
            return true;
        }

        game.board[position] = game.turn;
        await m.react("✅");

        // Lógica de obtención de nombres de la DB (MongoDB)
        const getName = async (jid) => {
            const user = await global.User.findOne({ id: jid }).lean();
            return user?.name || jid.split('@')[0];
        };

        const renderVisualBoard = (board) => {
            const b = board.map(cell => cell === ' ' ? '⬜' : (cell === 'X' ? '❌' : '⭕'));
            return `╔═══╦═══╦═══╗\n║ ${b[0]} ║ ${b[1]} ║ ${b[2]} ║  (1-3)\n╠═══╬═══╬═══╣\n║ ${b[3]} ║ ${b[4]} ║ ${b[5]} ║  (4-6)\n╠═══╬═══╬═══╣\n║ ${b[6]} ║ ${b[7]} ║ ${b[8]} ║  (7-9)\n╚═══╩═══╩═══╝`;
        };

        const checkWin = (b) => {
            const wins = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
            for (let w of wins) if (b[w[0]] !== ' ' && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) return b[w[0]];
            return b.includes(' ') ? null : 'tie';
        };

        const winner = checkWin(game.board);
        if (winner) {
            const winnerJid = winner === 'X' ? game.playerX : game.playerO;
            const nameWin = await getName(winnerJid);
            const tagWin = '@' + nameWin;
            
            let finalMsg = `🎮 *TRES EN RAYA - FIN*\n\n${renderVisualBoard(game.board)}\n\n`;

            if (winner === 'tie') {
                finalMsg += `⚖️ *¡Es un EMPATE!*`;
                await this.reply(m.chat, finalMsg, m);
            } else {
                finalMsg += `🏆 *¡${tagWin} (${winner}) ES EL GANADOR!*`;
                await this.reply(m.chat, finalMsg, m, { mentions: [winnerJid] });
            }
            delete global.tttGames[m.chat];
            return true;
        }

        game.turn = game.turn === 'X' ? 'O' : 'X';
        const nextJid = game.turn === 'X' ? game.playerX : game.playerO;
        const nextName = await getName(nextJid);
        const nextTag = '@' + nextName;

        await this.reply(m.chat, `🎮 *TRES EN RAYA*\n\n${renderVisualBoard(game.board)}\n\nSigue el turno de *${game.turn}*: ${nextTag}\n_Escribe un número del 1 al 9._`, m, { mentions: [nextJid] });
        return true;
    },
    run: async (m, { conn, usedPrefix, command }) => {
        global.tttGames = global.tttGames || {};
        if (global.tttGames[m.chat]) return conn.reply(m.chat, `⚠️ Ya hay una partida activa.`, m);
        if (!m.isGroup) return conn.reply(m.chat, `❌ Solo en grupos.`, m);

        const opponent = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
        if (!opponent) return conn.reply(m.chat, `❌ Menciona a alguien: *${usedPrefix}${command} @user*`, m);

        const getName = async (jid) => {
            const user = await global.User.findOne({ id: jid }).lean();
            return user?.name || jid.split('@')[0];
        };

        const name1 = await getName(m.sender);
        const name2 = await getName(opponent);
        const tag1 = '@' + name1;
        const tag2 = '@' + name2;

        global.tttGames[m.chat] = {
            board: Array(9).fill(' '),
            playerX: m.sender,
            playerO: opponent,
            turn: 'X'
        };

        const boardStr = "╔═══╦═══╦═══╗\n║ ⬜ ║ ⬜ ║ ⬜ ║  (1-3)\n╠═══╬═══╬═══╣\n║ ⬜ ║ ⬜ ║ ⬜ ║  (4-6)\n╠═══╬═══╬═══╣\n║ ⬜ ║ ⬜ ║ ⬜ ║  (7-9)\n╚═══╩═══╩═══╝";

        const textoInicio = `🎮 *TRES EN RAYA - INICIO*\n\n${tag1} (❌) vs ${tag2} (⭕)\n\n${boardStr}\n\nEmpieza el turno de *❌*: ${tag1}`;

        return conn.reply(m.chat, textoInicio, m, { mentions: [m.sender, opponent] });
    }
};

export default ticTacToeGame;
