import { readFileSync } from 'fs';
import { join } from 'path';

const menuCommand = {
    name: 'menu',
    alias: ['help', 'comandos', 'h'],
    category: 'main',
    run: async (m, { conn, usedPrefix }) => {
        try {
            await m.react('⏳');

            let uptime = clockString(process.uptime() * 1000);
            let totalreg = await global.User.countDocuments();

            const v = JSON.parse(readFileSync('./package.json', 'utf-8')).version;

            const subBots = (global.conns || []).filter(c => 
                c.user && c.ws?.socket?.readyState !== 3 
            ).length;

            const nameBot = typeof global.name() === 'object' ? global.name() : 'GUILTY CROWN — VX';
            const rmrText = typeof global.rmr === 'string' ? global.rmr : 'Sʏsᴛᴇᴍ V5.8.0';


            let menuText = `╔══『 *${nameBot.toUpperCase()}* 』══╗\n`;
            menuText += `║ • Usuario: @${m.sender.split('@')[0]}\n`;
            menuText += `║ • Usuarios: ${totalreg}\n`;
            menuText += `║ • Uptime: ${uptime}\n`;
            menuText += `║ • Nodos: ${subBots}\n`;
            menuText += `║ • Versión: ${v}\n`;
            menuText += `║ • *dix.lat/channel*\n`;
            menuText += `╚═════════════════╝\n\n`;
            
            menuText += `${rmrText}\n\n`;


            const categories = [
                {
                    title: 'MAIN',
                    cmds: [
                        { cmd: '.menu', desc: 'Muestra este menú de ayuda.' },
                        //{ cmd: '.bots', desc: 'Lista los sub-bots activos.' },
                       // { cmd: '.code', desc: 'Obtén el código fuente del bot.' },
                        { cmd: '.creador', desc: 'Información sobre el creador.' }
                    ]
                },
                {
                    title: 'FUN',
                    cmds: [
                        { cmd: '.gay', desc: 'Mide tu nivel de homosexualidad (simulación).' },
                        { cmd: '.poema', desc: 'Poemas Aleatorios.' },
                        { cmd: '.reflexión', desc: 'Una reflexión aleatoria.' },
                        { cmd: '.consejo', desc: 'Consejos aleatorios.' },
                        { cmd: '.meme', desc: 'Envía un meme aleatorio para reír.' }
                    ]
                },
                {
                    title: 'DOWNLOAD',
                    cmds: [
                        { cmd: '.play', desc: 'Descarga audio de YouTube (música).' },
                        { cmd: '.play2', desc: 'Descarga video de YouTube.' },
                        { cmd: '.facebook/fb', desc: 'Descarga video de Facebook.' },
                        { cmd: '.instagram/ig', desc: 'Descarga contenido de Instagram (post/reel/story).' },
                        { cmd: '.tiktok/tt', desc: 'Descarga video de TikTok sin marca de agua.' }
                    ]
                },
                {
                    title: 'GANE',
                    cmds: [
                        { cmd: '.tesoro/.mapa', desc: 'Encuentra el tesoro oculto.' },
                        { cmd: '.mate/.math', desc: 'Resuelve una suma matemática.' },
                        { cmd: '.tresenraya/.x0', desc: 'Juega tresenraya con tu amigo.' },
                        { cmd: '.palabra', desc: 'Adivina la palabra.' }
                    ]
                },
                {
                    title: 'ANIME',
                    cmds: [
                        { cmd: '.kill', desc: 'Envía un gif de "matar" estilo anime.' },
                        { cmd: '.kiss', desc: 'gif de beso anime.' },
                        { cmd: '.kiss2', desc: 'gif de beso gay anime.' },
                        { cmd: '.hug', desc: 'gif de abrazo anime.' },
                        { cmd: '.hello', desc: 'gif de saludo anime.' },
                        { cmd: '.coffee', desc: 'gif de café anime.' },
                        { cmd: '.angry', desc: 'gif de enojo anime.' },
                        { cmd: '.happy', desc: 'gif de felicidad anime.' },
                        { cmd: '.sad', desc: 'gif de tristeza anime.' },
                        { cmd: '.slap', desc: 'gif de bofetada anime.' },
                        { cmd: '.laugh', desc: 'gif de risa anime.' }
                    ]
                },
                {
                    title: 'INTELIGENCIA ARTIFICIAL',
                    cmds: [
                        { cmd: '.imgg', desc: 'Genera imágenes a partir de texto usando IA.' },
                        { cmd: '.ia', desc: 'Chat con inteligencia artificial (modelo genérico).' },
                        { cmd: '.tts', desc: 'Convierte texto a voz (audio).' },
                        { cmd: '.chatgpt', desc: 'Interactúa con ChatGPT.' },
                        { cmd: '.gemini', desc: 'Interactúa con Gemini AI de Google.' },
                        { cmd: '.removebg', desc: 'Elimina el fondo de una imagen.' },
                        { cmd: '.hd', desc: 'Mejora la calidad/resolución de una imagen.' }
                    ]
                },
                {
                    title: 'GROUP CONFIG',
                    cmds: [
                       // { cmd: '.antisub', desc: 'Activa/desactiva anti-sub (evita que se unan números sospechosos).' },
                        { cmd: '.antilink', desc: 'Activa/desactiva anti-enlaces en el grupo.' },
                        { cmd: '.antiestados', desc: 'Activa/desactiva anti-estados (Mención en Estados.).' },
                        { cmd: '.config_group', desc: 'Muestra la configuración actual del grupo.' },
                        { cmd: '.hidetag', desc: 'Menciona a todos los miembros silenciosamente.' },
                        { cmd: '.setwelcome', desc: 'Establece un mensaje de bienvenida personalizado.' },
                        { cmd: '.todos', desc: 'Menciona a todos los miembros del grupo.' },
                        { cmd: '.setpp', desc: 'Cambia la foto de perfil del grupo.' },
                        { cmd: '.setname', desc: 'Cambia el nombre del grupo.' },
                        { cmd: '.setdesc', desc: 'Cambia la descripción del grupo.' },
                        { cmd: '.delwelcome', desc: 'Elimina el mensaje de bienvenida personalizado.' },
                        { cmd: '.welcome on/off', desc: 'Activa/desactiva el mensaje de bienvenida.' },
                        { cmd: '.detect on/off', desc: 'Activa/desactiva la detección de eventos (entradas/salidas).' },
                        { cmd: '.kick', desc: 'Expulsa a un miembro del grupo (requiere ser admin).' },
                        { cmd: '.link', desc: 'Obtiene el enlace de invitación del grupo.' },
                        { cmd: '.open/close', desc: 'Abre o cierra el grupo (solo admins pueden enviar mensajes).' },
                        { cmd: '.mute/unmute', desc: 'Silencia los mensajes de un usuario.' }
                    ]
                },
                {
                    title: 'STICKERS',
                    cmds: [
                        { cmd: '.s', desc: 'Crea un sticker a partir de imagen/video/gif.' },
                        { cmd: '.wm', desc: 'Cambia o agrega información a un sticker.' },
                        { cmd: '.brat', desc: 'Crea sticker con estilo "brat" (texto distorsionado).' },
                        { cmd: '.qc', desc: 'Crea sticker de quote (cita) con avatar.' },
                        { cmd: '.emo', desc: 'Crea sticker animados a partir de un emoji.' },
                        { cmd: '.emojimix', desc: 'Combina emojis.' }
                    ]
                },
                {
                    title: 'SEARCH',
                    cmds: [
                        { cmd: '.pinterest', desc: 'Busca imágenes en Pinterest.' },
                        { cmd: '.ttss', desc: 'Busca videos/usuarios en TikTok.' },
                        { cmd: '.gif', desc: 'Busca y envía un GIF animado.' },
                        { cmd: '.ytsearch', desc: 'Busca videos en YouTube.' },
                        { cmd: '.buscar', desc: 'Búsqueda general en Google (resultados en texto).' }
                    ]
                },
                {
                    title: 'TOOLS',
                    cmds: [
                        { cmd: '.get', desc: 'Obtiene información de un enlace (metadata, headers).' },
                        { cmd: '.upload', desc: 'Sube un archivo a servicios de alojamiento temporal.' },
                        { cmd: '.read/ver', desc: 'Extraer archivos de una sola visualización.' },
                        { cmd: '.whatmusic', desc: 'Reconoce música a partir de un audio (Shazam).' },
                        { cmd: '.traducir', desc: 'Traduce texto a otro idioma.' },
                        { cmd: '.qr', desc: 'Genera un código QR a partir de texto.' },
                        { cmd: '.acortar', desc: 'Acorta una URL usando un servicio (dix.lat).' },
                        { cmd: '.toimg', desc: 'Convierte un sticker a imagen PNG.' },
                        { cmd: '.pfp', desc: 'Obtiene la foto de perfil de un usuario.' },
                        { cmd: '.reducir', desc: 'Reduce el tamaño de una imagen.' },
                        { cmd: '.ssweb', desc: 'Toma una captura de pantalla de una página web.' }
                    ]
                },
                {
                    title: 'OWNER',
                    cmds: [
                        { cmd: '.await', desc: 'Comando de espera para pruebas (solo owner).' },
                        { cmd: '.restart', desc: 'Reinicia el bot (solo owner).' },
                        { cmd: '.ds', desc: 'Comando de debug/desarrollo (solo owner).' },
                        { cmd: '.up', desc: 'Actualiza el bot desde el repositorio (solo owner).' }
                    ]
                }
            ];


            categories.forEach(cat => {

                menuText += `┌──「 *${cat.title}* 」──\n`;
                cat.cmds.forEach(item => {

                    menuText += `♛ *${item.cmd}* \n> ➠${item.desc}\n`;
                });
                menuText += `└───────────────\n\n`; 
            });

            menuText += `> © Powered by VOKER Platform.`;



await conn.sendMessage(m.chat, { 
    text: menuText, 
    contextInfo: {
        mentionedJid: [m.sender],
        
        linkPreview: {
            title: nameBot,
            body: 'Únete a nuestro canal oficial',
            thumbnail: await (await fetch(global.img())).buffer(),
            sourceUrl: 'https://dix.lat/channel' 
        }
    }
}, { quoted: m });





            await m.react('🍃');

        } catch (error) {
            console.error(error);
            m.reply('❌ Error al generar el menú.');
        }
    }
};

export default menuCommand;

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}