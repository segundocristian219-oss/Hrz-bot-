let wordGames = {};

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
        if (!m.chat || !wordGames[m.chat] || m.isBaileys) return false;
        
        const game = wordGames[m.chat];
        const userGuess = cleanText(m.text || "");
        const correctAnswer = cleanText(game.original);

        if (userGuess === correctAnswer) {
            delete wordGames[m.chat];
            await this.reply(m.chat, `🎉 ¡Increíble @${m.sender.split('@')[0]}!\n\nLa palabra era: *${game.original.toUpperCase()}*\n\nHas demostrado ser más rápido que el sistema.`, m, { mentions: [m.sender] });
            await m.react("✅");
            return true;
        }
        return false;
    },

    run: async (m, { conn, usedPrefix, command }) => {
        const chatId = m.chat;

        if (wordGames[chatId]) {
            return conn.reply(chatId, `⚠️ Ya hay un juego activo en este chat.\n\nPalabra actual: *${wordGames[chatId].scrambled.toUpperCase()}*`, m);
        }

        const selectedWord = words[Math.floor(Math.random() * words.length)];
        const scrambled = shuffle(selectedWord);

        wordGames[chatId] = {
            original: selectedWord,
            scrambled: scrambled
        };

        return conn.reply(chatId, `🧩 *JUEGO DE PALABRAS*\n\nOrdena las letras para descubrir la palabra:\n\n👉 *${scrambled.toUpperCase()}*\n\n_¡Responde directamente a este mensaje para ganar!_`, m);
    }
};

export default scrambleGame;
