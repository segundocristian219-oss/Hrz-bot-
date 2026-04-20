import fs from 'fs';
import path from 'path';
import * as acorn from 'acorn';

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
                        acorn.parse(code, {
                            ecmaVersion: 'latest',
                            sourceType: 'module'
                        });
                    } catch (err) {
                        const relativePath = path.relative(rootDir, fullPath);
                        const loc = err.loc ? `Línea: ${err.loc.line}, Columna: ${err.loc.column}` : 'Desconocida';
                        reports.push(`❌ *Archivo:* ${relativePath}\n⚠️ *Error:* ${err.message}\n📍 *Ubicación:* ${loc}`);
                    }
                }
            }
        };

        try {
            await m.reply('🔍 *Iniciando escaneo real de sintaxis (ESM)...*');
            walk(rootDir);

            if (reports.length === 0) {
                return await conn.sendMessage(m.chat, { 
                    text: `✅ *Proyecto limpio.*\n\nSe revisaron *${filesChecked}* archivos y todos cumplen con la sintaxis.` 
                }, { quoted: m });
            }

            const message = `🚨 *ERRORES DE SINTAXIS REALES*\n\n${reports.join('\n\n---\n\n')}\n\nTotal revisado: ${filesChecked} archivos.`;
            await conn.sendMessage(m.chat, { text: message }, { quoted: m });

        } catch (e) {
            await m.reply('❌ Error en el escáner: ' + e.message);
        }
    }
};

export default checkSyntax;
