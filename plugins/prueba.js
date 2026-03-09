import axios from 'axios'

const googleMaps = {
    name: 'maps',
    alias: ['gmaps', 'mapa', 'ubicacion'],
    category: 'herramientas',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return conn.reply(m.chat, `❀ Te falta el lugar que deseas buscar.\n\n> Ejemplo: *${usedPrefix + command} Multiplaza Tegucigalpa*`, m)

        try {
            if (m.react) await m.react('📍')

            // Configuración de búsqueda con User-Agent para evitar el Error 403
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1`
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Voker-Bot-Automation/1.0 (voker.business@gmail.com)'
                }
            })

            if (!data || data.length === 0) {
                return conn.reply(m.chat, `❌ No se encontró el lugar: *${text}*`, m)
            }

            const place = data[0]
            const { lat, lon, display_name } = place
            
            // Link universal de Google Maps
            const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
            
            // Imagen estática del mapa (Yandex es más permisivo con los bots)
            const mapImage = `https://static-maps.yandex.ru/1.x/?lang=es_ES&ll=${lon},${lat}&z=16&l=map&size=600,450&pt=${lon},${lat},pm2rdm`

            const textoFinal = `📍 *ɢᴏᴏɢʟᴇ ᴍᴀᴘs sᴇᴀʀᴄʜ*\n\n` +
                               `> 🚩 *ʟᴜɢᴀʀ:* ${text.toUpperCase()}\n` +
                               `> 🗺️ *ᴅɪʀᴇᴄᴄɪᴏɴ:* ${display_name}\n\n` +
                               `🔗 *ᴇɴʟᴀᴄᴇ:* ${mapLink}`

            await conn.sendMessage(m.chat, {
                image: { url: mapImage },
                caption: textoFinal
            }, { quoted: m })

        } catch (e) {
            console.error('Error en Maps:', e.response ? e.response.status : e.message)
            conn.reply(m.chat, `❌ Error de conexión con el servidor de mapas (Status: ${e.response?.status || 'desconocido'}).`, m)
        }
    }
}

export default googleMaps
