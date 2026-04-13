import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = {
    BASE_COL: 1000
};

const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const signs = [
    "aries", "tauro", "geminis", "cancer", "leo", "virgo", 
    "libra", "escorpio", "sagitario", "capricornio", "acuario", "piscis"
];

const fortunes = {
    amor: [
        "Conocerás a alguien especial muy pronto.",
        "Un viejo amor regresará buscando respuestas.",
        "Fortalecerás tus lazos actuales, día romántico.",
        "Es un día perfecto para amarte a ti mismo.",
        "Evita discusiones innecesarias, mantén la calma."
    ],
    dinero: [
        "Llegará un ingreso inesperado a tu cuenta.",
        "Cuidado con los gastos impulsivos esta semana.",
        "La suerte está de tu lado para pequeños negocios.",
        "Un proyecto estancado comenzará a dar frutos.",
        "Momento ideal para ahorrar, evita prestar dinero."
    ],
    salud: [
        "Cuida tu postura, tu espalda te lo agradecerá.",
        "Necesitas dormir más horas, el cansancio se acumula.",
        "Día lleno de energía y vitalidad, ¡aprovéchalo!",
        "Bebe más agua y busca momentos de desconexión.",
        "Evita el estrés, una caminata te hará muy bien."
    ],
    adivinacion: [
        "La bola de cristal muestra un viaje inesperado.",
        "Las estrellas indican un giro sorprendente en tu destino.",
        "El tarot revela que un secreto te será confiado.",
        "Los astros se alinean para cumplir un deseo oculto.",
        "Una sorpresa agradable tocará a tu puerta hoy."
    ],
    colores: ["Rojo Carmesí", "Azul Zafiro", "Verde Esmeralda", "Amarillo Oro", "Violeta Místico", "Blanco Nieve", "Negro Ónice", "Rosa Cuarzo"]
};

const horoscopoCommand = {
    name: 'horoscopo',
    alias: ['zodiaco', 'suerte', 'adivinacion'],
    category: 'game',
    run: async (m, { conn, args, usedPrefix, command }) => {
        const cost = 50;
        const cleanArg = args[0] ? args[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

        if (!args[0] || !signs.includes(cleanArg)) {
            let txt = `『 ASTROLOGÍA MÍSTICA 』\n\n`;
            txt += `✦ USO: ${usedPrefix + command} <signo>\n`;
            txt += `✧ COSTO: ${formatCol(cost)} Col\n\n`;
            txt += `◈ SIGNOS:\n${signs.join(', ')}\n──────────────────`;
            return conn.reply(m.chat, txt, m);
        }

        let user = await global.User.findOne({ id: m.sender });
        if (!user) user = await global.User.create({ id: m.sender, col: ECO_CONFIG.BASE_COL });

        if ((user.col || ECO_CONFIG.BASE_COL) < cost) {
            return m.reply(`❌ Fondos insuficientes. Necesitas ${formatCol(cost)} Col.`);
        }

        let newCol = (user.col || ECO_CONFIG.BASE_COL) - cost;
        if (newCol < ECO_CONFIG.BASE_COL) newCol = ECO_CONFIG.BASE_COL;

        await global.User.updateOne({ id: m.sender }, { $set: { col: newCol } });

        const amor = fortunes.amor[Math.floor(Math.random() * fortunes.amor.length)];
        const dinero = fortunes.dinero[Math.floor(Math.random() * fortunes.dinero.length)];
        const salud = fortunes.salud[Math.floor(Math.random() * fortunes.salud.length)];
        const adivinacion = fortunes.adivinacion[Math.floor(Math.random() * fortunes.adivinacion.length)];
        const color = fortunes.colores[Math.floor(Math.random() * fortunes.colores.length)];
        const num1 = Math.floor(Math.random() * 99) + 1;
        const num2 = Math.floor(Math.random() * 99) + 1;

        const txt = `『 HORÓSCOPO Y DESTINO 』\n\n◈ SIGNO: ${cleanArg.toUpperCase()}\n◈ CONSULTANTE: @${m.sender.split('@')[0]}\n✧ COSTO: -${formatCol(cost)} Col\n\n✨ PREDICCIONES\n ❤️ AMOR: ${amor}\n 💰 DINERO: ${dinero}\n 🩺 SALUD: ${salud}\n\n🔮 MINI-ADIVINACIÓN\n ✦ VISIÓN: ${adivinacion}\n ✧ COLOR: ${color}\n ✦ NÚMEROS: ${num1}, ${num2}\n\n✧ BALANCE: ${formatCol(newCol)} Col\n──────────────────`;

        await conn.sendMessage(m.chat, { text: txt, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m });
        await m.react("🔮");
    }
};

export default horoscopoCommand;
