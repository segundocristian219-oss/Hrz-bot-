import axios from 'axios'

const googleMaps = {
    name: 'maps',
    alias: ['gmaps', 'mapa', 'ubicacion'],
    category: 'herramientas',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) return conn.reply(m.chat, `❀ Te falta el lugar que deseas buscar.\n\n> Ejemplo: *${usedPrefix + command} Torre Eiffel*`, m)

        try {
            if (m.react) await m.react('📍')

            // Usamos un servicio de búsqueda para obtener coordenadas y datos
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1`
            const { data } = await axios.get(searchUrl)

            if (!data || data.length === 0) {
                return conn.reply(m.chat, `❌ No se encontró el lugar: *${text}*`, m)
            }

            const place = data[0]
            const lat = place.lat
            const lon = place.lon
            const name = place.display_name
            
            // Generamos un link directo a Google Maps
            const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
            
            // Generamos una imagen del mapa usando un servicio estático gratuito
            const mapImage = `https://static-maps.yandex.ru/1.x/?lang=es_ES&ll=${lon},${lat}&z=15&l=map&size=600,400&pt=${lon},${lat},pm2rdm`

            const textoFinal = `📍 *ʙᴜsᴄᴀᴅᴏʀ ᴅᴇ ᴍᴀᴘs*\n\n` +
                               `> 🚩 *ʟᴜɢᴀʀ:* ${place.name || text}\n` +
                               `> 🗺️ *ᴅɪʀᴇᴄᴄɪᴏɴ:* ${name}\n\n` +
                               `🔗 *ʟɪɴᴋ:* ${mapLink}`

            await conn.sendMessage(m.chat, {
                image: { url: mapImage },
                caption: textoFinal
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            conn.reply(m.chat, `❌ Ocurrió un error al buscar el lugar.`, m)
        }
    }
}

export default googleMaps
