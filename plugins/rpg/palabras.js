const shuffle = (str) => {
    let arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
};

const clean = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const wordsNormal = [
    "computadora", "relampago", "mariposa", "escritorio", "universo", "aventura", "guitarra", 
    "planeta", "perro", "gato", "hierro", "sapo", "oro", "tecnologia", "murcielago", "diamante", 
    "elefante", "hamburguesa", "astronauta", "esmeralda", "fantasma", "galaxia", "biblioteca",
    "zapato", "bosque", "cometa", "dinosaurio", "espejo", "fuego", "globo", "helado", "isla",
    "jardin", "kilo", "limon", "manzana", "nube", "oceano", "puerta", "queso", "raton", "sol"
];

const wordsHard = [
    "electroencefalografista", "esternocleidomastoideo", "desoxirribonucleico", "paralelepipedo",
    "ovoviviparo", "constantinopla", "otorrinolaringologo", "electrocardiograma", "anticonstitucionalmente",
    "caleidoscopio", "arquitectonico", "biotecnologia", "cinematografia", "espectroscopia",
    "fotosintesis", "neurociencia", "paleontologia", "cuantificacion", "termorregulacion",
    "electrodomestico", "infraestructura", "interdisciplinario", "metamorfosis", "reivindicacion"
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

            let rewardCol = 0;
            let rewardExp = Math.floor(Math.random() * 100) + 50;

            if (game.bet > 0) {
                const multipliers = [2, 0.5, 0.4, 0.3, 0.2];
                rewardCol = game.bet + Math.floor(game.bet * multipliers[game.attempts]);
            } else {
                rewardCol = Math.floor(Math.random() * 50) + 20;
            }

            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: 0, exp: 0 });

            await global.User.updateOne(
                { id: m.sender }, 
                { $set: { col: (user.col ?? 0) + rewardCol, exp: (user.exp ?? 0) + rewardExp } }
            );

            const winTxt = `
\t\t\t\t♛  *¡VICTORIA MAGISTRAL!* ♛

◈  *GANADOR:* @${m.sender.split('@')[0]}
✦  *PALABRA:* ${game.original.toUpperCase()}
✧  *INTENTOS:* ${game.attempts + 1}
✦  *PREMIO:* +${rewardCol} Col | +${rewardExp} Exp
`;
            await conn.sendMessage(m.chat, { text: winTxt, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
            delete global.wordGames[gameId];
            return true;

        } else {
            game.attempts++;
            await m.react("❌");

            if (game.attempts >= game.maxAttempts) {
                clearTimeout(game.timer);
                let loseTxt = `💀 *JUEGO TERMINADO*\n\nSe agotaron tus intentos, @${m.sender.split('@')[0]}.\nLa palabra era: *${game.original.toUpperCase()}*`;
                
                if (game.bet > 0) {
                    const penalty = Math.floor(game.bet * 0.25);
                    let user = await global.User.findOne({ id: m.sender });
                    await global.User.updateOne(
                        { id: m.sender },
                        { $set: { col: Math.max(0, (user.col ?? 0) - penalty) } }
                    );
                    loseTxt += `\n✦ *PENALIZACIÓN EXTRA:* -${penalty} Col (25%)`;
                }

                await conn.sendMessage(m.chat, { text: loseTxt, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
                delete global.wordGames[gameId];
                return true;
            }

            const orig = game.original;
            let pista = `Inicia con *${orig[0]}*`;
            if (game.attempts >= 2) pista += ` y termina en *${orig[orig.length - 1]}*`;
            if (game.attempts >= 3) pista += `. Letra central: *${orig[Math.floor(orig.length / 2)]}*`;

            await conn.sendMessage(m.chat, {
                text: `×᷼× *Incorrecto* @${m.sender.split('@')[0]}\n(Intento ${game.attempts}/${game.maxAttempts})\n\n⍰ *Pista:* ${pista}`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });
            return true;
        }
    },

    run: async (m, { conn, args, usedPrefix, command }) => {
        global.wordGames = global.wordGames || {};
        const gameId = `${m.chat}-${m.sender}`;

        if (!args[0]) {
            const menu = `
\t\t\t\t♛  *SCRAMBLE DASHBOARD* ♛

◈ *¿CÓMO JUGAR?*
Ordena las letras de la palabra mezclada para ganar. Solo el que inicia el juego puede responder.

┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    🎮 MODOS DISPONIBLES    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ✦ *NORMAL:* ┃
┃   - Comando: \`${usedPrefix + command} modo normal\`
┃   - Intentos: 3 | Tiempo: 60s
┃   - Premio: Aleatorio (Col/Exp)
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ✧ *APOSTADOR (PRO):* ┃
┃   - Comando: \`${usedPrefix + command} <cantidad>\`
┃   - Intentos: 5 | Palabras Hard
┃   - Multiplicadores:
┃     • 1er Intento: x2.0
┃     • 2do Intento: x0.5
┃     • 3er Intento: x0.4
┃     • 4to Intento: x0.3
┃     • 5to Intento: x0.2
┃   ⚠️ *Si pierdes:* Pierdes todo 
┃     + 25% de penalización.
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
`;
            return conn.sendMessage(m.chat, { text: menu, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
        }

        if (global.wordGames[gameId]) {
            return m.reply(`⚠️ Termina el juego actual: *${global.wordGames[gameId].scrambled.toUpperCase()}*`);
        }

        let isNormal = args[0] === 'modo' && args[1] === 'normal';
        let bet = parseInt(args[0]);
        let isBetting = !isNaN(bet) && bet > 0;

        if (!isNormal && !isBetting) {
            return m.reply(`❌ Uso incorrecto. Prueba con \`${usedPrefix + command} modo normal\` o \`${usedPrefix + command} 100\``);
        }

        if (isBetting) {
            let user = await global.User.findOne({ id: m.sender });
            if (!user || (user.col ?? 0) < bet) {
                return m.reply(`❌ Fondos insuficientes para apostar ${bet} Col.`);
            }
            await global.User.updateOne({ id: m.sender }, { $set: { col: (user.col ?? 0) - bet } });
        }

        const original = isBetting ? wordsHard[Math.floor(Math.random() * wordsHard.length)] : wordsNormal[Math.floor(Math.random() * wordsNormal.length)];
        let scrambledWord = shuffle(original);
        while (scrambledWord === original) scrambledWord = shuffle(original);

        global.wordGames[gameId] = {
            original,
            scrambled: scrambledWord,
            attempts: 0,
            maxAttempts: isBetting ? 5 : 3,
            bet: isBetting ? bet : 0,
            timer: setTimeout(() => {
                if (global.wordGames[gameId]) {
                    conn.sendMessage(m.chat, { text: `⏳ *TIEMPO AGOTADO*\n\n@${m.sender.split('@')[0]}, la palabra era: *${original.toUpperCase()}*`, contextInfo: { mentionedJid: [m.sender] } });
                    delete global.wordGames[gameId];
                }
            }, 60000)
        };

        const startTxt = `
\t\t\t\t♛  *SCRAMBLE: ${isBetting ? 'HARDCORE' : 'NORMAL'}* ♛

@${m.sender.split('@')[0]}, ordena estas letras:
◈ *${scrambledWord.toUpperCase()}*

✦ *INTENTOS:* ${isBetting ? '5' : '3'}
✧ *TIEMPO:* 60 Segundos
${isBetting ? `✦ *APUESTA:* ${bet} Col` : '✧ *MODO:* Sin apuesta'}
`;

        return conn.sendMessage(m.chat, { text: startTxt, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
    }
};

export default scrambleGame;
            
