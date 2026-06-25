import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { getRealJid } from '../../core/identifier.js'
import phoneNumber from 'google-libphonenumber'
import util from 'util'

const phoneUtil = phoneNumber.PhoneNumberUtil.getInstance()

export const profile = {
    category: 'social',
    commands: {
        p: {
            name: 'profile',
            alias: ['p', 'perfil'],
            run: async (m, { conn, text, participants }) => {
                try {
                    let mencionado = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.sender

                    let realJid
                    try {
                        realJid = await getRealJid(conn, mencionado, m)
                    } catch (errId) {
                        realJid = mencionado
                    }

                    const quien = realJid ? `${realJid.split('@')[0].split(':')[0]}@s.whatsapp.net` : mencionado
                    const nombreUsuario = m.pushName || 'Usuario'

                    let baseDatos = {}
                    try {
                        baseDatos = await global.User.findOne({ $or: [{ id: quien }, { lid: quien }] }).lean() || {}
                    } catch (errDb) {
                        baseDatos = {}
                    }

                    const datos = {
                        id: baseDatos.id || quien,
                        name: baseDatos.name || nombreUsuario,
                        marry: baseDatos.marry || '',
                        age: baseDatos.age || 0,
                        gender: baseDatos.gender || '',
                        identity: baseDatos.identity || '',
                        description: baseDatos.description || '',
                        hijos: Array.isArray(baseDatos.hijos) ? baseDatos.hijos : [],
                        padres: Array.isArray(baseDatos.padres) ? baseDatos.padres : []
                    }

                    let fotoPerfil = 'https://cdn.dix.lat/me/6e60ca0c-c1e8-46d2-ad62-6ea4c3af6e07.jpg'
                    try {
                        const urlOficial = await conn.profile(quien, 'image')
                        if (urlOficial) {
                            const controller = new AbortController()
                            const timeoutId = setTimeout(() => controller.abort(), 3000)

                            const res = await fetch(urlOficial, { method: 'HEAD', signal: controller.signal })
                            clearTimeout(timeoutId)

                            if (res.ok) {
                                fotoPerfil = urlOficial
                            }
                        }
                    } catch (e) {
                        fotoPerfil = 'https://cdn.dix.lat/me/6e60ca0c-c1e8-46d2-ad62-6ea4c3af6e07.jpg'
                    }

                    let pais = 'Desconocido'
                    try {
                        const numeroLimpio = quien.split('@')[0]
                        if (numeroLimpio) {
                            const parsedNumber = phoneUtil.parse('+' + numeroLimpio)
                            const regionCode = phoneUtil.getRegionCodeForNumber(parsedNumber)
                            pais = new Intl.DisplayNames(['es'], { type: 'region' }).of(regionCode) || 'Desconocido'
                        }
                    } catch (e) {
                        pais = 'Desconocido'
                    }

                    let infoPareja = 'ESTADO CIVIL: Soltero/a'
                    const menciones = [quien]

                    if (datos.marry && typeof datos.marry === 'string' && datos.marry.includes('@')) {
                        const parejaLimpia = `${datos.marry.split('@')[0].split(':')[0]}@s.whatsapp.net`
                        infoPareja = `CASADO/A CON: @${parejaLimpia.split('@')[0]}`
                        menciones.push(parejaLimpia)
                    }

                    let infoFamilia = ''
                    if (datos.padres.length > 0) {
                        const padresLimpios = datos.padres.filter(p => p && typeof p === 'string' && p.includes('@')).map(p => `${p.split('@')[0].split(':')[0]}@s.whatsapp.net`)
                        if (padresLimpios.length > 0) {
                            infoFamilia += `\n┝PADRES: ${padresLimpios.map(p => `@${p.split('@')[0]}`).join(' y ')}`
                            padresLimpios.forEach(p => menciones.push(p))
                        }
                    }

                    if (datos.hijos.length > 0) {
                        const hijosLimpios = datos.hijos.filter(h => h && typeof h === 'string' && h.includes('@')).map(h => `${h.split('@')[0].split(':')[0]}@s.whatsapp.net`)
                        if (hijosLimpios.length > 0) {
                            infoFamilia += `\n┝HIJOS: ${hijosLimpios.map(h => `@${h.split('@')[0]}`).join(', ')}`
                            hijosLimpios.forEach(h => menciones.push(h))
                        }
                    }

                    const usuarioLimpio = quien.split('@')[0].replace(/\D/g, '')
                    const botJidLimpio = conn.user.id.split('@')[0].replace(/\D/g, '')

                    let esDueño = false
                    if (global.owner && Array.isArray(global.owner)) {
                        esDueño = global.owner.some(dns => {
                            if (!dns) return false
                            const num = Array.isArray(dns) ? dns[0] : dns
                            if (!num) return false
                            return String(num).replace(/\D/g, '') === usuarioLimpio
                        })
                    }
                    if (!esDueño) {
                        esDueño = usuarioLimpio === botJidLimpio
                    }

                    let esAdminGrupo = false
                    if (participants && Array.isArray(participants)) {
                        esAdminGrupo = participants.some(p => {
                            if (!p || !p.id) return false
                            const pId = p.id.split('@')[0].replace(/\D/g, '')
                            return pId === usuarioLimpio && (p.admin === 'admin' || p.admin === 'superadmin')
                        })
                    }

                    let rango = 'Usuario'
                    if (esDueño) {
                        rango = 'Desarrollador / Owner'
                    } else if (esAdminGrupo) {
                        rango = 'Administrador'
                    }

                    const textoPerfil = `
\t\t\t\t\t\t *PERFIL DE USUARIO*

╭NOMBRE: ${datos.name}
├EDAD: ${datos.age > 0 ? datos.age : '--'} años
┝PAIS: ${pais}
┝ID: @${quien.split('@')[0]}
╰━━━━━━━━━━
╭GENERO: ${datos.gender || 'No definido'}
┝ORIENTACION: ${datos.identity || 'No definido'}
╰━━━━━━━━
╭RANGO: ${rango}
┝${infoPareja}${infoFamilia}
╰━━━━━
╭DESCRIPCION:
╰➠ ${datos.description || 'Sin descripción configurada.'}

`.trim()

                    const mencionesLimpias = [...new Set(menciones)].filter(jid => jid && typeof jid === 'string' && jid.includes('@')).map(jid => {
                        try {
                            return jidNormalizedUser(jid)
                        } catch (e) {
                            return jid
                        }
                    })

                    try {
                        await conn.sendMessage(m.chat, { 
                            image: { url: fotoPerfil }, 
                            caption: textoPerfil,
                            mentions: mencionesLimpias
                        }, { quoted: m })
                    } catch (mediaError) {
                        await conn.sendMessage(m.chat, { 
                            text: textoPerfil,
                            mentions: mencionesLimpias
                        }, { quoted: m })
                    }

                } catch (errorCompleto) {
                    const reportError = `> ❌ *REPORTE DE DEPURACIÓN COMPLETA*

*Mensaje:* ${errorCompleto.message}

*Stack Trace Completo:*
\`\`\`${util.format(errorCompleto.stack || errorCompleto)}\`\`\``

                    try {
                        await conn.reply(m.chat, reportError, m)
                    } catch (e) {
                        console.error(errorCompleto)
                    }
                }
            }
        }
    }
}