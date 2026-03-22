import { existsSync, promises as fs } from 'fs'
import path from 'path'

const dsCommand = {
    name: 'ds',
    alias: ['cleansession', 'limpiar', 'ds'],
    category: 'owner',
    run: async (m, { conn, isROwner }) => {
        // Validación de Desarrollador
        if (!isROwner) return m.reply('> *Acceso denegado: Solo desarrolladores.*')

        // Ajuste dinámico de rutas
        const sessionPath = path.resolve(`./${global.authFolder || 'sessions'}/`)
        const tmpPath = path.resolve('./tmp/')
        let filesDeleted = 0

        try {
            await m.react('🧹')

            // Limpieza de Sesiones (Protegiendo creds.json)
            if (existsSync(sessionPath)) {
                const sessionFiles = await fs.readdir(sessionPath)
                for (const file of sessionFiles) {
                    if (file !== 'creds.json') { // Nunca borrar creds.json o el bot se apaga
                        try {
                            await fs.unlink(path.join(sessionPath, file))
                            filesDeleted++
                        } catch {
                            continue // Si el archivo está en uso, saltar al siguiente
                        }
                    }
                }
            }

            // Limpieza de Carpeta Temporal
            if (existsSync(tmpPath)) {
                const tmpFiles = await fs.readdir(tmpPath)
                for (const file of tmpFiles) {
                    try {
                        await fs.unlink(path.join(tmpPath, file))
                        filesDeleted++
                    } catch {
                        continue
                    }
                }
            }

            if (filesDeleted === 0) {
                await m.reply('> *Sistema limpio: No hay archivos residuales.*')
            } else {
                const report = `> ♛  *PURGA DE SISTEMA FINALIZADA*\n\n` +
                               `✦  *Archivos eliminados:* ${filesDeleted}\n` +
                               `✧  *Estado:* Memoria optimizada\n` +
                               `◈  *Origen:* ${global.authFolder || 'sessions'}\n\n` +
                               `*DEYLIN ELÍAC - SYSTEM*`
                await m.reply(report.trim())
            }

            await m.react('✅')

        } catch (err) {
            console.error('Error en DS Command:', err)
            await m.reply('> ✖ *Error crítico durante la purga.*')
            await m.react('❌')
        }
    }
}

export default dsCommand
