const clean = (str) => str.trim();

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
        const playerJid = m.sender;

        if (playerJid !== game.playerX && playerJid !== game.playerO) return false;

        const currentTurnJid = game.turn === 'X' ? game.playerX : game.playerO;
        if (playerJid !== currentTurnJid) {
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

        // Helper para obtener nombre de la DB
        const getName = async (jid) => {
            const user = await global.User.findOne({ id: jid }).lean();
            return user?.name || jid.split('@')[0];
        };

        const renderVisualBoard = (board) => {
            const b = board.map(cell => cell === ' ' ? '⬜' : (cell === 'X' ? '❌' : '⭕'));
            return `╔═══╦═══╦═══╗
║ ${b[0]} ║ ${b[1]} ║ ${b[2]} ║  (1-3)
╠═══╬═══╬═══╣
║ ${b[3]} ║ ${b[4]} ║ ${b[5]} ║  (4-6)
╠═══╬═══╬═══╣
║ ${b[6]} ║ ${b[7]} ║ ${b[8]} ║  (7-9)
╚═══╩═══╩═══╝`;
        };

        const checkWin = (b) => {
            const wins = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
            for (let w of wins) if (b[w[0]] !== ' ' && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) return b[w[0]];
            return b.includes(' ') ? null : 'tie';
        };

        const winner = checkWin(game.board);
        if (winner) {
            const winnerName = await getName(winner === 'X' ? game.playerX : game.playerO);
            let finalMsg = `🎮 *TRES EN RAYA - FIN*\n\n${renderVisualBoard(game.board)}\n\n`;

            if (winner === 'tie') {
                finalMsg += `⚖️ *¡Es un EMPATE!*`;
            } else {
                finalMsg += `🏆 *¡${winnerName} (${winner}) HA GANADO!*`;
            }
            
            await this.reply(m.chat, finalMsg, m);
            delete global.tttGames[m.chat];
            return true;
        }

        game.turn = game.turn === 'X' ? 'O' : 'X';
        const nextPlayerName = await getName(game.turn === 'X' ? game.playerX : game.playerO);

        await this.reply(m.chat, `🎮 *TRES EN RAYA*\n\n${renderVisualBoard(game.board)}\n\nTurno de *${game.turn}*: ${nextPlayerName}\n_Escribe un número del 1 al 9._`, m);
        return true;
    },
    run: async (m, { conn, usedPrefix, command }) => {
        global.tttGames = global.tttGames || {};
        if (global.tttGames[m.chat]) return conn.reply(m.chat, `⚠️ Ya hay una partida en curso.`, m);
        if (!m.isGroup) return conn.reply(m.chat, `❌ Solo en grupos.`, m);

        const opponent = m.mentionedJid[0];
        if (!opponent) return conn.reply(m.chat, `❌ Menciona a alguien: *${usedPrefix}${command} @user*`, m);
        if (opponent === m.sender) return conn.reply(m.chat, `❌ No puedes jugar solo.`, m);

        const getName = async (jid) => {
            const user = await global.User.findOne({ id: jid }).lean();
            return user?.name || jid.split('@')[0];
        };

        const nameX = await getName(m.sender);
        const nameO = await getName(opponent);

        global.tttGames[m.chat] = {
            board: Array(9).fill(' '),
            playerX: m.sender,
            playerO: opponent,
            turn: 'X'
        };

        const initialBoard = `╔═══╦═══╦═══╗
║ ⬜ ║ ⬜ ║ ⬜ ║  (1-3)
╠═══╬═══╬═══╣
║ ⬜ ║ ⬜ ║ ⬜ ║  (4-6)
╠═══╬═══╬═══╣
║ ⬜ ║ ⬜ ║ ⬜ ║  (7-9)
╚═══╩═══╩═══╝`;

        return conn.reply(m.chat, `🎮 *TRES EN RAYA - INICIO*\n\n❌: ${nameX}\n⭕: ${nameO}\n\n${initialBoard}\n\nEmpieza *❌*: ${nameX}\n_Escribe un número del 1 al 9._`, m);
    }
};

export default ticTacToeGame;
