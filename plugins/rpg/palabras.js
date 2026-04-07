const shuffle = (str) => {
    let arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
};

const clean = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const words = [
    "computadora", "relampago", "mariposa", "escritorio", "universo", "aventura", "guitarra", 
    "planeta", "perro", "gato", "hierro", "sapo", "oro", "tecnologia", "murcielago", "diamante", 
    "elefante", "hamburguesa", "astronauta", "esmeralda", "fantasma", "galaxia", "biblioteca"
];

const scrambleGame = {
    name: 'adivina',
    alias: ['palabra', 'anagrama', 'scramble'],
    category: 'game',
    
    async before(m, { conn }) {
        const txt = (m.text || "").trim();
        
        if (!txt || m.isBaileys || m.fromMe || new RegExp('^[#!./]').test(txt)) return false;

        global.wordGames = global.wordGames || {};
        const gameId = `${m.chat}-${m.sender}`;
        if (!global.wordGames[gameId]) return false;

        const game = global.wordGames[gameId];
        const userGuess = clean(txt);
        const correctAnswer = clean(game.original);

        if (userGuess === correctAnswer) {
            clearTimeout(game.timer);
            await m.react("✅");

            let rewardCol = Math.floor(Math.random() * 50) + 20;
            let rewardExp = Math.floor(Math.random() * 100) + 50;

            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: 0, exp: 0 });

            await global.User.updateOne(
                { id: m.sender }, 
                { $set: { col: (user.col ?? 0) + rewardCol, exp: (user.exp ?? 0) + rewardExp } }
            );

            const winTxt = `
\t\t\t\t♛  *¡VICTORIA!* ♛

◈  *GANADOR:* @${m.sender.split('@')[0]}
✦  *PALABRA:* ${game.original.toUpperCase()}
✧  *RECOMPENSA:* +${rewardCol} Col | +${rewardExp} Exp
`;
            await conn.sendMessage(m.chat, { text: winTxt, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
            delete global.wordGames[gameId];
            return true;

        } else {
            game.attempts++;
            await m.react("❌");

            if (game.attempts >= 3) {
                clearTimeout(game.timer);
                await conn.sendMessage(m.chat, {
                    text: `💀 *JUEGO TERMINADO*\n\nSe agotaron tus 3 intentos, @${m.sender.split('@')[0]}.\nLa palabra correcta era: *${game.original.toUpperCase()}*`,
                    contextInfo: { mentionedJid: [m.sender] }
                }, { quoted: m });
                delete global.wordGames[gameId];
                return true;
            }

            const orig = game.original;
            let pista = "";
            if (game.attempts === 1) pista = `Inicia con *${orig[0]}*`;
            if (game.attempts === 2) pista = `Inicia con *${orig[0]}* y termina en *${orig[orig.length - 1]}*`;

            await conn.sendMessage(m.chat, {
                text: `×᷼× *Incorrecto* @${m.sender.split('@')[0]}\n(Intento ${game.attempts}/3)\n\n⍰ *Pista:* ${pista}`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });
            return true;
        }
    },

    run: async (m, { conn }) => {
        global.wordGames = global.wordGames || {};
        const gameId = `${m.chat}-${m.sender}`;

        if (global.wordGames[gameId]) {
            return conn.sendMessage(m.chat, { 
                text: `⚠️ Ya tienes un juego activo. Resuelve esta palabra: *${global.wordGames[gameId].scrambled.toUpperCase()}*`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });
        }

        const original = words[Math.floor(Math.random() * words.length)];
        let scrambledWord = shuffle(original);
        
        while (scrambledWord === original) {
            scrambledWord = shuffle(original);
        }

        global.wordGames[gameId] = {
            original,
            scrambled: scrambledWord,
            attempts: 0,
            timer: setTimeout(() => {
                if (global.wordGames[gameId]) {
                    conn.sendMessage(m.chat, {
                        text: `⏳ *TIEMPO AGOTADO*\n\n@${m.sender.split('@')[0]}, pasaron 60 segundos.\nLa palabra era: *${original.toUpperCase()}*`,
                        contextInfo: { mentionedJid: [m.sender] }
                    });
                    delete global.wordGames[gameId];
                }
            }, 60000)
        };

        const startTxt = `
\t\t\t\t♛  *MINIJUEGO: ADIVINA* ♛

Hola @${m.sender.split('@')[0]}, ordena las siguientes letras:
◈ *${global.wordGames[gameId].scrambled.toUpperCase()}*

✦ _Solo tú puedes responder._
✦ _Tienes 3 intentos y 60 segundos._
✧ _¡Gana Col y Exp si aciertas!_
`;

        return conn.sendMessage(m.chat, {
            text: startTxt,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: m });
    }
};

export default scrambleGame;
