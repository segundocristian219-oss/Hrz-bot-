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
    jidNormalizedUser
} from '@whiskeysockets/baileys'
import { getRealJid, cleanNumber } from '../../lib/identifier.js'

if (!(global.conns instanceof Array)) global.conns = []

const msgRetryCache = new NodeCache({ stdTTL: 60, checkperiod: 120 })
const silentLogger = pino({ level: 'silent' })

const AUTH_BASE_DIR = path.join(process.cwd(), 'jadibts')
const RECONNECT_DELAY_MS = 10000
const PAIRING_CODE_DELAY_MS = 3000

const CRITICAL_DISCONNECT_REASONS = new Set([
    DisconnectReason.loggedOut,
    DisconnectReason.badSession,
    401, 403, 405
])

const DISCONNECT_MESSAGES = {
    [DisconnectReason.loggedOut]: 'Sesión cerrada desde el teléfono.',
    [DisconnectReason.badSession]: 'Archivo de sesión corrupto.',
    [DisconnectReason.connectionClosed]: 'Conexión finalizada por el servidor.',
    [DisconnectReason.connectionLost]: 'Se perdió la señal de red.',
    [DisconnectReason.restartRequired]: 'Reinicio de conexión necesario.',
    [DisconnectReason.timedOut]: 'Tiempo de espera agotado.',
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
                return m.reply('> *⚠️ No se pudo determinar el número de origen.*')
            }

            if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 8) {
                return m.reply('> *⚠️ Número de teléfono inválido o demasiado corto.*')
            }

            const instruccion = `*───「 VINCULACIÓN 」───*\n\n` +
                `*Sigue estos pasos para activar tu sub-bot:*\n\n` +
                `*1.* Entra a *Ajustes*\n` +
                `*2.* Selecciona *Dispositivos vinculados*\n` +
                `*3.* Toca en *Vincular un dispositivo*\n` +
                `*4.* Elige *"Vincular con número de teléfono"*\n\n` +
                `_Generando código..._`

            await conn.sendMessage(m.chat, { text: instruccion }, { quoted: m }).catch(() => {})

            const result = await assistant_accessJadiBot({ m, conn, phoneNumber, fromCommand: true })

            if (!result) return m.reply('> *❌ No se pudo generar el código.*')
            if (result.status === 'already_connected') return m.reply('> *✅ Ya tienes una sesión activa.*')
            if (result.status === 'code') {
                return conn.sendMessage(m.chat, {
                    text: `*───「 CÓDIGO DE VINCULACIÓN 」───*\n\n\`\`\`${result.code}\`\`\`\n\n_Ingresa este código en tu WhatsApp._`
                }, { quoted: m }).catch(() => {})
            }
        }
        return m.reply(`Usa *${usedPrefix}code*`)
    }
}
export default serbot

export async function assistant_accessJadiBot(options) {
    const { phoneNumber, fromCommand = false } = options
    const id = normalizePhoneNumber(phoneNumber)
    if (!id) return null

    const existingConn = findActiveConn(id)
    if (existingConn) return { status: 'already_connected' }

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
        return null
    }
}

async function requestPairingCode(sock, id, authFolder) {
    return new Promise((resolve) => {
        let resolved = false
        const timeoutHandle = setTimeout(() => safeResolve(null), 40000)

        const safeResolve = (value) => {
            if (resolved) return
            resolved = true
            clearTimeout(timeoutHandle)
            resolve(value)
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, qr } = update
            if (qr) return
            if (connection === 'connecting') {
                await sleep(PAIRING_CODE_DELAY_MS)
                try {
                    const cleanId = forceRealJidNumber(id)
                    const rawCode = await sock.requestPairingCode(cleanId)
                    if (!rawCode) throw new Error()
                    setupSubBotEvents(sock, authFolder)
                    safeResolve({ status: 'code', code: rawCode.match(/.{1,4}/g)?.join('-') || rawCode })
                } catch { safeResolve(null) }
            }
            if (connection === 'open') safeResolve({ status: 'already_connected' })
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
            console.log(chalk.bold.greenBright(`[SUB-BOT] Conectado: ${id}`))
            const userJid = safeNormalizeJid(sock.user?.id)
            if (userJid && !global.conns.some(c => safeNormalizeJid(c.user?.id) === userJid)) global.conns.push(sock)
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || DisconnectReason.connectionLost
            removeFromPool(sock)
            if (CRITICAL_DISCONNECT_REASONS.has(reason)) {
                deleteSessionFolder(authFolder)
            } else {
                setTimeout(() => assistant_accessJadiBot({ phoneNumber: id, fromCommand: false }), RECONNECT_DELAY_MS)
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate?.messages?.length) return
        try {
            const smsgPath = path.join(process.cwd(), 'lib/serializer.js')
            const msgPath = path.join(process.cwd(), 'lib/message.js')
            const { smsg } = await import(`file://${smsgPath}?v=${Date.now()}`)
            const { message } = await import(`file://${msgPath}?v=${Date.now()}`)
            for (const msg of chatUpdate.messages) {
                if (!msg.message || msg.key?.fromMe || isLidJid(msg.key?.remoteJid)) continue
                const m = await smsg(sock, msg)
                await message.call(sock, m, chatUpdate)
            }
        } catch {}
    })
}

function normalizePhoneNumber(phoneNumber) {
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
        return str.includes('@lid') ? JSON.parse(str.replace(/"[^"]*@lid"/g, '""')) : msg
    } catch { return msg }
}

function safeNormalizeJid(jid) {
    if (!jid || isLidJid(jid)) return null
    try { return jidNormalizedUser(jid) } catch { return null }
}

function findActiveConn(id) {
    return global.conns.find(c => safeNormalizeJid(c.user?.id)?.startsWith(id + '@')) || null
}

function removeFromPool(sock) {
    const userJid = safeNormalizeJid(sock.user?.id)
    if (userJid) global.conns = global.conns.filter(c => safeNormalizeJid(c.user?.id) !== userJid)
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function deleteSessionFolder(folder) {
    try { if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true }) } catch {}
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
