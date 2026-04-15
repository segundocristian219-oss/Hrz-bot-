import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = { BASE_COL: 1000 };

const formatCol = (num) => Number(num).toLocaleString('de-DE');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shuffle = (str) => {
    let arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
};

const clean = (str) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const wordsNormal = [
    "computadora","relampago","mariposa","escritorio","universo","aventura",
    "guitarra","planeta","perro","gato","hierro","sapo","oro","tecnologia",
    "murcielago","diamante","elefante","hamburguesa","astronauta","esmeralda",
    "fantasma","galaxia","biblioteca","zapato","bosque","cometa","dinosaurio",
    "espejo","fuego","globo","helado","isla","jardin","kilo","limon",
    "manzana","nube","oceano","puerta","queso","raton","sol"
];

const wordsHard = [
    "electroencefalografista","esternocleidomastoideo","desoxirribonucleico",
    "paralelepipedo","ovoviviparo","constantinopla","otorrinolaringologo",
    "electrocardiograma","anticonstitucionalmente","caleidoscopio",
    "arquitectonico","biotecnologia","cinematografia","espectroscopia",
    "fotosintesis","neurociencia","paleontologia","cuantificacion",
    "termorregulacion","electrodomestico","infraestructura",
    "interdisciplinario","metamorfosis","reivindicacion"
];

