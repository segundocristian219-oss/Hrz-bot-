import axios from 'axios'

const googleMaps = {
    name: 'maps',
    alias: ['gmaps', 'mapa', 'ubicacion'],
    category: 'herramientas',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return conn.reply(m.chat, `❀ Te falta el lugar que deseas buscar.\n\n> Ejemplo: *${usedPrefix + command} Fortaleza de San Fernando Omoa*`, m)

        try {
            if (m.react) await m.react('📍')

            // Limpiamos un poco el texto por si vienen Plus Codes pegados
            const query = text.replace(/[+]/g, ' ').trim()
            
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Voker-Bot-Automation/1.0'
                }
            })

            if (!data || data.length === 0) {
                return conn.reply(m.chat, `❌ No pude encontrar coordenadas para: *${text}*\n\n> 💡 Prueba escribiendo el nombre del lugar directamente.`, m)
            }

            const place = data[0]
            const lat = place.lat
            const lon = place.lon
            
            // ENLACE CORREGIDO: Formato estándar de Google Maps para coordenadas
            const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
            
            // Imagen del mapa con zoom ajustado (z=16)
            const mapImage = `https://static-maps.yandex.ru/1.x/?lang=es_ES&ll=${lon},${lat}&z=16&l=map&size=600,450&pt=${lon},${lat},pm2rdm`

            const textoFinal = `📍 *ɢᴏᴏɢʟᴇ ᴍᴀᴘs sᴇᴀʀᴄʜ*\n\n` +
                               `> 🚩 *ʙᴜsᴄᴀᴅᴏ:* ${text.toUpperCase()}\n` +
                               `> 🗺️ *ᴜʙɪᴄᴀᴄɪᴏɴ:* ${place.display_name}\n\n` +
                               `🔗 *ᴇɴʟᴀᴄᴇ:* ${mapLink}`

            await conn.sendMessage(m.chat, {
                image: { url: mapImage },
                caption: textoFinal
            }, { quoted: m })

        } catch (e) {
            console.error('Error en Maps:', e)
            conn.reply(m.chat, `❌ Ocurrió un error inesperado al consultar el mapa.`, m)
        }
    }
}

export default googleMaps
