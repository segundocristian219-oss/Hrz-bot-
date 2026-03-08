import { existsSync, promises as fs } from 'fs'
import path from 'path'

const dsCommand = {
    name: 'ds',
    alias: ['cleansession', 'limpiar'],
    category: 'owner',
    run: async (m, { conn, isMainBot, isROwner }) => {
       /* if (!isMainBot) {
            return m.reply('> *Este comando solo puede ser ejecutado por el bot principal.*')
        }*/

        if (!isROwner) {
            return m.reply('> *Este comando solo puede ser ejecutado por los desarrolladores.*')
        }

        const sessionPath = `./${global.sessions || 'sessions'}/`
        const tmpPath = './tmp/'
        let filesDeleted = 0

        try {
            if (existsSync(sessionPath)) {
                const sessionFiles = await fs.readdir(sessionPath)
                for (const file of sessionFiles) {
                    if (file !== 'creds.json') {
                        await fs.unlink(path.join(sessionPath, file))
                        filesDeleted++
                    }
                }
            }

            if (existsSync(tmpPath)) {
                const tmpFiles = await fs.readdir(tmpPath)
                for (const file of tmpFiles) {
                    await fs.unlink(path.join(tmpPath, file))
                    filesDeleted++
                }
            }

            if (filesDeleted === 0) {
                await m.reply('> *No se encontraron archivos prescindibles para eliminar.*')
            } else {
                await m.reply(`> *𝗟𝗜𝗠𝗣𝗜𝗘𝗭𝗔 𝗣𝗥𝗢𝗙𝗨𝗡𝗗𝗔 𝗙𝗜𝗡𝗔𝗟𝗜𝗭𝗔𝗗𝗔*\n\n*Archivos eliminados:* ${filesDeleted}\n*Estado:* Memoria optimizada y sesiones huérfanas purgadas.`)
            }

        } catch (err) {
            console.error(err)
            await m.reply('> *Error crítico durante la purga de archivos.*')
        }
    }
}

export default dsCommand
