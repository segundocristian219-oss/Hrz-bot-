import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { getRealJid } from './identifier.js'
import util from 'util'

export async function events(conn, m, participants) {
    if (!m.messageStubType && !m.message?.pollCreationMessage && !m.message?.pollUpdateMessage) return true

    const st = m.messageStubType
    const isPollCreation = m.message?.pollCreationMessage
    const isPollUpdate = m.message?.pollUpdateMessage

    if (isPollCreation || isPollUpdate || st === 141) {
        console.log('┏━━━━━━━━ DEBUG POLL/EVENT ━━━━━━━━┓')
        console.log('┃ TIPO STUB:', st)
        console.log('┃ CHAT:', m.chat)
        console.log('┃ SENDER:', m.sender)
        
        if (isPollCreation) {
            console.log('┃ ESTRUCTURA CREACION:', util.inspect(m.message.pollCreationMessage, { depth: null, colors: true }))
        }

        if (isPollUpdate) {
            console.log('┃ ESTRUCTURA VOTO (UPDATE):', util.inspect(m.message.pollUpdateMessage, { depth: null, colors: true }))
            console.log('┃ POLL KEY:', util.inspect(m.message.pollUpdateMessage.pollCreationMessageKey, { depth: null, colors: true }))
        }

        if (m.messageStubParameters) {
            console.log('┃ PARAMS:', util.inspect(m.messageStubParameters, { depth: null, colors: true }))
        }
        console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛')

        if (global.owner.some(([num]) => num.replace(/\D/g, '') === (m.sender || '').split('@')[0])) {
            const report = `*DEBUG EVENT*\n*Stub:* ${st}\n*PollUpdate:* ${!!isPollUpdate}\n*PollCreation:* ${!!isPollCreation}\n\n*Full Raw:*`
            await conn.sendMessage(m.chat, { 
                text: report + '\n' + util.inspect(m, { depth: 2 }).slice(0, 3000) 
            })
        }
    }

    return true
}
