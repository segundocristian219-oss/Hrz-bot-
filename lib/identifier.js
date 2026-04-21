/*import { jidNormalizedUser } from '@whiskeysockets/baileys'

export async function getRealJid(conn, jid, m) {
    let target = jid || (m?.key?.participant || m?.key?.remoteJid || m?.participant || conn.user.id)

    if (!target.endsWith('@lid')) return jidNormalizedUser(target)

    const sender = m?.key?.participant || m?.key?.remoteJid || m?.participant
    
    if (target === sender) {
        if (m?.key?.remoteJidAlt && m.key.remoteJidAlt.includes('@s.whatsapp.net')) {
            return jidNormalizedUser(m.key.remoteJidAlt)
        }
        if (m?.key?.participantAlt && m.key.participantAlt.includes('@s.whatsapp.net')) {
            return jidNormalizedUser(m.key.participantAlt)
        }
    }

    const chatId = m?.key?.remoteJid || m?.chat
    if (chatId?.endsWith('@g.us')) {
        try {
            const metadata = global.groupCache instanceof Map ? global.groupCache.get(chatId) : null
            if (metadata) {
                const participant = (metadata.participants || []).find(p => p.id === target)
                if (participant?.phoneNumber) {
                    let number = participant.phoneNumber
                    return jidNormalizedUser(number.includes('@') ? number : `${number}@s.whatsapp.net`)
                }
            }
        } catch (e) {
            return jidNormalizedUser(target)
        }
    }
    
    return jidNormalizedUser(target)
}

export async function resolveMentions(conn, mentions, m) {
    if (!mentions || !mentions.length) return []
    return Promise.all(mentions.map(jid => getRealJid(conn, jid, m)))
}

export function cleanNumber(jid) {
    if (!jid) return ''
    return String(jid).replace(/@.*$/, '').replace(/\D/g, '')
}*/


//#versión de prueba

import { jidNormalizedUser } from '@whiskeysockets/baileys'

export async function getRealJid(conn, jid, m) {
    let target = jid || (m?.key?.participant || m?.key?.remoteJid || m?.participant || conn.user.id)
    if (!target.endsWith('@lid')) return jidNormalizedUser(target)
    const sender = m?.key?.participant || m?.key?.remoteJid || m?.participant
    if (target === sender) {
        if (m?.key?.remoteJidAlt?.includes('@s.whatsapp.net')) return jidNormalizedUser(m.key.remoteJidAlt)
        if (m?.key?.participantAlt?.includes('@s.whatsapp.net')) return jidNormalizedUser(m.key.participantAlt)
    }
    const chatId = m?.key?.remoteJid || m?.chat
    if (chatId?.endsWith('@g.us')) {
        const metadata = global.groupCache?.get?.(chatId)
        if (metadata) {
            const participant = (metadata.participants || []).find(p => p.id === target)
            if (participant?.phoneNumber) {
                let number = participant.phoneNumber
                return jidNormalizedUser(number.includes('@') ? number : `${number}@s.whatsapp.net`)
            }
        }
    }
    return jidNormalizedUser(target)
}

export async function getOrCreateUser(m, realSenderId) {
    if (!realSenderId || realSenderId.includes(':') || realSenderId.startsWith('0')) return null;
    if (!realSenderId.endsWith('@s.whatsapp.net') && !realSenderId.endsWith('@lid')) return null;

    const rawLid = m.key.participant?.endsWith('@lid') ? m.key.participant : (m.sender.endsWith('@lid') ? m.sender : "");
    
    let user = await global.User.findOne({ 
        $or: [
            { id: realSenderId }, 
            { lid: realSenderId }, 
            { lid: rawLid }
        ].filter(Boolean) 
    });

    if (user) {
        let updates = {};
        if (realSenderId.endsWith('@s.whatsapp.net') && user.id !== realSenderId) updates.id = realSenderId;
        if (rawLid && user.lid !== rawLid) updates.lid = rawLid;
        
        if (Object.keys(updates).length > 0) {
            await global.User.updateOne({ _id: user._id }, { $set: updates });
            Object.assign(user, updates);
        }
        return user;
    }

    return await global.User.create({
        id: realSenderId.endsWith('@s.whatsapp.net') ? realSenderId : "",
        lid: rawLid || (realSenderId.endsWith('@lid') ? realSenderId : ""),
        name: (m.pushName && !m.pushName.includes('@')) ? m.pushName : "Usuario",
        exp: 0,
        col: 10,
        lastSeen: new Date()
    }).catch(() => null);
}

