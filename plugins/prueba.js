import fs from 'fs';
import path from 'path';
import vm from 'node:vm';

const checkSyntax = {
    name: 'checksyntax',
    alias: ['debugcode'],
    category: 'owner',
    run: async (m, { conn }) => {
        const rootDir = process.cwd();
        let reports = [];
        let filesChecked = 0;

        const walk = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (file !== 'node_modules' && file !== '.git' && file !== 'sessions') {
                        walk(fullPath);
                    }
                } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
                    filesChecked++;
                    try {
                        const code = fs.readFileSync(fullPath, 'utf8');
                        new vm.Script(code, { 
                            filename: file,
                            displayErrors: true 
                        });
                    } catch (err) {
                        const relativePath = path.relative(rootDir, fullPath);
                        reports.push(`❌ *Archivo:* ${relativePath}\n⚠️ *Error:* ${err.message}`);
                    }
                }
            }
        };

        try {
            await m.reply('🔍 *Escaneando archivos en busca de errores de sintaxis...*');
            walk(rootDir);

            if (reports.length === 0) {
                return await conn.sendMessage(m.chat, { 
                    text: `✅ *Sin errores de sintaxis.*\n\nSe revisaron *${filesChecked}* archivos correctamente.` 
                }, { quoted: m });
            }

            const message = `🚨 *ERRORES ENCONTRADOS*\n\n${reports.join('\n\n---\n\n')}\n\nTotal revisado: ${filesChecked} archivos.`;
            await conn.sendMessage(m.chat, { text: message }, { quoted: m });

        } catch (e) {
            await m.reply('❌ Error en el comando: ' + e.message);
        }
    }
};

export default checkSyntax;
