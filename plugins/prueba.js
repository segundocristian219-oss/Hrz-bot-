import fs from 'fs';
import path from 'path';
import { vm } from 'node:vm';

const checkSyntax = {
    name: 'checksyntax',
    alias: ['checkfix', 'debugcode'],
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
                        new vm.Script(code, { filename: file });
                    } catch (err) {
                        if (err instanceof SyntaxError) {
                            const relativePath = path.relative(rootDir, fullPath);
                            const stack = err.stack.split('\n');
                            const lineInfo = stack[0] || 'Desconocida';
                            
                            reports.push(`❌ *Archivo:* ${relativePath}\n⚠️ *Error:* ${err.message}\n📍 *Info:* ${lineInfo}`);
                        }
                    }
                }
            }
        };

        try {
            await m.reply('🔍 *Iniciando escaneo de sintaxis en todo el proyecto...*');
            walk(rootDir);

            if (reports.length === 0) {
                return await conn.sendMessage(m.chat, { 
                    text: `✅ *Escaneo completado.*\n\nSe revisaron *${filesChecked}* archivos y no se encontraron errores de sintaxis.` 
                }, { quoted: m });
            }

            const message = `🚨 *ERRORES DE SINTAXIS DETECTADOS*\n\n${reports.join('\n\n---\n\n')}\n\nTotal revisado: ${filesChecked} archivos.`;
            
            await conn.sendMessage(m.chat, { text: message }, { quoted: m });

        } catch (e) {
            console.error(e);
            await m.reply('❌ Error durante el escaneo: ' + e.message);
        }
    }
};

export default checkSyntax;
