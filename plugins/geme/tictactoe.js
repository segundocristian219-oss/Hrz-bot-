
const ticTacToeGame = {
    name: 'tictactoe',
    alias: ['ttt', 'x0', 'tresenraya'],
    category: 'game',
    async before(m, { conn }) {
        const txt = (m.text || '').trim()
        if (!/^[1-9]$/.test(txt) || m.isBaileys || m.fromMe) return false

        global.tttGames = global.tttGames || {}
        const game = global.tttGames[m.chat]
        if (!game) return false

        const normalizeJid = (jid = '') => String(jid).split(':')[0].trim()

        const playerJid = normalizeJid(m.sender)
        const playerX = normalizeJid(game.playerX)
        const playerO = normalizeJid(game.playerO)

        if (playerJid !== playerX && playerJid !== playerO) return false

        const currentTurnJid = game.turn === 'X' ? playerX : playerO
        if (playerJid !== currentTurnJid) {
            await m.react('⏳')
            return true
        }

        const position = parseInt(txt, 10) - 1
        if (game.board[position] !== ' ') {
            await m.react('❓')
            return true
        }

        game.board[position] = game.turn
        await m.react('✅')

        const renderVisualBoard = (board) => {
            const b = board.map(cell => cell === ' ' ? '⬜' : cell === 'X' ? '❌' : '⭕')
            return (
                '╔═══╦═══╦═══╗\n' +
                `║ ${b[0]} ║ ${b[1]} ║ ${b[2]} ║  (1-3)\n` +
                '╠═══╬═══╬═══╣\n' +
                `║ ${b[3]} ║ ${b[4]} ║ ${b[5]} ║  (4-6)\n` +
                '╠═══╬═══╬═══╣\n' +
                `║ ${b[6]} ║ ${b[7]} ║ ${b[8]} ║  (7-9)\n` +
                '╚═══╩═══╩═══╝'
            )
        }

        const checkWin = (b) => {
            const wins = [
                [0, 1, 2],
                [3, 4, 5],
                [6, 7, 8],
                [0, 3, 6],
                [1, 4, 7],
                [2, 5, 8],
                [0, 4, 8],
                [2, 4, 6]
            ]
            for (const [a, c, d] of wins) {
                if (b[a] !== ' ' && b[a] === b[c] && b[a] === b[d]) return b[a]
            }
            return b.includes(' ') ? null : 'tie'
        }

        const winner = checkWin(game.board)

        if (winner) {
            let finalMsg = `🎮 *TRES EN RAYA - FIN*\n\n${renderVisualBoard(game.board)}\n\n`

            if (winner === 'tie') {
                finalMsg += '⚖️ *¡Es un EMPATE!* Nadie gana esta vez.'
                await conn.sendMessage(m.chat, { text: finalMsg }, { quoted: m })
            } else {
                const winnerJid = winner === 'X' ? playerX : playerO
                finalMsg += `🏆 *¡@${winnerJid.split('@')[0]} (${winner}) ES EL GANADOR!*`
                await conn.sendMessage(
                    m.chat,
                    {
                        text: finalMsg,
                        mentions: [winnerJid]
                    },
                    { quoted: m }
                )
            }

            delete global.tttGames[m.chat]
            return true
        }

        game.turn = game.turn === 'X' ? 'O' : 'X'
        const nextPlayerJid = game.turn === 'X' ? playerX : playerO

        const turnMsg =
            `🎮 *TRES EN RAYA*\n\n` +
            `${renderVisualBoard(game.board)}\n\n` +
            `Sigue el turno de *${game.turn}*: @${nextPlayerJid.split('@')[0]}\n` +
            `_Escribe un número del 1 al 9._`

        await conn.sendMessage(
            m.chat,
            {
                text: turnMsg,
                mentions: [nextPlayerJid]
            },
            { quoted: m }
        )

        return true
    },
    run: async (m, { conn, usedPrefix, command }) => {
        global.tttGames = global.tttGames || {}

        const normalizeJid = (jid = '') => String(jid).split(':')[0].trim()

        if (global.tttGames[m.chat]) {
            return conn.sendMessage(
                m.chat,
                { text: '⚠️ Ya hay una partida en curso.' },
                { quoted: m }
            )
        }

        if (!m.isGroup) {
            return conn.sendMessage(
                m.chat,
                { text: '❌ Este juego solo se puede jugar en grupos.' },
                { quoted: m }
            )
        }

        const sender = normalizeJid(m.sender)
        const botJid = normalizeJid(conn.user?.id || '')
        const opponentRaw = m.mentionedJid && m.mentionedJid[0]

        if (!opponentRaw) {
            return conn.sendMessage(
                m.chat,
                { text: `❌ Debes mencionar a alguien para jugar.\nEjemplo: *${usedPrefix}${command} @user*` },
                { quoted: m }
            )
        }

        const opponent = normalizeJid(opponentRaw)

        if (opponent === sender) {
            return conn.sendMessage(
                m.chat,
                { text: '❌ No puedes jugar contra ti mismo.' },
                { quoted: m }
            )
        }

        if (opponent === botJid) {
            return conn.sendMessage(
                m.chat,
                { text: '❌ No puedes jugar contra mí, soy un bot muy ocupado.' },
                { quoted: m }
            )
        }

        const board = Array(9).fill(' ')

        global.tttGames[m.chat] = {
            board,
            playerX: sender,
            playerO: opponent,
            turn: 'X'
        }

        const renderVisualBoard = (board) => {
            const b = board.map(cell => cell === ' ' ? '⬜' : cell === 'X' ? '❌' : '⭕')
            return (
                '╔═══╦═══╦═══╗\n' +
                `║ ${b[0]} ║ ${b[1]} ║ ${b[2]} ║  (1-3)\n` +
                '╠═══╬═══╬═══╣\n' +
                `║ ${b[3]} ║ ${b[4]} ║ ${b[5]} ║  (4-6)\n` +
                '╠═══╬═══╬═══╣\n' +
                `║ ${b[6]} ║ ${b[7]} ║ ${b[8]} ║  (7-9)\n` +
                '╚═══╩═══╩═══╝'
            )
        }

        const startMsg =
            `🎮 *TRES EN RAYA - INICIO*\n\n` +
            `@${sender.split('@')[0]} (❌) vs @${opponent.split('@')[0]} (⭕)\n\n` +
            `${renderVisualBoard(board)}\n\n` +
            `Empieza el turno de *❌*: @${sender.split('@')[0]}\n` +
            `_Escribe un número del 1 al 9 para jugar._`

        return conn.sendMessage(
            m.chat,
            {
                text: startMsg,
                mentions: [sender, opponent]
            },
            { quoted: m }
        )
    }
}

export default ticTacToeGame