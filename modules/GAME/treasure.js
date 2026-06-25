const renderBoard = (board) => {
    const header = '      A.   B.   C.   D.   E\n';
    const rows = board.map((row, i) => `${i + 1}   ${row.join('  ')}`).join('\n');
    return header + rows;
};

export const treasureCommand = {
    category: 'game',
    commands: {
        busqueda: {
            name: 'busqueda',
            alias: ['tesoro', 'excavar', 'mapa'],
            async before(m, { conn }) {
                const txt = (m.text || '').trim().toUpperCase();
                if (!/^[A-E][1-5]$/.test(txt) || m.isBaileys || m.fromMe) return false;

                global.treasureGames = global.treasureGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                if (!global.treasureGames[gameId]) return false;

                const game = global.treasureGames[gameId];

                if (game.explored.includes(txt)) { await m.react('❓'); return true; }

                game.attempts++;
                game.explored.push(txt);
                const x = txt.charCodeAt(0) - 65;
                const y = parseInt(txt[1]) - 1;

                if (txt === game.target) {
                    game.board[y][x] = '💎';
                    await m.react('💰');
                    await conn.sendMessage(m.chat, {
                        text: `🎊 ¡@${m.sender.split('@')[0]} ENCONTRASTE EL TESORO EN *${game.target}*!\n\n${renderBoard(game.board)}`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    delete global.treasureGames[gameId];
                    return true;
                } else {
                    game.board[y][x] = '🕳️';
                    await m.react('❌');

                    if (game.attempts >= 5) {
                        const tx = game.target.charCodeAt(0) - 65;
                        const ty = parseInt(game.target[1]) - 1;
                        game.board[ty][tx] = '💎';
                        await conn.sendMessage(m.chat, {
                            text: `💀 *GAME OVER*\n\nSe agotaron los intentos, @${m.sender.split('@')[0]}.\nEl tesoro estaba en *${game.target}*.\n\n${renderBoard(game.board)}`,
                            contextInfo: { mentionedJid: [m.sender] }
                        }, { quoted: m });
                        delete global.treasureGames[gameId];
                        return true;
                    }

                    await conn.sendMessage(m.chat, {
                        text: `🕳️ Nada por aquí, @${m.sender.split('@')[0]}... (Intento ${game.attempts}/5)\n\n${renderBoard(game.board)}\n\nSigue excavando, ejemplo: *C3*`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    return true;
                }
            },
            run: async (m, { conn }) => {
                global.treasureGames = global.treasureGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.treasureGames[gameId]) {
                    return conn.sendMessage(m.chat, {
                        text: `⚠️ Ya tienes una búsqueda en curso, @${m.sender.split('@')[0]}.`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                }

                const letras = ['A', 'B', 'C', 'D', 'E'];
                const target = letras[Math.floor(Math.random() * 5)] + (Math.floor(Math.random() * 5) + 1);
                const board = Array(5).fill(null).map(() => Array(5).fill('🟩'));

                global.treasureGames[gameId] = { target, board, explored: [], attempts: 0 };

                const initialMap = '      A.    B.    C.     D.     E\n' + board.map((row, i) => `${i + 1}   ${row.join('  ')}`).join('\n');

                return conn.sendMessage(m.chat, {
                    text: `🗺️ *BÚSQUEDA DEL TESORO PERSONAL*\n\nHola @${m.sender.split('@')[0]}, hay un botín oculto aquí:\n\n${initialMap}\n\nEscribe una coordenada (A1-E5):\n_Solo tú puedes excavar. Tienes 5 intentos._`,
                    contextInfo: { mentionedJid: [m.sender] }
                }, { quoted: m });
            }
        }
    }
};
