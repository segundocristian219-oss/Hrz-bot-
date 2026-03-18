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

        const renderVisualBoard = (board) => {
            const b = board.map(cell => cell === ' ' ? '⬜' : (cell === 'X' ? '❌' : '⭕'));
            const header = "╔═══╦═══╦═══╗\n";
            const row1 = `║ ${b[0]} ║ ${b[1]} ║ ${b[2]} ║  (1-3)\n`;
            const divider = "╠═══╬═══╬═══╣\n";
            const row2 = `║ ${b[3]} ║ ${b[4]} ║ ${b[5]} ║  (4-6)\n`;
            const row3 = `║ ${b[6]} ║ ${b[7]} ║ ${b[8]} ║  (7-9)\n`;
            const footer = "╚═══╩═══╩═══╝";
            return header + row1 + divider + row2 + divider + row3 + footer;
        };

        const checkWin = (b) => {
            const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
            for (let w of wins) if (b[w[0]] !== ' ' && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) return b[w[0]];
            return b.includes(' ') ? null : 'tie';
        };

        const winner = checkWin(game.board);
        if (winner) {
            let finalMsg = `🎮 *TRES EN RAYA - FIN*\n\n${renderVisualBoard(game.board)}\n\n`;
            let winnerJid = null;
            if (winner === 'tie') {
                finalMsg += `⚖️ *¡Es un EMPATE!* Nadie gana esta vez.`;
            } else {
                winnerJid = winner === 'X' ? game.playerX : game.playerO;
                finalMsg += `🏆 *¡@${winnerJid.split('@')[0]} (${winner}) ES EL GANADOR!*`;
            }
            await this.reply(m.chat, finalMsg, m, { mentions: winnerJid ? [winnerJid] : [] });
            delete global.tttGames[m.chat];
            return true;
        }

        game.turn = game.turn === 'X' ? 'O' : 'X';
        const nextPlayerJid = game.turn === 'X' ? game.playerX : game.playerO;

        await this.reply(m.chat, `🎮 *TRES EN RAYA*\n\n${renderVisualBoard(game.board)}\n\nSigue el turno de *${game.turn}*: @${nextPlayerJid.split('@')[0]}\n_Escribe un número del 1 al 9._`, m, { mentions: [nextPlayerJid] });
        return true;
    },
    run: async (m, { conn, text, usedPrefix, command }) => {
        global.tttGames = global.tttGames || {};
        if (global.tttGames[m.chat]) return conn.reply(m.chat, `⚠️ Ya hay una partida en curso.`, m);

        if (!m.isGroup) return conn.reply(m.chat, `❌ Este juego solo se puede jugar en grupos.`, m);

        const opponent = m.mentionedJid[0];
        if (!opponent) return conn.reply(m.chat, `❌ Debes mencionar a alguien para jugar.\nEjemplo: *${usedPrefix}${command} @user*`, m);
        if (opponent === m.sender) return conn.reply(m.chat, `❌ No puedes jugar contra ti mismo.`, m);
        if (opponent === (conn.user.jid || conn.user.id)) return conn.reply(m.chat, `❌ No puedes jugar contra mí.`, m);

        const board = Array(9).fill(' ');

        global.tttGames[m.chat] = {
            board,
            playerX: m.sender,
            playerO: opponent,
            turn: 'X',
            attempts: 0
        };

        const renderVisualBoard = (board) => {
            const b = board.map(cell => cell === ' ' ? '⬜' : (cell === 'X' ? '❌' : '⭕'));
            const header = "╔═══╦═══╦═══╗\n";
            const row1 = `║ ${b[0]} ║ ${b[1]} ║ ${b[2]} ║  (1-3)\n`;
            const divider = "╠═══╬═══╬═══╣\n";
            const row2 = `║ ${b[3]} ║ ${b[4]} ║ ${b[5]} ║  (4-6)\n`;
            const row3 = `║ ${b[6]} ║ ${b[7]} ║ ${b[8]} ║  (7-9)\n`;
            const footer = "╚═══╩═══╩═══╝";
            return header + row1 + divider + row2 + divider + row3 + footer;
        };

        return conn.reply(m.chat, `🎮 *TRES EN RAYA - INICIO*\n\n@${m.sender.split('@')[0]} (❌) vs @${opponent.split('@')[0]} (⭕)\n\n${renderVisualBoard(board)}\n\nEmpieza el turno de *❌*: @${m.sender.split('@')[0]}\n_Escribe un número del 1 al 9 para jugar._`, m, { mentions: [m.sender, opponent] });
    }
};

export default ticTacToeGame;
