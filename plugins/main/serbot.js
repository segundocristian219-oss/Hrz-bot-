/**
 * ╔══════════════════════════════════════════╗
 * ║         SERBOT - SUB-BOT MANAGER         ║
 * ║    Baileys Official | WhatsApp Web API   ║
 * ╚══════════════════════════════════════════╝
 */

import pino from 'pino'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'
import chalk from 'chalk'
import {
    makeWASocket,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    Browsers,
    useMultiFileAuthState,
    jidNormalizedUser,
    isJidUser
} from '@whiskeysockets/baileys'
import { getRealJid, cleanNumber } from '../../lib/identifier.js'

// ─── Inicialización del estado global ───────────────────────────────────────
if (!(global.conns instanceof Array)) global.conns = []

// ─── Caché de reintentos de mensajes ────────────────────────────────────────
const msgRetryCache = new NodeCache({ stdTTL: 60, checkperiod: 120 })

// ─── Logger silencioso para Baileys ─────────────────────────────────────────
const silentLogger = pino({ level: 'silent' })

// ─── Constantes de configuración ────────────────────────────────────────────
const AUTH_BASE_DIR = path.join(process.cwd(), 'jadibts')
const RECONNECT_DELAY_MS = 10_000
const PAIRING_CODE_DELAY_MS = 3_000

// ─── Códigos de error críticos que eliminan la sesión ───────────────────────
const CRITICAL_DISCONNECT_REASONS = new Set([
    DisconnectReason.loggedOut,
    DisconnectReason.badSession,
    401,
    403,
    405
])

// ─── Mensajes descriptivos por razón de desconexión ─────────────────────────
const DISCONNECT_MESSAGES = {
    [DisconnectReason.loggedOut]:        'Sesión cerrada desde el teléfono.',
    [DisconnectReason.badSession]:       'Archivo de sesión corrupto.',
    [DisconnectReason.connectionClosed]: 'Conexión finalizada por el servidor.',
    [DisconnectReason.connectionLost]:   'Se perdió la señal de red.',
    [DisconnectReason.restartRequired]:  'Reinicio de conexión necesario.',
    [DisconnectReason.timedOut]:         'Tiempo de espera agotado.',
    401:                                 'No autorizado (token inválido).',
    403:                                 'Acceso denegado — posible baneo.',
    405:                                 'Código de emparejamiento vencido.'
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMANDO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const serbot = {
    name: 'serbot',
    alias: ['qr', 'code', 'subbot'],
    category: 'serbot',

    run: async (m, { conn, command, usedPrefix }) => {

        // ── Comando: solicitar código de vinculación ───────────────────────
        if (command === 'code') {
            let phoneNumber

            try {
                const realJid = await getRealJid(conn, null, m)
                phoneNumber = cleanNumber(realJid)
            } catch (err) {
                console.error(chalk.red('[SERBOT] Error obteniendo JID real:'), err?.message)
                return m.reply('> *⚠️ No se pudo determinar el número de origen.*')
            }

            if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 8) {
                return m.reply('> *⚠️ Número de teléfono inválido o demasiado corto.*')
            }

            const instruccion =
                `*───「 VINCULACIÓN 」───*\n\n` +
                `*Sigue estos pasos para activar tu sub-bot:*\n\n` +
                `*1.* Entra a *Ajustes* o *Configuración*\n` +
                `*2.* Selecciona *Dispositivos vinculados*\n` +
                `*3.* Toca en *Vincular un dispositivo*\n` +
                `*4.* Elige *"Vincular con número de teléfono"*\n\n` +
                `_Esperando código de vinculación..._`

            await conn.sendMessage(m.chat, {
                imageUrl: global.img?.(),
                text: instruccion
            }, { quoted: m }).catch(() => {})

            const result = await assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })

            if (!result) {
                return m.reply('> *❌ No se pudo generar el código. Intenta de nuevo.*')
            }

            if (result.status === 'already_connected') {
                return m.reply('> *✅ Este número ya tiene una sesión activa.*')
            }

            if (result.status === 'code') {
                return conn.sendMessage(m.chat, {
                    text:
                        `*───「 CÓDIGO DE VINCULACIÓN 」───*\n\n` +
                        `\`\`\`${result.code}\`\`\`\n\n` +
                        `_Ingresa este código en WhatsApp → Vincular dispositivo._`
                }, { quoted: m }).catch(() => {})
            }

            return m.reply('> *❌ Error inesperado al generar el código.*')
        }

        // ── Comando base: mostrar ayuda ────────────────────────────────────
        return m.reply(
            `*───「 SERBOT 」───*\n\n` +
            `Usa *${usedPrefix}code* para vincular tu sub-bot mediante código de emparejamiento.`
        )
    }
}

