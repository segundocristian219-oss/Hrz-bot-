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

async function resolveLid(conn, lidJid, m) {
    const chatId = m?.key?.remoteJid ?? m?.chat

    const fromGroup = await resolveFromGroup(conn, lidJid, chatId)
    if (fromGroup) return fromGroup

    if (conn?.store?.contacts) {
        const contact = conn.store.contacts[lidJid]
        if (contact?.id && !isLid(contact.id)) return safeNormalize(contact.id)
        if (contact?.notify || contact?.name) {
            const phone = (contact.notify || contact.name).replace(/\D/g, '')
            if (phone.length >= 8) return `${phone}${WA_SUFFIX}`
        }
    }

    return null
}

export async function getRealJid(conn, jid, m) {
    const raw =
        jid ||
        m?.key?.participant ||
        m?.participant ||
        m?.sender ||
        m?.key?.remoteJid ||
        conn?.user?.id

    if (!raw) return null

    if (!isLid(raw)) return safeNormalize(raw)

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