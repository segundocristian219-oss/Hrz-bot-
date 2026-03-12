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
    jidNormalizedUser
} from '@whiskeysockets/baileys'
import { getRealJid, cleanNumber } from '../../lib/identifier.js'

if (!(global.conns instanceof Array)) global.conns = []

const msgRetryCache = new NodeCache({ stdTTL: 60, checkperiod: 120 })
const silentLogger = pino({ level: 'silent' })
const AUTH_BASE_DIR = path.join(process.cwd(), 'jadibts')
const RECONNECT_DELAY_MS = 10_000
const PAIRING_CODE_DELAY_MS = 3_000

const CRITICAL_DISCONNECT_REASONS = new Set([
    DisconnectReason.loggedOut,
    DisconnectReason.badSession,
    401, 403, 405
])

const DISCONNECT_MESSAGES = {
    [DisconnectReason.loggedOut]:        'Sesión cerrada desde el teléfono.',
    [DisconnectReason.badSession]:       'Archivo de sesión corrupto.',
    [DisconnectReason.connectionClosed]: 'Conexión finalizada por el servidor.',
    [DisconnectReason.connectionLost]:   'Se perdió la señal de red.',
    [DisconnectReason.restartRequired]:  'Reinicio de conexión necesario.',
    [DisconnectReason.timedOut]:         'Tiempo de espera agotado.',
    401: 'No autorizado (token inválido).',
    403: 'Acceso denegado — posible baneo.',
    405: 'Código de emparejamiento vencido.'
}

const serbot = {
    name: 'serbot',
    alias: ['qr', 'code', 'subbot'],
    category: 'serbot',

    run: async (m, { conn, command, usedPrefix }) => {
        if (command === 'code') {
            let phoneNumber

            try {
                const realJid = await getRealJid(conn, null, m)
                phoneNumber = cleanNumber(realJid)
            } catch (err) {
                console.error(chalk.red('[SERBOT] Error obteniendo JID:'), err?.message)
                return m.reply('> *⚠️ No se pudo determinar el número de origen.*')
            }

            if (!phoneNumber || phoneNumber.length < 8) {
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

            if (!result) return m.reply('> *❌ No se pudo generar el código. Intenta de nuevo.*')
            if (result.status === 'already_connected') return m.reply('> *✅ Este número ya tiene una sesión activa.*')
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

        return m.reply(
            `*───「 SERBOT 」───*\n\n` +
            `Usa *${usedPrefix}code* para vincular tu sub-bot.`
        )
    }
}

export default serbot

export async function assistant_accessJadiBot(options) {
    const { phoneNumber, fromCommand = false } = options

    const id = normalizePhoneNumber(phoneNumber)
    if (!id) {
        console.error(chalk.red('[SERBOT] Número inválido:'), phoneNumber)
        return null
    }

    const existingConn = findActiveConn(id)
    if (existingConn) {
        console.log(chalk.cyan(`[SUB-BOT] Ya conectado: ${id}`))
        return { status: 'already_connected' }
    }

    const authFolder = path.join(AUTH_BASE_DIR, id)
    ensureDir(authFolder)

    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(authFolder)

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
            generateHighQualityLinkPreview: false,
            patchMessageBeforeSending: (msg) => sanitizeLidJids(msg)
        })

        sock.ev.on('creds.update', saveCreds)

        if (!sock.authState.creds.registered && fromCommand) {
            return await requestPairingCode(sock, id, authFolder)
        }

        setupSubBotEvents(sock, authFolder)
        return { status: 'already_connected' }

    } catch (err) {
        console.error(chalk.red(`[SERBOT] Error inicializando ${id}:`), err?.message || err)
        return null
    }
}

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

        timeoutHandle = setTimeout(() => {
            console.warn(chalk.yellow(`[SUB-BOT] Timeout esperando código: ${id}`))
            safeResolve(null)
        }, 30_000)

        sock.ev.on('connection.update', async (update) => {
            const { connection, qr } = update
            if (qr) return

            if (connection === 'connecting') {
                await sleep(PAIRING_CODE_DELAY_MS)
                try {
                    const cleanId = forceRealJidNumber(id)
                    const rawCode = await sock.requestPairingCode(cleanId)
                    if (!rawCode) throw new Error('Código vacío')
                    const formattedCode = rawCode.match(/.{1,4}/g)?.join('-') || rawCode
                    console.log(chalk.green(`[SUB-BOT] Código para ${cleanId}: ${formattedCode}`))
                    setupSubBotEvents(sock, authFolder)
                    safeResolve({ status: 'code', code: formattedCode })
                } catch (err) {
                    console.error(chalk.red(`[SUB-BOT] Error código ${id}:`), err?.message)
                    safeResolve(null)
                }
            }

            if (connection === 'open') {
                setupSubBotEvents(sock, authFolder)
                safeResolve({ status: 'already_connected' })
            }

            if (connection === 'close') safeResolve(null)
        })
    })
}

