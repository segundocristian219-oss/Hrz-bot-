let gameData = {};

const hackerGame = {
    name: 'hacker',
    alias: ['decifrar', 'codigosecreto', 'hack'],
    category: 'game',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const chatId = m.chat;

        // Si no hay juego activo en el grupo
        if (!gameData[chatId]) {
            // Generar código de 3 dígitos únicos
            let digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            digits.sort(() => Math.random() - 0.5);
            const secretCode = digits.slice(0, 3).join('');

            gameData[chatId] = {
                code: secretCode,
                attempts: 0,
                startTime: Date.now()
            };

            return conn.reply(chatId, `🚀 *SISTEMA COMPROMETIDO*\n\nSe ha bloqueado un servidor. Descifra el código de *3 dígitos* para entrar.\n\n*Reglas:* Envía el código directamente.\n- *Fijos:* Números en el lugar correcto.\n- *Toques:* Números que están en el código pero en lugar equivocado.\n\n_¡Mucha suerte, hacker!_`, m);
        }

        // Si el juego ya está activo y el usuario intenta adivinar
        const guess = text?.trim();
        if (!guess || guess.length !== 3 || isNaN(guess)) {
            return conn.reply(chatId, `⚠️ Debes enviar un código de *3 dígitos*. Ejemplo: \`${usedPrefix + command} 123\``, m);
        }

        const secret = gameData[chatId].code;
        gameData[chatId].attempts++;

        let fijos = 0;
        let toques = 0;

        for (let i = 0; i < 3; i++) {
            if (guess[i] === secret[i]) {
                fijos++;
            } else if (secret.includes(guess[i])) {
                toques++;
            }
        }

        if (fijos === 3) {
            const timeTaken = ((Date.now() - gameData[chatId].startTime) / 1000).toFixed(1);
            const totalAttempts = gameData[chatId].attempts;
            
            delete gameData[chatId]; // Limpiar juego

            return conn.reply(chatId, `✅ *SISTEMA HACKEADO*\n\nFelicidades @${m.sender.split('@')[0]}, descifraste el código: *${secret}*\n\n⏱️ *Tiempo:* ${timeTaken}s\n📉 *Intentos:* ${totalAttempts}\n\nNo hay recompensa monetaria, pero has demostrado superioridad técnica.`, m, { mentions: [m.sender] });
        } else {
            return conn.reply(chatId, `🔍 *RESULTADO DEL ESCANEO*\n\nCódigo probado: *${guess}*\n📍 Fijos: ${fijos}\n🔸 Toques: ${toques}\n\nSigue intentando...`, m);
        }
    }
};

export default hackerGame;
