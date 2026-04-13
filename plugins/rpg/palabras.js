import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = {
    BASE_COL: 1000
};

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

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
            if (game.bet > 0) {
                const multipliers = [2, 0.5, 0.4, 0.3, 0.2];
                rewardCol = game.bet + Math.floor(game.bet * multipliers[game.attempts]);
            } else {
                rewardCol = Math.floor(Math.random() * 200) + 100;
            }

            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

            let newCol = (user.col || ECO_CONFIG.BASE_COL) + rewardCol;
            await global.User.updateOne({ id: m.sender }, { $set: { col: newCol } });

            const winTxt = `『 VICTORIA MAGISTRAL 』\n\n◈ GANADOR: @${m.sender.split('@')[0]}\n✦ PALABRA: ${game.original.toUpperCase()}\n✧ INTENTOS: ${game.attempts + 1}\n✦ PREMIO: +${formatCol(rewardCol)} Col\n✧ BALANCE: ${formatCol(newCol)} Col\n──────────────────`;
            
            await conn.sendMessage(m.chat, { text: winTxt, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
            delete global.wordGames[gameId];
            return true;

        } else {
            game.attempts++;
            await m.react("❌");

            if (game.attempts >= game.maxAttempts) {
                clearTimeout(game.timer);
                let user = await global.User.findOne({ id: m.sender });
                let loseTxt = `『 GAME OVER 』\n\n💀 Se agotaron tus intentos, @${m.sender.split('@')[0]}\nLa palabra era: ${game.original.toUpperCase()}`;

                if (game.bet > 0) {
                    const penalty = Math.floor(game.bet * 0.25);
                    let currentBalance = user.col || ECO_CONFIG.BASE_COL;
                    let newCol = currentBalance - penalty;
                    if (newCol < ECO_CONFIG.BASE_COL) newCol = ECO_CONFIG.BASE_COL;
                    
                    await global.User.updateOne({ id: m.sender }, { $set: { col: newCol } });
                    loseTxt += `\n† PENALIZACIÓN: -${formatCol(penalty)} Col`;
                }

                await conn.sendMessage(m.chat, { text: loseTxt + `\n──────────────────`, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
                delete global.wordGames[gameId];
                return true;
            }

            const orig = game.original;
            let pista = `Inicia con ${orig[0]}`;
            if (game.attempts >= 2) pista += ` y termina en ${orig[orig.length - 1]}`;

            await conn.sendMessage(m.chat, {
                text: `『 INCORRECTO 』\n\n✦ @${m.sender.split('@')[0]}\n† Intento: ${game.attempts}/${game.maxAttempts}\n⍰ Pista: ${pista}`,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });
            return true;
        }
    },

    run: async (m, { conn, args, usedPrefix, command }) => {
        global.wordGames = global.wordGames || {};
        const gameId = `${m.chat}-${m.sender}`;

        if (!args[0]) {
            const menu = `『 SCRAMBLE DASHBOARD 』\n\nOrdena las letras mezcladas para ganar.\n\n✦ MODO NORMAL:\n${usedPrefix + command} modo normal\n\n✧ MODO APUESTA:\n${usedPrefix + command} <cantidad>\n\n† NOTA: Si pierdes en modo apuesta se aplica penalización del 25%.\n──────────────────`;
            return conn.sendMessage(m.chat, { text: menu, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
        }

        if (global.wordGames[gameId]) {
            return m.reply(`⚠️ Termina el juego actual: ${global.wordGames[gameId].scrambled.toUpperCase()}`);
        }

        let isNormal = args[0] === 'modo' && args[1] === 'normal';
        let bet = parseInt(args[0]);
        let isBetting = !isNaN(bet) && bet > 0;

        if (!isNormal && !isBetting) {
            return m.reply(`❌ Uso: ${usedPrefix + command} modo normal O ${usedPrefix + command} 100`);
        }

        if (isBetting) {
            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });
            if (user.col < bet) return m.reply(`❌ Fondos insuficientes: ${formatCol(user.col)} Col`);
            
            await global.User.updateOne({ id: m.sender }, { $set: { col: user.col - bet } });
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
                    conn.sendMessage(m.chat, { text: `『 TIEMPO AGOTADO 』\n\n@${m.sender.split('@')[0]}, la palabra era: ${original.toUpperCase()}\n──────────────────`, contextInfo: { mentionedJid: [m.sender] } });
                    delete global.wordGames[gameId];
                }
            }, 60000)
        };

        const startTxt = `『 ADIVINA LA PALABRA 』\n\n@${m.sender.split('@')[0]}, ordena las letras:\n◈ ${scrambledWord.toUpperCase()}\n\n✦ INTENTOS: ${isBetting ? '5' : '3'}\n✧ TIEMPO: 60 Segundos\n${isBetting ? `† APUESTA: ${formatCol(bet)} Col` : '† MODO: Normal'}\n──────────────────`;

        return conn.sendMessage(m.chat, { text: startTxt, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
    }
};

export default scrambleGame;