export default serbot

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL: CONECTAR / GENERAR CÓDIGO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Conecta un sub-bot o genera un código de emparejamiento.
 *
 * @param {{ phoneNumber: string, fromCommand?: boolean, m?: any, conn?: any }} options
 * @returns {Promise<{ status: 'code', code: string } | { status: 'already_connected' } | null>}
 */
export async function assistant_accessJadiBot(options) {
    const { phoneNumber, fromCommand = false } = options

    // ── Normalizar y validar el número ────────────────────────────────────
    const id = normalizePhoneNumber(phoneNumber)
    if (!id) {
        console.error(chalk.red('[SERBOT] Número inválido:', phoneNumber))
        return null
    }

    // ── Verificar si ya existe conexión activa ────────────────────────────
    const existingConn = findActiveConn(id)
    if (existingConn) {
        console.log(chalk.cyan(`[SUB-BOT] Ya conectado: ${id}`))
        return { status: 'already_connected' }
    }

    // ── Preparar carpeta de autenticación ─────────────────────────────────
    const authFolder = path.join(AUTH_BASE_DIR, id)
    ensureDir(authFolder)

    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(authFolder)

        // ── Crear socket de Baileys ────────────────────────────────────────
        const sock = makeWASocket({
            logger: silentLogger,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, silentLogger)
            },
            browser: Browsers.macOS('Chrome'),
            version,
            msgRetryCounterCache: msgRetryCache,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            printQRInTerminal: false,
            // Forzar uso de JID real (@s.whatsapp.net), nunca @lid
            generateHighQualityLinkPreview: false,
            patchMessageBeforeSending: (msg) => {
                // Garantizar que los JIDs nunca sean @lid
                return sanitizeLidJids(msg)
            }
        })

        sock.ev.on('creds.update', saveCreds)

        // ── Si no está registrado y es desde comando: solicitar código ─────
        if (!sock.authState.creds.registered && fromCommand) {
            return await requestPairingCode(sock, id, authFolder)
        }

        // ── Ya registrado: iniciar eventos ────────────────────────────────
        setupSubBotEvents(sock, authFolder)
        return { status: 'already_connected' }

    } catch (err) {
        console.error(chalk.red(`[SERBOT] Error inicializando socket para ${id}:`), err?.message || err)
        return null
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOLICITAR CÓDIGO DE EMPAREJAMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Espera que el socket se conecte y solicita el código de emparejamiento.
 * Fuerza el uso del JID real (@s.whatsapp.net).
 */
async function requestPairingCode(sock, id, authFolder) {
    return new Promise((resolve) => {
        let resolved = false
        let timeoutHandle

        const safeResolve = (value) => {
            if (resolved) return
            resolved = true
            clearTimeout(timeoutHandle)
            resolve(value)
        }

        // Timeout de seguridad: 30 segundos
        timeoutHandle = setTimeout(() => {
            console.warn(chalk.yellow(`[SUB-BOT] Timeout esperando código para ${id}`))
            safeResolve(null)
        }, 30_000)

        sock.ev.on('connection.update', async (update) => {
            const { connection, qr } = update

            // Ignorar si se ofrece QR (queremos solo código numérico)
            if (qr) return

            if (connection === 'connecting') {
                await sleep(PAIRING_CODE_DELAY_MS)
                try {
                    // Forzar número limpio sin @s.whatsapp.net ni @lid
                    const cleanId = forceRealJidNumber(id)
                    const rawCode = await sock.requestPairingCode(cleanId)
                    if (!rawCode) throw new Error('Código vacío recibido')

                    const formattedCode = rawCode.match(/.{1,4}/g)?.join('-') || rawCode
                    console.log(chalk.green(`[SUB-BOT] Código generado para ${cleanId}: ${formattedCode}`))

                    setupSubBotEvents(sock, authFolder)
                    safeResolve({ status: 'code', code: formattedCode })
                } catch (err) {
                    console.error(chalk.red(`[SUB-BOT] Error generando código para ${id}:`), err?.message)
                    safeResolve(null)
                }
            }

            if (connection === 'open') {
                // Se conectó antes de que pudiéramos dar el código
                setupSubBotEvents(sock, authFolder)
                safeResolve({ status: 'already_connected' })
            }

            if (connection === 'close') {
                safeResolve(null)
            }
        })
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTOS DEL SUB-BOT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configura los listeners de conexión y mensajes para un sub-bot activo.
 */
function setupSubBotEvents(sock, authFolder) {
    // Limpiar listeners previos para evitar duplicados
    sock.ev.removeAllListeners('connection.update')
    sock.ev.removeAllListeners('messages.upsert')

    const id = path.basename(authFolder)

    // ── Listener de conexión ──────────────────────────────────────────────
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, receivedPendingNotifications } = update

        if (connection === 'open') {
            console.log(chalk.bold.greenBright(`\n[SUB-BOT ✓] Conectado: ${id}`))

            if (receivedPendingNotifications) {
                console.log(chalk.gray(`[SUB-BOT] Notificaciones pendientes procesadas: ${id}`))
            }

            // Registrar en pool global evitando duplicados
            const userJid = safeNormalizeJid(sock.user?.id)
            if (userJid && !global.conns.some(c => safeNormalizeJid(c.user?.id) === userJid)) {
                global.conns.push(sock)
                console.log(chalk.cyan(`[POOL] Sub-bots activos: ${global.conns.length}`))
            }
        }

        if (connection === 'close') {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
            const reason = statusCode ?? DisconnectReason.connectionLost
            const mensaje = DISCONNECT_MESSAGES[reason] ?? `Desconexión con código: ${reason}`

            console.log(chalk.bold.yellow(`\n[SUB-BOT ✗] ${id}: ${mensaje}`))

            // Eliminar del pool global
            removeFromPool(sock)

            if (CRITICAL_DISCONNECT_REASONS.has(reason)) {
                // Error crítico: eliminar sesión y no reconectar
                console.log(chalk.bold.red(`[SISTEMA] Eliminando sesión inválida: ${id}`))
                deleteSessionFolder(authFolder)
            } else {
                // Error recuperable: reconectar después de delay
                console.log(chalk.gray(`[SUB-BOT] Reconectando en ${RECONNECT_DELAY_MS / 1000}s: ${id}`))
                setTimeout(
                    () => assistant_accessJadiBot({ phoneNumber: id, fromCommand: false }),
                    RECONNECT_DELAY_MS
                )
            }
        }
    })

    // ── Listener de mensajes entrantes ────────────────────────────────────
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate?.messages?.length) return

        try {
            const smsgPath  = path.join(process.cwd(), 'lib/serializer.js')
            const msgPath   = path.join(process.cwd(), 'lib/message.js')
            const timestamp = Date.now()

            const { smsg }    = await import(`file://${smsgPath}?v=${timestamp}`)
            const { message } = await import(`file://${msgPath}?v=${timestamp}`)

            for (const msg of chatUpdate.messages) {
                // Ignorar mensajes vacíos o propios
                if (!msg.message || msg.key?.fromMe) continue

                // Verificar que el JID no sea @lid antes de procesar
                if (isLidJid(msg.key?.remoteJid)) {
                    console.warn(chalk.yellow(`[SUB-BOT] JID @lid ignorado: ${msg.key.remoteJid}`))
                    continue
                }

                try {
                    const m = await smsg(sock, msg)
                    await message.call(sock, m, chatUpdate)
                } catch (msgErr) {
                    console.error(chalk.red(`[SUB-BOT] Error procesando mensaje en ${id}:`), msgErr?.message)
                }
            }
        } catch (importErr) {
            console.error(chalk.red(`[SUB-BOT] Error importando módulos en ${id}:`), importErr?.message)
        }
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normaliza un número de teléfono: elimina todo excepto dígitos.
 * @param {string} phoneNumber
 * @returns {string|null}
 */
function normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return null
    const clean = String(phoneNumber).replace(/\D/g, '')
    return clean.length >= 8 ? clean : null
}

