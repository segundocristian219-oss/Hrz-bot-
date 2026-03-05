const words = ["computadora", "relampago", "mariposa", "escritorio", "universo", "aventura", "guitarra", "planeta"];

const shuffle = (str) => str.split('').sort(() => Math.random() - 0.5).join('');
const clean = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const scrambleGame = {
    name: 'adivina',
    alias: ['palabra'],
    category: 'game',

    // Esta es la parte que "detecta" sin prefijo, igual que tus stickers
    async before(m) {
        if (!m.text || m.isBaileys || !m.chat) return false;
        
        // Usamos el objeto global para que persista entre ejecuciones
        global.wordGames = global.wordGames || {};
        if (!global.wordGames[m.chat]) return false;

        const game = global.wordGames[m.chat];
        if (clean(m.text) === clean(game.original)) {
            await this.reply(m.chat, `🎉 ¡@${m.sender.split('@')[0]} ganaste!\n\nLa palabra era: *${game.original.toUpperCase()}*`, m, { mentions: [m.sender] });
            await m.react("✅");
            delete global.wordGames[m.chat];
            return true; // Detiene el flujo para que no busque comandos
        }
        return false;
    },

    run: async (m, { conn }) => {
        global.wordGames = global.wordGames || {};
        if (global.wordGames[m.chat]) return conn.reply(m.chat, `⚠️ Ya hay un juego: *${global.wordGames[m.chat].scrambled.toUpperCase()}*`, m);

        const original = words[Math.floor(Math.random() * words.length)];
        global.wordGames[m.chat] = {
            original,
            scrambled: shuffle(original)
        };

        return conn.reply(m.chat, `🧩 *ADIVINA LA PALABRA*\n\nOrdena: *${global.wordGames[m.chat].scrambled.toUpperCase()}*\n\n_Escribe la respuesta directamente._`, m);
    }
};

export default scrambleGame;
