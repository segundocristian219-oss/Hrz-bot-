import fetch from 'node-fetch'
import { getRealJid } from '../../lib/identifier.js' 

const groupConfig = {
    name: 'config_group',
    alias: ['setwelcome', 'delwelcome', 'renombrar', 'setnombre', 'setname', 'desc', 'setdesc', 'setfoto', 'setpp', 'elimina', 'kick', 'ban', 'echar', 'sacar', 'tagall', 'todos', 'all', 'anuncio'],
    category: 'group',
    admin: true,
    group: true,
    botAdmin: true,
    run: async function (m, { conn, text, command, participants, chat }) {

        if (command === 'setwelcome') {
            if (!text) return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ɪɴɢʀᴇsᴀ ᴇʟ ᴛᴇxᴛᴏ.')
            chat.customWelcome = text
            return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄ...ɴғɪɢ: ᴡᴇʟᴄᴏᴍᴇ sᴇᴛ\n> ┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (command === 'delwelcome') {
            chat.customWelcome = ''
            return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄ...ɴғɪɢ: ᴡᴇʟᴄᴏᴍᴇ ʀᴇsᴇᴛ\n> ┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (/renombrar|setnombre|setname/i.test(command)) {
            if (!text) return m.reply('> ┃ ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ɴᴏᴍʙʀᴇ.')
            await conn.groupUpdateSubject(m.chat, text)
            return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴏᴍʙʀᴇ ᴀᴄᴛᴜᴀʟ\n> ┃ ✎ ᴠᴀʟᴜᴇ: ${text}\n> ┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (/desc|setdesc/i.test(command)) {
            let newDesc = m.quoted ? m.quoted.text : text
            if (!newDesc) return m.reply('> ┃ ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ʟᴀ ᴅᴇsᴄʀɪᴘᴄɪᴏɴ.')
            await conn.groupUpdateDescription(m.chat, newDesc)
            return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄ...ɴғɪɢ: ᴅᴇsᴄ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n> ┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (/setfoto|setpp/i.test(command)) {
            let q = m.quoted ? m.quoted : m
            let mime = (q.msg || q).mimetype || ''
            if (!/image/.test(mime)) return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ.')
            let media = await q.download()
            await conn.updateProfilePicture(m.chat, media)
            return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄ...ɴғɪɢ: ғᴏᴛᴏ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n> ┗━━━━━━━━━━━━━━━━━━┛`)
        }

        if (/elimina|kick|ban|echar|sacar/i.test(command)) {
            let users = m.mentionedJid.concat(m.quoted ? [m.quoted.sender] : []).filter(u => u !== conn.user.jid)
            if (users.length === 0) return m.reply('> ✎ ɪɴғᴏ: ᴇᴛɪǫᴜᴇᴛᴀ ᴀ ᴀʟɢᴜɪᴇɴ.')
            for (let user of users) {
                await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
            }
            return m.reply(`> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: ᴜsᴜᴀʀɪᴏs ᴇʟɪᴍɪɴᴀᴅᴏs\n> ┗━━━━━━━━━━━━━━━━━━┛`)
        }

            
            if (/tagall|todos|all|anuncio/i.test(command)) {
    let txt = `> ┏━━━〔 ᴀɴᴜɴᴄɪᴏ ɢʀᴜᴘᴀʟ 〕━━━┓\n> ┃ ✎ ᴍsɢ: ${text || 'sɪɴ ᴍᴏᴛɪᴠᴏ'}\n> ┃\n`

    const realParticipants = await Promise.all(
        participants.map(async (p) => {
            return await getRealJid(conn, p.id, m);
        })
    );

    for (let jid of realParticipants) {
        txt += `> ┃ ✎ @${jid.split('@')[0]}\n`
    }

    txt += `> ┗━━━━━━━━━━━━━━━━━━┛`

    return conn.sendMessage(m.chat, { 
        text: txt, 
        contextInfo: { 
            mentionedJid: realParticipants,
            groupMentions: [],
            remoteJidAlt: m.chat
        } 
    }, { quoted: m })
}

    }
}

export default groupConfig
