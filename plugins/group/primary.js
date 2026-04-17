export default {
    name: 'setprimary',
    run: async (m, { conn }) => {
        await conn.sendMessage(m.chat, { text: 'funciona' }, { quoted: m })
    }
}