/**
 * Fuerza un número limpio para requestPairingCode.
 * Elimina sufijos @s.whatsapp.net, @lid, @c.us, etc.
 * @param {string} id
 * @returns {string}
 */
function forceRealJidNumber(id) {
    return String(id)
        .replace(/@.*$/, '')   // elimina cualquier dominio @xxx
        .replace(/\D/g, '')    // deja solo dígitos
}

/**
 * Detecta si un JID es del tipo @lid (no soportado).
 * @param {string|null} jid
 * @returns {boolean}
 */
function isLidJid(jid) {
    return typeof jid === 'string' && jid.endsWith('@lid')
}

/**
 * Reemplaza JIDs @lid en un mensaje por una cadena vacía (sanea el mensaje).
 * @param {object} msg
 * @returns {object}
 */
function sanitizeLidJids(msg) {
    try {
        const str = JSON.stringify(msg)
        if (!str.includes('@lid')) return msg
        return JSON.parse(str.replace(/"[^"]*@lid"/g, '""'))
    } catch {
        return msg
    }
}

/**
 * Normaliza un JID de forma segura, devuelve null si falla.
 * @param {string|null|undefined} jid
 * @returns {string|null}
 */
function safeNormalizeJid(jid) {
    if (!jid || isLidJid(jid)) return null
    try {
        return jidNormalizedUser(jid)
    } catch {
        return null
    }
}

/**
 * Busca una conexión activa en el pool global por número.
 * @param {string} id - número limpio (solo dígitos)
 * @returns {object|null}
 */
function findActiveConn(id) {
    return global.conns.find(c => {
        const jid = safeNormalizeJid(c.user?.id)
        return jid && jid.startsWith(id + '@')
    }) ?? null
}

/**
 * Elimina un socket del pool global de conexiones.
 * @param {object} sock
 */
function removeFromPool(sock) {
    const userJid = safeNormalizeJid(sock.user?.id)
    if (!userJid) return
    const before = global.conns.length
    global.conns = global.conns.filter(c => safeNormalizeJid(c.user?.id) !== userJid)
    console.log(chalk.gray(`[POOL] Eliminado del pool. Activos: ${global.conns.length} (antes: ${before})`))
}

/**
 * Crea un directorio si no existe.
 * @param {string} dir
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

/**
 * Elimina la carpeta de sesión de forma segura.
 * @param {string} folder
 */
function deleteSessionFolder(folder) {
    try {
        if (fs.existsSync(folder)) {
            fs.rmSync(folder, { recursive: true, force: true })
            console.log(chalk.gray(`[SISTEMA] Carpeta eliminada: ${folder}`))
        }
    } catch (err) {
        console.error(chalk.red(`[SISTEMA] No se pudo eliminar ${folder}:`), err?.message)
    }
}

/**
 * Promesa de espera (sleep).
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
