const clean = (str) => str.toUpperCase().trim();

const treasureGame = {
    name: 'busqueda',
    alias: ['tesoro', 'excavar', 'mapa'],
    category: 'game',
    async before(m) {
        const txt = (m.text || "").trim().toUpperCase();
        if (!/^[A-E][1-5]$/.test(txt) || m.isBaileys || m.fromMe) return false;

        global.treasureGames = global.treasureGames || {};
        if (!global.treasureGames[m.chat]) return false;

        const game = global.treasureGames[m.chat];
        if (game.explored.includes(txt)) {
            await m.react("❓");
            return true;
        }

        game.attempts++;
        game.explored.push(txt);
        const [letra, numero] = txt.split('');
        const x = letra.charCodeAt(0) - 65;
        const y = parseInt(numero) - 1;

        const renderBoard = (board) => {
            const header = "      A.   B.   C.   D.   E\n";
            const rows = board.map((row, i) => `${i + 1}   ${row.join('  ')}`).join('\n');
            return header + rows;
        };

        if (txt === game.target) {
            game.board[y][x] = '💎';
            await m.react("💰");
            await this.reply(m.chat, `🎊 ¡@${m.sender.split('@')[0]} ENCONTRASTE EL TESORO EN *${game.target}*!\n\n${renderBoard(game.board)}`, m, { mentions: [m.sender] });
            delete global.treasureGames[m.chat];
            return true;
        } else {
            game.board[y][x] = '🕳️';
            await m.react("❌");

            if (game.attempts >= 5) {
                const tx = game.target.charCodeAt(0) - 65;
                const ty = parseInt(game.target[1]) - 1;
                game.board[ty][tx] = '💎';
                await this.reply(m.chat, `💀 *GAME OVER*\n\nSe agotaron los intentos. El tesoro estaba en *${game.target}*.\n\n${renderBoard(game.board)}`, m);
                delete global.treasureGames[m.chat];
                return true;
            }

            await this.reply(m.chat, `🕳️ Nada por aquí... (Intento ${game.attempts}/5)\n\n${renderBoard(game.board)}\n\nSigue excavando, ejemplo: *C3*`, m);
            return true;
        }
    },
    run: async (m, { conn }) => {
        global.treasureGames = global.treasureGames || {};
        if (global.treasureGames[m.chat]) return conn.reply(m.chat, `⚠️ Ya hay una búsqueda en curso.`, m);

        const letras = ['A', 'B', 'C', 'D', 'E'];
        const target = letras[Math.floor(Math.random() * 5)] + (Math.floor(Math.random() * 5) + 1);
        const board = Array(5).fill().map(() => Array(5).fill('🟩'));

        global.treasureGames[m.chat] = {
            target,
            board,
            explored: [],
            attempts: 0
        };

        const initialMap = "      A.    B.    C.     D.     E\n" + board.map((row, i) => `${i + 1}   ${row.join('  ')}`).join('\n');

        return conn.reply(m.chat, `🗺️ *BÚSQUEDA DEL TESORO*\n\nHay un botín oculto en este mapa de 5x5.\n\n${initialMap}\n\nEscribe una coordenada para excavar:\n(De la *A1* a la *E5*)\n\n_Tienes 5 intentos entre todos._`, m);
    }
};

export default treasureGame;
