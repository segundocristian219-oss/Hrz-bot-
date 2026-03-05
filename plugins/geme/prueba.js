const words = [
    "computadora", "relámpago", "mariposa", "escritorio", 
    "universo", "tallarines", "aventura", "película", "guitarra",
    "elefante", "diamante", "estrella", "mochila", "planeta"
];

const shuffle = (str) => str.split('').sort(() => Math.random() - 0.5).join('');
const cleanText = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const scrambleGame = {
    name: 'adivina',
    alias: ['acertijo', 'palabra', 'ordenar'],
    category: 'game',

    async before(m) {
        if (!m.text || m.isBaileys) return false;
        if (!global.wordGames || !global.wordGames[m.chat]) return false;

        const game = global.wordGames[m.chat];
        const userGuess = cleanText(m.text);
        const correctAnswer = cleanText(game.original);

        if (userGuess === correctAnswer) {
            await this.reply(m.chat, `🎉 ¡Increíble @${m.sender.split('@')[0]}!\n\nLa palabra era: *${game.original.toUpperCase()}*`, m, { mentions: [m.sender] });
            await m.react("✅");
            delete global.wordGames[m.chat];
            return true;
        }
        return false;
    },

    run: async (m, { conn }) => {
        global.wordGames = global.wordGames || {};
        if (global.wordGames[m.chat]) return conn.reply(m.chat, `⚠️ Ya hay un juego activo. Palabra: *${global.wordGames[m.chat].scrambled.toUpperCase()}*`, m);

        const selectedWord = words[Math.floor(Math.random() * words.length)];
        const scrambled = shuffle(selectedWord);

        global.wordGames[m.chat] = {
            original: selectedWord,
            scrambled: scrambled
        };

        return conn.reply(m.chat, `🧩 *JUEGO DE PALABRAS*\n\nOrdena las letras:\n👉 *${scrambled.toUpperCase()}*\n\n_¡Responde directamente para ganar!_`, m);
    }
};

export default scrambleGame;