const scrambleGame = {
    name: 'adivina',
    alias: ['palabra', 'anagrama', 'scramble'],
    category: 'game',

    async before(m, { conn }) {
        const txt = (m.text || "").trim();
        if (!txt || m.isBaileys || m.fromMe || /^[#!./]/.test(txt)) return false;

        global.wordGames = global.wordGames || {};
        const gameId = `${m.chat}-${m.sender}`;
        if (!global.wordGames[gameId]) return false;

        const game = global.wordGames[gameId];
        const guess = clean(txt);
        const answer = clean(game.original);

        if (guess === answer) {
            clearTimeout(game.timer);
            await m.react("🏆");

            let reward = 0;

            if (game.bet > 0) {
                const mult = [2, 0.5, 0.4, 0.3, 0.2];
                reward = game.bet + Math.floor(game.bet * mult[game.attempts]);
            } else {
                reward = Math.floor(Math.random() * 200) + 100;
            }

            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

            const newCol = (user.col || ECO_CONFIG.BASE_COL) + reward;

            await global.User.updateOne(
                { id: m.sender },
                { $set: { col: newCol } }
            );

            const txtWin = `『 RESULTADO 』\n\n` +
                `Jugador: @${m.sender.split('@')[0]}\n` +
                `Palabra: ${game.original.toUpperCase()}\n` +
                `Intentos: ${game.attempts + 1}\n` +
                `──────────────\n\n` +
                `GANASTE\n+${formatCol(reward)} Col\n\n` +
                `Saldo: ${formatCol(newCol)} Col`;

            await conn.sendMessage(m.chat, {
                text: txtWin,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });

            delete global.wordGames[gameId];
            return true;
        }

        game.attempts++;
        await m.react("❌");

        if (game.attempts >= game.maxAttempts) {
            clearTimeout(game.timer);

            let user = await global.User.findOne({ id: m.sender });

            let txtLose = `『 GAME OVER 』\n\n` +
                `@${m.sender.split('@')[0]}\n` +
                `Palabra: ${game.original.toUpperCase()}\n`;

            if (game.bet > 0) {
                const penalty = Math.floor(game.bet * 0.25);
                let newCol = (user.col || ECO_CONFIG.BASE_COL) - penalty;
                if (newCol < ECO_CONFIG.BASE_COL) newCol = ECO_CONFIG.BASE_COL;

                await global.User.updateOne(
                    { id: m.sender },
                    { $set: { col: newCol } }
                );

                txtLose += `\n-${formatCol(penalty)} Col\nSaldo: ${formatCol(newCol)} Col`;
            }

            await conn.sendMessage(m.chat, {
                text: txtLose,
                contextInfo: { mentionedJid: [m.sender] }
            }, { quoted: m });

            delete global.wordGames[gameId];
            return true;
        }

        const word = game.original;
        let hint = `Empieza con ${word[0].toUpperCase()}`;
        if (game.attempts >= 2)
            hint += ` y termina en ${word[word.length - 1].toUpperCase()}`;

        await conn.sendMessage(m.chat, {
            text: `『 INCORRECTO 』\n\n@${m.sender.split('@')[0]}\n` +
                  `Intento: ${game.attempts}/${game.maxAttempts}\n` +
                  `Pista: ${hint}`,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: m });

        return true;
    },

    run: async (m, { conn, args, usedPrefix, command, isOwner }) => {
        try {

            /*
            const ownerList = global.owner || global.config?.owner || [];
            const checkOwner = isOwner || ownerList.some(owner => owner[0].replace(/\D/g, '') === m.sender.split('@')[0]);

            if (!checkOwner) {
                return m.reply("Este comando aún no está disponible.");
            }
            */

            global.wordGames = global.wordGames || {};
            const gameId = `${m.chat}-${m.sender}`;

            if (!args[0]) {
                let menu = `『 SCRAMBLE 』\n\n`;
                menu += `Modo normal:\n${usedPrefix + command} modo normal\n\n`;
                menu += `Modo apuesta:\n${usedPrefix + command} <cantidad>\n\n`;
                menu += `Pierdes = -25% apuesta`;
                return m.reply(menu);
            }

            if (global.wordGames[gameId]) {
                return m.reply(`Tienes una partida activa:\n${global.wordGames[gameId].scrambled.toUpperCase()}`);
            }

            const isNormal = args[0] === 'modo' && args[1] === 'normal';
            const bet = parseInt(args[0]);
            const isBet = !isNaN(bet) && bet > 0;

            if (!isNormal && !isBet) {
                return m.reply(`Uso:\n${usedPrefix + command} modo normal\n${usedPrefix + command} 100`);
            }

            if (isBet) {
                let user = await global.User.findOne({ id: m.sender });
                if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

                if (user.col < bet)
                    return m.reply(`Saldo insuficiente\n${formatCol(user.col)} Col`);

                await global.User.updateOne(
                    { id: m.sender },
                    { $set: { col: user.col - bet } }
                );
            }

            const original = isBet
                ? wordsHard[Math.floor(Math.random() * wordsHard.length)]
                : wordsNormal[Math.floor(Math.random() * wordsNormal.length)];

            let scrambled = shuffle(original);
            while (scrambled === original) scrambled = shuffle(original);

            await m.react("🧩");

            const { key } = await conn.sendMessage(m.chat, {
                text: `Preparando juego...`
            }, { quoted: m });

            await delay(800);

            global.wordGames[gameId] = {
                original,
                scrambled,
                attempts: 0,
                maxAttempts: isBet ? 5 : 3,
                bet: isBet ? bet : 0,
                timer: setTimeout(() => {
                    if (global.wordGames[gameId]) {
                        conn.sendMessage(m.chat, {
                            text: `Tiempo agotado\nPalabra: ${original.toUpperCase()}`
                        });
                        delete global.wordGames[gameId];
                    }
                }, 60000)
            };

            const start = `『 ADIVINA 』\n\n` +
                `@${m.sender.split('@')[0]}\n\n` +
                `[ ${scrambled.toUpperCase().split('').join(' ')} ]\n\n` +
                `Intentos: ${isBet ? 5 : 3}\n` +
                `Tiempo: 60s\n` +
                (isBet ? `Apuesta: ${formatCol(bet)} Col` : `Modo: Normal`);

            await conn.sendMessage(m.chat, {
                text: start,
                edit: key,
                contextInfo: { mentionedJid: [m.sender] }
            });

        } catch (e) {
            console.error(e);
            await m.react("⚠️");
        }
    }
};

export default scrambleGame;
