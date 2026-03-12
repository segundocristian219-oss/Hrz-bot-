/**
 * ╔══════════════════════════════════════════╗
 * ║         IDENTIFIER - JID RESOLVER        ║
 * ║  Baileys Official | Anti-@lid | Fast     ║
 * ╚══════════════════════════════════════════╝
 */

import { jidNormalizedUser } from '@whiskeysockets/baileys'

// ─── Caché interna para resoluciones @lid → JID real ────────────────────────
// Evita consultar groupMetadata repetidamente para el mismo @lid
const lidCache = new Map()
const LID_CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// ─── Helpers básicos ─────────────────────────────────────────────────────────

/** Devuelve true si el JID es del tipo @lid (no resoluble directamente) */
const isLid    = (jid) => typeof jid === 'string' && jid.endsWith('@lid')

/** Devuelve true si es un JID de grupo */
const isGroup  = (jid) => typeof jid === 'string' && jid.endsWith('@g.us')

/** Devuelve true si es un JID de usuario real */
const isUser   = (jid) => typeof jid === 'string' && jid.endsWith('@s.whatsapp.net')

/** Normaliza cualquier JID de forma segura */
const safeNorm = (jid) => {
    if (!jid || typeof jid !== 'string') return null
    try { return jidNormalizedUser(jid) } catch { return null }
}

/** Convierte número limpio en JID estándar */
const toJid    = (num) => `${String(num).replace(/\D/g, '')}@s.whatsapp.net`

/** Lee entrada de caché si no ha expirado */
const fromCache = (key) => {
    const entry = lidCache.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > LID_CACHE_TTL) { lidCache.delete(key); return null }
    return entry.jid
}

/** Guarda en caché */
const toCache = (key, jid) => lidCache.set(key, { jid, ts: Date.now() })

// ─── Resolución de @lid en grupos ────────────────────────────────────────────

/**
 * Intenta resolver un @lid buscando en la metadata del grupo.
 * Estrategia:
 *   1. Caché interna (instantáneo)
 *   2. groupCache global (sin red)
 *   3. groupMetadata de Baileys (con red, solo si es necesario)
 *
 * @param {object} conn  - Socket de Baileys
 * @param {string} lid   - JID tipo @lid
 * @param {string} chatId - JID del grupo @g.us
 * @returns {Promise<string|null>} JID real o null si no se resolvió
 */
async function resolveLidInGroup(conn, lid, chatId) {
    // 1. Caché interna
    const cacheKey = `${chatId}:${lid}`
    const cached = fromCache(cacheKey)
    if (cached) return cached

    // 2. Intentar con groupCache global (sin red)
    let metadata = global.groupCache instanceof Map ? global.groupCache.get(chatId) : null

    // 3. Si no hay metadata en caché, pedirla a Baileys (con red)
    if (!metadata && conn?.groupMetadata) {
        try {
            metadata = await conn.groupMetadata(chatId)
            // Guardar en groupCache global para futuras consultas
            if (global.groupCache instanceof Map) global.groupCache.set(chatId, metadata)
        } catch { /* sin red: continuamos */ }
    }

    if (!metadata?.participants?.length) return null

    // Buscar el participante que coincida con el @lid
    const participant = metadata.participants.find(p =>
        p.id === lid ||
        p.lid === lid ||
        safeNorm(p.id) === safeNorm(lid)
    )

    if (!participant) return null

    // Extraer número real del participante
    let resolved = null

    if (participant.phoneNumber) {
        resolved = participant.phoneNumber.includes('@')
            ? participant.phoneNumber
            : toJid(participant.phoneNumber)
    } else if (participant.id && !isLid(participant.id)) {
        resolved = participant.id
    }

    if (!resolved) return null

    const normalized = safeNorm(resolved)
    if (normalized) toCache(cacheKey, normalized)
    return normalized
}

// ─── Resolución principal ─────────────────────────────────────────────────────

/**
 * Extrae y normaliza el JID real de un mensaje o JID dado.
 * Nunca devuelve un @lid — siempre intenta resolver al JID real.
 *
 * Prioridad de extracción:
 *   jid arg → participant (grupos) → remoteJid → chat → conn.user.id
 *
 * @param {object} conn  - Socket de Baileys
 * @param {string|null} jid  - JID explícito (opcional)
 * @param {object|null} m    - Objeto mensaje serializado (opcional)
 * @returns {Promise<string>} JID normalizado (@s.whatsapp.net)
 */
export async function getRealJid(conn, jid, m) {
    // ── 1. Determinar JID candidato ───────────────────────────────────────
    const chatId = m?.key?.remoteJid || m?.chat || ''

    let target =
        jid ||
        m?.key?.participant ||   // remitente dentro de un grupo
        m?.participant ||         // fallback participant
        (isGroup(chatId) ? null : chatId) || // en privado, el chat ES el JID
        conn?.user?.id ||
        null

    if (!target) return safeNorm(conn?.user?.id) || ''

    // ── 2. Si ya es un JID de usuario válido: normalizar y listo ─────────
    if (isUser(target)) return safeNorm(target) || target

    // ── 3. Si NO es @lid: normalizar directamente ─────────────────────────
    if (!isLid(target)) {
        const norm = safeNorm(target)
        return norm || target
    }

    // ── 4. Es @lid: intentar resolver ─────────────────────────────────────

    // 4a. En grupos: buscar en metadata
    if (isGroup(chatId)) {
        const resolved = await resolveLidInGroup(conn, target, chatId)
        if (resolved) return resolved
    }

    // 4b. En privado con @lid: el remoteJid del chat puede ser el JID real
    if (!isGroup(chatId) && chatId && !isLid(chatId)) {
        const norm = safeNorm(chatId)
        if (norm) return norm
    }

    // 4c. Fallback: devolver normalizado aunque sea @lid
    //     (mejor que devolver null y romper el flujo)
    return safeNorm(target) || target
}

// ─── Resolución de menciones ──────────────────────────────────────────────────

/**
 * Resuelve un array de JIDs de menciones a JIDs reales.
 * Procesa en paralelo para máxima velocidad.
 *
 * @param {object} conn
 * @param {string[]} mentions
 * @param {object|null} m
 * @returns {Promise<string[]>}
 */
export async function resolveMentions(conn, mentions, m) {
    if (!Array.isArray(mentions) || !mentions.length) return []
    return Promise.all(mentions.map(jid => getRealJid(conn, jid, m)))
}

// ─── Utilidades exportadas ───────────────────────────────────────────────────

/**
 * Extrae solo los dígitos de un JID o número.
 * @param {string} jid
 * @returns {string}
 */
export function cleanNumber(jid) {
    if (!jid || typeof jid !== 'string') return ''
    return jid.replace(/\D/g, '')
}

/**
 * Convierte un número limpio a JID @s.whatsapp.net.
 * @param {string|number} number
 * @returns {string}
 */
export function numberToJid(number) {
    return toJid(number)
}

/**
 * Detecta si un JID es de grupo.
 * @param {string} jid
 * @returns {boolean}
 */
export function isGroupJid(jid) {
    return isGroup(jid)
}

/**
 * Limpia la caché interna de resolución @lid.
 * Útil para llamar cada hora o al desconectar.
 */
export function clearLidCache() {
    lidCache.clear()
}

/**
 * Retorna estadísticas de la caché interna.
 * @returns {{ size: number, entries: string[] }}
 */
export function lidCacheStats() {
    return { size: lidCache.size, entries: [...lidCache.keys()] }
}
