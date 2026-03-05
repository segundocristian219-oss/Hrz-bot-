const words = ["computadora", "relampago", "mariposa", "escritorio", "universo", "aventura", "guitarra", "planeta", "perro", "gato", "hierro", "sapo", "oro", "tecnología"];

const shuffle = (str) => str.split('').sort(() => Math.random() - 0.5).join('');
const clean = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const scrambleGame = {
    name: 'adivina',
    alias: ['palabra'],
    category: 'game',
    async before(m) {
        const txt = (m.text || m.msg?.caption || m.msg?.text || m.message?.conversation || "").trim();

        if (!txt || m.isBaileys || m.fromMe || new RegExp('^[#!./]').test(txt)) return false;

        global.wordGames = global.wordGames || {};
        if (!global.wordGames[m.chat]) return false;

        const game = global.wordGames[m.chat];
        const userGuess = clean(txt);
        const correctAnswer = clean(game.original);

        if (userGuess === correctAnswer) {
            await m.react("✅");
            await this.reply(m.chat, `♛ ¡@${m.sender.split('@')[0]} ganaste!\n\nLa palabra era: *${game.original.toUpperCase()}*`, m, { mentions: [m.sender] });
            delete global.wordGames[m.chat];
            return true;
        } else {
            game.attempts++;
            await m.react("❌");

            if (game.attempts >= 3) {
                await this.reply(m.chat, `✘ *JUEGO TERMINADO*\n\nSe agotaron los 3 intentos. La palabra era: *${game.original.toUpperCase()}*`, m);
                delete global.wordGames[m.chat];
                return true;
            }

            const orig = game.original;
            const mid = Math.floor(orig.length / 2);
            const hints = [
                `Pista: Inicia con *${orig[0]}* y termina con *${orig[orig.length - 1]}*`,
                `Pista: La letra media es *${orig[mid]}* y termina con *${orig[orig.length - 1]}*`,
                `Pista: Inicia con *${orig[0]}* y la letra media es *${orig[mid]}*`
            ];
            const randomHint = hints[Math.floor(Math.random() * hints.length)];

            await this.reply(m.chat, `×᷼× *Incorrecto* (Intento ${game.attempts}/3)\n⍰ ${randomHint}`, m);
            return true;
        }
    },
    run: async (m, { conn }) => {
        global.wordGames = global.wordGames || {};
        if (global.wordGames[m.chat]) return conn.reply(m.chat, `♛ Ya hay un juego activo: *${global.wordGames[m.chat].scrambled.toUpperCase()}*`, m);

        const original = words[Math.floor(Math.random() * words.length)];
        global.wordGames[m.chat] = {
            original,
            scrambled: shuffle(original),
            attempts: 0
        };

        return conn.reply(m.chat, `⍰ *ADIVINA LA PALABRA*\n\nOrdena: *${global.wordGames[m.chat].scrambled.toUpperCase()}*\n\n_Tienes 3 intentos. Escribe la respuesta directamente._`, m);
    }
};

export default scrambleGame;