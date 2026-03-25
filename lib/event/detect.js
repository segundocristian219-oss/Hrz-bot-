import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { getRealJid } from '../identifier.js'

export async function events(conn, m, participants) {
    if (!m.messageStubType || !m.chat?.endsWith('@g.us')) return true

    const botJid = jidNormalizedUser(conn.user.id)
    let authorRaw = m.sender || m.key.participant || m.participant || m.key.remoteJid
    if (!authorRaw) return true

    let author = jidNormalizedUser(await getRealJid(conn, authorRaw, m))
    if (author === botJid) return true

    const chat = await global.Chat.findOne({ id: m.chat })
    if (!chat || (!chat.welcome && !chat.detect)) return true

    const st = m.messageStubType
    const params = m.messageStubParameters || []
    const allowedEvents = [21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 32, 145, 171]

    if (!allowedEvents.includes(st)) return true

    let whoJid = ''
    try {
        if (params[0] && typeof params[0] === 'string' && params[0].startsWith('{')) {
            const parsed = JSON.parse(params[0])
            whoJid = parsed.phoneNumber || parsed.id || parsed.jid || author
        } else {
            whoJid = params[0] || author
        }
    } catch {
        whoJid = params[0] || author
    }

    if (!whoJid) return true
    let who = jidNormalizedUser(await getRealJid(conn, String(whoJid), m))
    let whoTag = `@${who.split('@')[0]}`
    let authorTag = `@${author.split('@')[0]}`

    let tipo = '', icon = '🛡️', mensaje = ''
    let thumb = 'https://api.dix.lat/media/1773635411398_f9REwtsTW.jpeg' 
    let mentions = [author, who]
    let isWelcome = false

    switch (st) {
        case 27:
        case 31:
            isWelcome = true
            tipo = 'ᴡᴇʟᴄᴏᴍᴇ'
            break
        case 28:
            if (global.groupCache instanceof Map) global.groupCache.delete(m.chat)
            tipo = 'sᴀʟɪᴅᴀ'
            icon = '👞'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴇʟɪᴍɪɴᴀᴅᴏ ᴘᴏʀ: ${authorTag}`
            break
        case 32:
            if (global.groupCache instanceof Map) global.groupCache.delete(m.chat)
            tipo = 'sᴀʟɪᴅᴀ'
            icon = '👋'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: sᴇ ʜᴀ ɪᴅᴏ ᴅᴇʟ ɢʀᴜᴘᴏ`
            break
        case 29:
            if (global.groupCache instanceof Map) global.groupCache.delete(m.chat)
            tipo = 'ᴀsᴄᴇɴsᴏ'
            icon = '⚡'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 30:
            if (global.groupCache instanceof Map) global.groupCache.delete(m.chat)
            tipo = 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ'
            icon = '❌'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 21:
            if (!params[0]) return true
            tipo = 'ɴᴏᴍʙʀᴇ'
            icon = '📝'
            mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴏ ᴛɪᴛᴜʟᴏ\n> ┃ ✎ ᴠᴀʟᴏʀ: ${params[0]}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 22:
            tipo = 'ɪᴄᴏɴᴏ'
            icon = '🖼️'
            mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɪᴍᴀɢᴇɴ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 23:
            tipo = 'ᴇɴʟᴀᴄᴇ'
            icon = '🔗'
            mensaje = `> ┃ ✎ ᴀᴄᴄɪᴏɴ: ᴇɴʟᴀᴄᴇ ʀᴇsᴛᴀʙʟᴇᴄɪᴅᴏ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 25:
            tipo = 'ᴀᴊᴜsᴛᴇs'
            icon = '⚙️'
            mensaje = `> ┃ ✎ ᴇᴅɪᴄɪᴏɴ ᴅᴇ ɪɴғᴏ: ${params[0] === 'on' ? 'sᴏʟᴏ ᴀᴅᴍɪɴs' : 'ᴛᴏᴅᴏs'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 26:
            tipo = 'ᴄʜᴀᴛ'
            icon = '💬'
            mensaje = `> ┃ ✎ ᴇɴᴠɪᴏ ᴅᴇ ᴍsɢs: ${params[0] === 'on' ? 'sᴏʟᴏ ᴀᴅᴍɪɴs' : 'ᴛᴏᴅᴏs'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 145:
            tipo = 'ᴀᴘʀᴏʙᴀᴄɪᴏɴ'
            icon = '🛡️'
            mensaje = `> ┃ ✎ ᴍᴏᴅᴏ ᴅᴇ ɪɴɢʀᴇsᴏ: ${params[0] === 'on' ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 171:
            tipo = 'ᴍɪᴇᴍʙʀᴏs'
            icon = '👥'
            mensaje = `> ┃ ✎ ᴘᴇʀᴍɪsᴏ ᴀñᴀᴅɪʀ: ${params[0] === 'all_member_add' ? 'ᴛᴏᴅᴏs' : 'sᴏʟᴏ ᴀᴅᴍɪɴs'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
    }

    if (!isWelcome && (!tipo || !mensaje || mensaje.includes('undefined'))) return true

    if (isWelcome && chat.welcome) {
        const groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
        const groupName = groupMetadata.subject || 'Sistema'
        const memberCount = participants?.length || groupMetadata.participants?.length || '0'
        const ownerNumber = groupMetadata.owner ? groupMetadata.owner.split('@')[0] : 'No disponible'
        const dateCreated = groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleDateString('es-ES') : 'Desconocida'

        let txt = `──────────────\n`
        txt += `〉 ᴜꜱᴇʀ: ${whoTag}\n`
        txt += `〉 ɴᴏᴅᴇ: ${groupName}\n`
        txt += `〉 ꜱᴛᴀᴛᴜꜱ: ᴏɴʟɪɴᴇ\n`
        txt += `──────────────\n`
        txt += `┌  ᴅᴀᴛᴀ\n`
        txt += `│ ɴᴏᴅᴏꜱ: [ ${memberCount} ]\n`
        txt += `│ ᴏᴡɴᴇʀ: @${ownerNumber}\n`
        txt += `│ ᴄʀᴇᴀᴛᴇᴅ: ${dateCreated}\n`
        txt += `└─────────────\n`
        if (chat.customWelcome) txt += `\n➠ ${chat.customWelcome}`

        try { thumb = await conn.profilePictureUrl(who, 'image') } catch {}
        return await conn.sendMessage(m.chat, { 
            image: { url: thumb }, 
            caption: txt, 
            mentions: [who, author, groupMetadata.owner].filter(Boolean) 
        })
    } 

    if (chat.detect && tipo !== 'ᴡᴇʟᴄᴏᴍᴇ') {
        try { thumb = await conn.profilePictureUrl(m.chat, 'image') } catch {}
        return await conn.sendMessage(m.chat, {
            text: `> ┏━━━〔 ${tipo} 〕━━━┓\n${mensaje}\n> ┗━━━━━━━━━━━━━━━━━━┛`,
            contextInfo: {
                mentionedJid: mentions.filter(j => j && j.includes('@')),
                externalAdReply: {
                    title: `ꜱɪꜱᴛᴇᴍᴀ: ${tipo}`,
                    body: `Evento detectado: ${icon}`,
                    mediaType: 1,
                    thumbnailUrl: thumb,
                    renderLargerThumbnail: false
                }
            }
        })
    }
    return true
}

