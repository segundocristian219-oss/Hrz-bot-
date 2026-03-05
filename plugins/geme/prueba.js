import axios from 'axios';

const characters = [
    {
        name: "mario",
        universe: "Nintendo",
        hint: "Es un fontanero italiano que rescata princesas.",
        img: "https://raw.githubusercontent.com/deylin-16/database/main/games/monochrome/mario_bw.webp"
    },
    {
        name: "goku",
        universe: "Dragon Ball",
        hint: "Es un Saiyajin que busca las Esferas del Dragón.",
        img: "https://raw.githubusercontent.com/deylin-16/database/main/games/monochrome/goku_bw.webp"
    },
    {
        name: "pikachu",
        universe: "Pokémon",
        hint: "Es un ratón eléctrico amarillo, compañero de Ash.",
        img: "https://raw.githubusercontent.com/deylin-16/database/main/games/monochrome/pikachu_bw.webp"
    },
    {
        name: "naruto",
        universe: "Naruto",
        hint: "Es un ninja naranja que quiere ser Hokage.",
        img: "https://raw.githubusercontent.com/deylin-16/database/main/games/monochrome/naruto_bw.webp"
    },
    {
        name: "spider-man",
        alias: ["spiderman", "hombre araña"],
        universe: "Marvel",
        hint: "Obtuvo sus poderes por una picadura de araña radioactiva.",
        img: "https://raw.githubusercontent.com/deylin-16/database/main/games/monochrome/spiderman_bw.webp"
    },
    {
        name: "luffy",
        universe: "One Piece",
        hint: "Es un pirata de goma que busca el One Piece.",
        img: "https://raw.githubusercontent.com/deylin-16/database/main/games/monochrome/luffy_bw.webp"
    }
];

const clean = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const monochromeGame = {
    name: 'monochrome',
    alias: ['personaje', 'quien', 'adivinap'],
    category: 'game',
    async before(m) {
        const txt = (m.text || m.msg?.caption || m.msg?.text || m.message?.conversation || "").trim();
        
        if (!txt || m.isBaileys || m.fromMe || new RegExp('^[#!./]').test(txt)) return false;

        global.monoGames = global.monoGames || {};
        if (!global.monoGames[m.chat]) return false;

        const game = global.monoGames[m.chat];
        const userGuess = clean(txt);
        
        const isCorrect = userGuess === clean(game.character.name) || 
                          (game.character.alias && game.character.alias.some(a => clean(a) === userGuess));

        if (isCorrect) {
            await m.react("🏆");
            await this.reply(m.chat, `🎉 ¡@${m.sender.split('@')[0]} eres increíble!\n\nAdivinaste al personaje: *${game.character.name.toUpperCase()}*\n\nGracias por jugar.`, m, { mentions: [m.sender] });
            delete global.monoGames[m.chat];
            return true;
        } else {
            game.attempts++;
            await m.react("❌");

            if (game.attempts >= 3) {
                await this.reply(m.chat, `❌ *JUEGO TERMINADO*\n\nSe agotaron los 3 intentos.\nEl personaje era: *${game.character.name.toUpperCase()}*`, m);
                delete global.monoGames[m.chat];
                return true;
            }

            const hints = [
                `Pista 1: Pertenece al universo de *${game.character.universe}*.`,
                `Pista 2: *${game.character.hint}*`
            ];
            
            const randomHint = hints[game.attempts - 1] || hints[1];
            
            await this.reply(m.chat, `❌ *Incorrecto* (Intento ${game.attempts}/3)\n💡 ${randomHint}`, m);
            return true;
        }
    },
    run: async (m, { conn }) => {
        global.monoGames = global.monoGames || {};
        if (global.monoGames[m.chat]) return conn.reply(m.chat, `⚠️ Ya hay un juego activo en este chat.\nEscribe *personaje* para ver la imagen de nuevo.`, m);

        const character = characters[Math.floor(Math.random() * characters.length)];
        
        global.monoGames[m.chat] = {
            character,
            attempts: 0
        };

        const imageBuffer = (await axios.get(character.img, { responseType: 'arraybuffer' })).data;

        await conn.sendMessage(m.chat, { 
            image: imageBuffer, 
            caption: `👤 *¿QUIÉN ES ESTE PERSONAJE?*\n\nAdivina el personaje monocromático.\n\n_Escribe la respuesta directamente (3 intentos)._`
        }, { quoted: m });
    }
};

export default monochromeGame;
