import { jidNormalizedUser } from '@whiskeysockets/baileys'

const LID_SUFFIX = '@lid'
const GROUP_SUFFIX = '@g.us'
const WA_SUFFIX = '@s.whatsapp.net'

function toWaJid(raw) {
    if (!raw) return null
    const clean = String(raw).replace(/@.*$/, '').replace(/\D/g, '')
    if (!clean) return null
    return `${clean}${WA_SUFFIX}`
}

function safeNormalize(jid) {
    if (!jid) return null
    try { return jidNormalizedUser(jid) } catch { return jid }
}

function isLid(jid) {
    return typeof jid === 'string' && jid.endsWith(LID_SUFFIX)
}

function isValidWaJid(jid) {
    return typeof jid === 'string' && (jid.endsWith(WA_SUFFIX) || jid.endsWith('@c.us')) && !jid.endsWith(LID_SUFFIX)
}

async function resolveFromGroup(conn, lidJid, chatId) {
    if (!chatId?.endsWith(GROUP_SUFFIX)) return null
    try {
        let metadata = global.groupCache instanceof Map ? global.groupCache.get(chatId) : null
        if (!metadata) {
            metadata = await conn.groupMetadata(chatId)
            if (global.groupCache instanceof Map) global.groupCache.set(chatId, metadata)
        }
        const participants = metadata?.participants ?? []
        const match = participants.find(p => p.id === lidJid || p.lid === lidJid)
        if (match) {
            if (match.phoneNumber) return toWaJid(match.phoneNumber)
            if (match.id && !isLid(match.id)) return safeNormalize(match.id)
        }
    } catch {}
    return null
}

async function resolveFromContacts(conn, lidJid) {
    if (!conn?.store?.contacts) return null
    const contact = conn.store.contacts[lidJid]
    if (!contact) return null
    if (contact?.id && !isLid(contact.id)) return safeNormalize(contact.id)
    if (contact?.notify || contact?.name) {
        const phone = (contact.notify || contact.name).replace(/\D/g, '')
        if (phone.length >= 7) return `${phone}${WA_SUFFIX}`
    }
    return null
}

async function resolveLid(conn, lidJid, m) {
    const chatId = m?.key?.remoteJid ?? m?.chat

    // En privado: el remoteJid mismo puede ser el @lid, intentar resolverlo desde contacts
    if (!chatId?.endsWith(GROUP_SUFFIX)) {
        const fromContacts = await resolveFromContacts(conn, lidJid)
        if (fromContacts) return fromContacts
        // En privado, el remoteJid @lid NO tiene número asociado en metadata de grupo
        // Intentar extraer el número del propio remoteJid si es numérico
        const raw = String(lidJid).replace(/@.*$/, '').replace(/\D/g, '')
        if (raw.length >= 7) return `${raw}${WA_SUFFIX}`
        return null
    }

    const fromGroup = await resolveFromGroup(conn, lidJid, chatId)
    if (fromGroup) return fromGroup

    const fromContacts = await resolveFromContacts(conn, lidJid)
    if (fromContacts) return fromContacts

    return null
}

export async function getRealJid(conn, jid, m) {
    // Prioridad de extracción del JID real
    const candidates = [
        jid,
        m?.key?.participant,
        m?.participant,
        m?.sender,
        m?.key?.remoteJid,
        conn?.user?.id
    ]

    // Buscar el primer JID válido que no sea @lid
    for (const candidate of candidates) {
        if (!candidate) continue
        if (!isLid(candidate)) return safeNormalize(candidate)
    }

    // Todos los candidatos son @lid, intentar resolver
    const raw = candidates.find(c => c && isLid(c))
    if (!raw) return null

    const resolved = await resolveLid(conn, raw, m)
    return resolved ?? safeNormalize(raw)
}

export async function resolveMentions(conn, mentions, m) {
    if (!mentions?.length) return []
    return Promise.all(mentions.map(jid => getRealJid(conn, jid, m)))
}

export function cleanNumber(jid) {
    if (!jid) return ''
    return String(jid).replace(/@.*$/, '').replace(/\D/g, '')
}
