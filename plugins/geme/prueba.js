const words = ["computadora", "relampago", "mariposa", "escritorio", "universo", "aventura", "guitarra", "planeta"];

const shuffle = (str) => str.split('').sort(() => Math.random() - 0.5).join('');
const clean = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const scrambleGame = {
    name: 'adivina',
    alias: ['palabra'],
    category: 'game',
    async before(m) {
        const txt = (m.text || m.msg?.caption || m.msg?.text || m.message?.conversation || "").trim();
        if (!txt || m.isBaileys || !m.chat) return false;

        global.wordGames = global.wordGames || {};
        if (!global.wordGames[m.chat]) return false;

        const game = global.wordGames[m.chat];
        if (clean(txt) === clean(game.original)) {
            await this.reply(m.chat, `🎉 ¡@${m.sender.split('@')[0]} ganaste!\n\nLa palabra era: *${game.original.toUpperCase()}*`, m, { mentions: [m.sender] });
            await m.react("✅");
            delete global.wordGames[m.chat];
            return true;
        }
        return false;
    },
    run: async (m, { conn }) => {
        global.wordGames = global.wordGames || {};
        if (global.wordGames[m.chat]) return conn.reply(m.chat, `⚠️ Ya hay un juego activo: *${global.wordGames[m.chat].scrambled.toUpperCase()}*`, m);

        const original = words[Math.floor(Math.random() * words.length)];
        global.wordGames[m.chat] = {
            original,
            scrambled: shuffle(original)
        };

        return conn.reply(m.chat, `🧩 *ADIVINA LA PALABRA*\n\nOrdena: *${global.wordGames[m.chat].scrambled.toUpperCase()}*\n\n_Escribe la respuesta directamente sin prefijos._`, m);
    }
};

export default scrambleGame;