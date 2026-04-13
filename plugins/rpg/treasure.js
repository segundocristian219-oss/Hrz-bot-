import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = {
    MIN_TREASURE: 500,
    MAX_TREASURE: 5000,
    BASE_COL: 1000
};

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const clean = (str) => str.toUpperCase().trim();

const treasureGame = {
    name: 'busqueda',
    alias: ['tesoro', 'excavar', 'mapa'],
    category: 'game',
    async before(m, { conn }) {
        const txt = (m.text || "").trim().toUpperCase();
        if (!/^[A-E][1-5]$/.test(txt) || m.isBaileys || m.fromMe) return false;

        global.treasureGames = global.treasureGames || {};
        const gameId = `${m.chat}-${m.sender}`;
        if (!global.treasureGames[gameId]) return false;

        const game = global.treasureGames[gameId];
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
            
            const reward = Math.floor(Math.random() * (ECO_CONFIG.MAX_TREASURE - ECO_CONFIG.MIN_TREASURE + 1)) + ECO_CONFIG.MIN_TREASURE;
            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });
            
            let newCol = (user.col || ECO_CONFIG.BASE_COL) + reward;
            await global.User.updateOne({ id: m.sender }, { $set: { col: newCol } });

            await m.react("💰");
            await conn.sendMessage(m.chat, {
                text: `『 TESORO ENCONTRADO 』\n\n🎊 @${m.sender.split('@')[0]} excavaste en *${game.target}*\n\n${renderBoard(game.board)}\n\n✦ Recompensa: +${formatCol(reward)} Col\n✧ Balance: ${formatCol(newCol)} Col\n──────────────────`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });
            delete global.treasureGames[gameId];
            return true;
        } else {
            game.board[y][x] = '🕳️';
            await m.react("❌");

            if (game.attempts >= 5) {
                const tx = game.target.charCodeAt(0) - 65;
                const ty = parseInt(game.target[1]) - 1;
                game.board[ty][tx] = '💎';
                await conn.sendMessage(m.chat, {
                    text: `『 GAME OVER 』\n\n💀 Se agotaron los intentos, @${m.sender.split('@')[0]}\nEl tesoro estaba en *${game.target}*\n\n${renderBoard(game.board)}\n──────────────────`,
                    contextInfo: { mentionedJid: [m.sender] }
                }, { quoted: m });
                delete global.treasureGames[gameId];
                return true;
            }

            await conn.sendMessage(m.chat, {
                text: `『 EXCAVANDO 』\n\n🕳️ Nada por aquí... (Intento ${game.attempts}/5)\n\n${renderBoard(game.board)}\n\nSigue excavando, ejemplo: *C3*`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });
            return true;
        }
    },
    run: async (m, { conn }) => {
        global.treasureGames = global.treasureGames || {};
        const gameId = `${m.chat}-${m.sender}`;

        if (global.treasureGames[gameId]) return conn.sendMessage(m.chat, {
            text: `⚠️ Ya tienes una búsqueda en curso, @${m.sender.split('@')[0]}`,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: m });

        const letras = ['A', 'B', 'C', 'D', 'E'];
        const target = letras[Math.floor(Math.random() * 5)] + (Math.floor(Math.random() * 5) + 1);
        const board = Array(5).fill().map(() => Array(5).fill('🟩'));

        global.treasureGames[gameId] = {
            target,
            board,
            explored: [],
            attempts: 0
        };

        const initialMap = "      A.    B.    C.     D.     E\n" + board.map((row, i) => `${i + 1}   ${row.join('  ')}`).join('\n');

        return conn.sendMessage(m.chat, {
            text: `『 BÚSQUEDA DEL TESORO 』\n\nHola @${m.sender.split('@')[0]}, hay un botín oculto aquí:\n\n${initialMap}\n\nEscribe una coordenada (A1-E5)\n✦ Tienes 5 intentos\n──────────────────`,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: m });
    }
};

export default treasureGame;