function setupSubBotEvents(sock, authFolder) {
    sock.ev.removeAllListeners('connection.update')
    sock.ev.removeAllListeners('messages.upsert')

    const id = path.basename(authFolder)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log(chalk.bold.greenBright(`\n[SUB-BOT ✓] Conectado: ${id}`))
            const userJid = safeNormalizeJid(sock.user?.id)
            if (userJid && !global.conns.some(c => safeNormalizeJid(c.user?.id) === userJid)) {
                global.conns.push(sock)
                console.log(chalk.cyan(`[POOL] Sub-bots activos: ${global.conns.length}`))
            }
        }

        if (connection === 'close') {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
            const reason = statusCode ?? DisconnectReason.connectionLost
            const mensaje = DISCONNECT_MESSAGES[reason] ?? `Código: ${reason}`
            console.log(chalk.bold.yellow(`\n[SUB-BOT ✗] ${id}: ${mensaje}`))
            removeFromPool(sock)

            if (CRITICAL_DISCONNECT_REASONS.has(reason)) {
                console.log(chalk.bold.red(`[SISTEMA] Eliminando sesión: ${id}`))
                deleteSessionFolder(authFolder)
            } else {
                console.log(chalk.gray(`[SUB-BOT] Reconectando en ${RECONNECT_DELAY_MS / 1000}s: ${id}`))
                setTimeout(() => assistant_accessJadiBot({ phoneNumber: id, fromCommand: false }), RECONNECT_DELAY_MS)
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate?.messages?.length) return

        let smsg, message
        try {
            const smsgPath = path.join(process.cwd(), 'lib/serializer.js')
            const msgPath  = path.join(process.cwd(), 'lib/message.js')
            const ts = Date.now()
            ;({ smsg }    = await import(`file://${smsgPath}?v=${ts}`))
            ;({ message } = await import(`file://${msgPath}?v=${ts}`))
        } catch (err) {
            console.error(chalk.red(`[SUB-BOT] Error importando módulos ${id}:`), err?.message)
            return
        }

        for (const msg of chatUpdate.messages) {
            if (!msg.message || msg.key?.fromMe) continue
            if (isLidJid(msg.key?.remoteJid)) continue

            try {
                const m = await smsg(sock, msg)
                await message.call(sock, m, chatUpdate)
            } catch (err) {
                console.error(chalk.red(`[SUB-BOT] Error procesando msg ${id}:`), err?.message)
            }
        }
    })
}

function normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return null
    const clean = String(phoneNumber).replace(/\D/g, '')
    return clean.length >= 8 ? clean : null
}

function forceRealJidNumber(id) {
    return String(id).replace(/@.*$/, '').replace(/\D/g, '')
}

function isLidJid(jid) {
    return typeof jid === 'string' && jid.endsWith('@lid')
}

function sanitizeLidJids(msg) {
    try {
        const str = JSON.stringify(msg)
        if (!str.includes('@lid')) return msg
        return JSON.parse(str.replace(/"[^"]*@lid"/g, '""'))
    } catch {
        return msg
    }
}

function safeNormalizeJid(jid) {
    if (!jid || isLidJid(jid)) return null
    try { return jidNormalizedUser(jid) } catch { return null }
}

function findActiveConn(id) {
    return global.conns.find(c => {
        const jid = safeNormalizeJid(c.user?.id)
        return jid && jid.startsWith(id + '@')
    }) ?? null
}

function removeFromPool(sock) {
    const userJid = safeNormalizeJid(sock.user?.id)
    if (!userJid) return
    global.conns = global.conns.filter(c => safeNormalizeJid(c.user?.id) !== userJid)
    console.log(chalk.gray(`[POOL] Activos: ${global.conns.length}`))
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function deleteSessionFolder(folder) {
    try {
        if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true })
    } catch (err) {
        console.error(chalk.red(`[SISTEMA] No se pudo eliminar ${folder}:`), err?.message)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
