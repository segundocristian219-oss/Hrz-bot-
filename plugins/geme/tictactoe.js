const ticTacToeGame = {
    name: 'tictactoe',
    alias: ['ttt', 'x0', 'tresenraya'],
    category: 'game',
    async before(m, { conn }) {
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
            let finalMsg = `🎮 *TRES EN RAYA - FIN*\n\n${renderVisualBoard(game.board)}\n\n`;

            if (winner === 'tie') {
                finalMsg += `⚖️ *¡Es un EMPATE!*`;
                await conn.sendMessage(m.chat, { text: finalMsg }, { quoted: m });
            } else {
                finalMsg += `🏆 *¡@${winnerJid.split('@')[0]} (${winner}) ES EL GANADOR!*`;
                await conn.sendMessage(m.chat, { 
                    text: finalMsg, 
                    mentions: [winnerJid] 
                }, { quoted: m });
            }
            delete global.tttGames[m.chat];
            return true;
        }

        game.turn = game.turn === 'X' ? 'O' : 'X';
        const nextJid = game.turn === 'X' ? game.playerX : game.playerO;
        const nextText = `🎮 *TRES EN RAYA*\n\n${renderVisualBoard(game.board)}\n\nSigue el turno de *${game.turn}*: @${nextJid.split('@')[0]}\n_Escribe un número del 1 al 9._`;

        await conn.sendMessage(m.chat, { 
            text: nextText, 
            mentions: [nextJid] 
        }, { quoted: m });
        
        return true;
    },
    run: async (m, { conn, usedPrefix, command }) => {
        global.tttGames = global.tttGames || {};
        if (global.tttGames[m.chat]) {
            return conn.sendMessage(m.chat, { text: `⚠️ Ya hay una partida activa.` }, { quoted: m });
        }
        if (!m.isGroup) {
            return conn.sendMessage(m.chat, { text: `❌ Solo en grupos.` }, { quoted: m });
        }

        const opponent = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
        if (!opponent) {
            return conn.sendMessage(m.chat, { text: `❌ Menciona a alguien: *${usedPrefix}${command} @user*` }, { quoted: m });
        }

        global.tttGames[m.chat] = {
            board: Array(9).fill(' '),
            playerX: m.sender,
            playerO: opponent,
            turn: 'X'
        };

        const boardStr = "╔═══╦═══╦═══╗\n║ ⬜ ║ ⬜ ║ ⬜ ║  (1-3)\n╠═══╬═══╬═══╣\n║ ⬜ ║ ⬜ ║ ⬜ ║  (4-6)\n╠═══╬═══╬═══╣\n║ ⬜ ║ ⬜ ║ ⬜ ║  (7-9)\n╚═══╩═══╩═══╝";

        const p1 = m.sender.split('@')[0];
        const p2 = opponent.split('@')[0];
const nextJid = game.turn === 'X' ? game.playerX : game.playerO;
        const textoInicio = `🎮 *TRES EN RAYA - INICIO*\n\n@${p1} (❌) vs @${p2} (⭕)\n\n${boardStr}\n\nEmpieza el turno de *❌*: @${p1}`;

        return conn.sendMessage(m.chat, {
            text: textoInicio,
            mentions: [nextJid]
        }, { quoted: m });
    }
};

export default ticTacToeGame;
