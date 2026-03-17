import fetch from 'node-fetch'
import { format } from 'util'

const getCommand = {
    name: 'get',
    alias: ['fetch'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        try {
            await m.react('⏳')

            let buffer, mime, name

            if (m.quoted) {
                mime = m.quoted.mimetype || ''
                buffer = await m.quoted.download()
                name = m.quoted.fileName || 'file'
            } else {
                if (!text || !/^https?:\/\//.test(text)) {
                    return conn.sendMessage(m.chat, { 
                        text: `┏━━━〔 sʏsᴛᴇᴍ ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ɪɴғᴏ: ᴜʀʟ ɪɴᴠᴀʟɪᴅ.\n┃ ✎ ᴜsᴀɢᴇ: .ɢᴇᴛ <ʟɪɴᴋ>\n┗━━━━━━━━━━━━━━━━━━┛` 
                    }, { quoted: m })
                }
                const res = await fetch(text)
                mime = res.headers.get('content-type') || ''
                buffer = await res.buffer()
                name = text.split('/').pop() || 'file'
            }

           
            if (/json|javascript|text|html|css|xml/.test(mime) || !mime) {
                let txt = buffer.toString('utf-8')
                try {
  txt = JSON.stringify(JSON.parse(txt), null, 2)
} catch {}
                
                await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
                return m.react('✅')
            } 
            
            if (/image/.test(mime)) {
                await conn.sendMessage(m.chat, { image: buffer, caption: name }, { quoted: m })
            } 
            else if (/video/.test(mime)) {
                await conn.sendMessage(m.chat, { video: buffer, caption: name }, { quoted: m })
            } 
            else if (/audio/.test(mime)) {
                await conn.sendMessage(m.chat, { audio: buffer, mimetype: mime, ptt: false }, { quoted: m })
            } 
            else {
                
                await conn.sendMessage(m.chat, { 
                    document: buffer, 
                    mimetype: mime, 
                    fileName: name 
                }, { quoted: m })
            }

            await m.react('📡')

        } catch (err) {
            console.error(err)
            await m.react('❌')
            await conn.sendMessage(m.chat, { 
                text: `┏━━━〔 ғᴀᴛᴀʟ ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ᴍsɢ: ${err.message}\n┗━━━━━━━━━━━━━━━━━━┛` 
            }, { quoted: m })
        }
    }
}

export default getCommand
