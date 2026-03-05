let wordGames = {};

const words = [
    "computadora", "botella", "relampago", "mariposa", "escritorio", 
    "universo", "tallarines", "aventura", "pelicula", "guitarra",
    "elefante", "diamante", "estrella", "mochila", "planeta"
];

const shuffle = (str) => str.split('').sort(() => Math.random() - 0.5).join('');

const scrambleGame = {
    name: 'adivina',
    alias: ['acertijo', 'palabra', 'ordenar'],
    category: 'game',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const chatId = m.chat;

        if (!wordGames[chatId]) {
            const selectedWord = words[Math.floor(Math.random() * words.length)];
            const scrambled = shuffle(selectedWord);

            wordGames[chatId] = {
                original: selectedWord,
                scrambled: scrambled,
                attempts: 0
            };

            return conn.reply(chatId, `🧩 *JUEGO DE PALABRAS*\n\nOrdena las letras para descubrir la palabra:\n\n👉 *${scrambled.toUpperCase()}*\n\n_¡El primero en responder correctamente gana!_`, m);
        }

        const userGuess = text?.trim().toLowerCase();
        const game = wordGames[chatId];

        if (userGuess === game.original) {
            delete wordGames[chatId];
            return conn.reply(chatId, `🎉 ¡Increíble @${m.sender.split('@')[0]}!\n\nLa palabra era: *${game.original.toUpperCase()}*\n\nHas ganado +1 punto de **Prestigio**.`, m, { mentions: [m.sender] });
        } else {
            return m.react("❌");
        }
    }
};

export default scrambleGame;
