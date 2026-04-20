import fs from 'fs';
import path from 'path';
import * as acorn from 'acorn';
import chalk from 'chalk';

const checkSyntax = {
    name: 'checksyntax',
    alias: ['debugcode', 'revisar'],
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
                    if (['node_modules', '.git', 'sessions', 'tmp'].includes(file)) continue;
                    walk(fullPath);
                } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
                    filesChecked++;
                    const code = fs.readFileSync(fullPath, 'utf8');
                    try {
                        acorn.parse(code, {
                            ecmaVersion: 'latest',
                            sourceType: 'module'
                        });
                    } catch (err) {
                        const relativePath = path.relative(rootDir, fullPath);
                        const lines = code.split('\n');
                        const errorLine = err.loc ? err.loc.line : 0;
                        
                        // Extraer el fragmento del error para mostrarlo
                        let snippet = '';
                        if (errorLine > 0) {
                            const start = Math.max(0, errorLine - 2);
                            const end = Math.min(lines.length, errorLine + 1);
                            snippet = lines.slice(start, end)
                                .map((l, i) => `${start + i + 1 === errorLine ? '➔ ' : '  '}${start + i + 1} | ${l}`)
                                .join('\n');
                        }

                        reports.push(`📄 *ARCHIVO:* \`${relativePath}\`
⚠️ *ERROR:* \`${err.message}\`
📍 *POSICIÓN:* Línea ${err.loc?.line}, Columna ${err.loc?.column}

💻 *EXTRACTO:*
\`\`\`javascript
${snippet}
\`\`\``);
                    }
                }
            }
        };

        try {
            await m.reply('🔍 *Escaneando archivos en busca de SyntaxErrors...*');
            walk(rootDir);

            if (reports.length === 0) {
                return await conn.sendMessage(m.chat, { 
                    text: `✅ *PROYECTO LIMPIO*\n\nSe revisaron *${filesChecked}* archivos sin errores de sintaxis.` 
                }, { quoted: m });
            }

            // Dividir en varios mensajes si el reporte es muy largo
            const header = `🚨 *ERRORES ENCONTRADOS (${reports.length})*\n\n`;
            let currentMessage = header;

            for (let report of reports) {
                if ((currentMessage + report).length > 4000) {
                    await conn.sendMessage(m.chat, { text: currentMessage }, { quoted: m });
                    currentMessage = '';
                }
                currentMessage += report + '\n\n' + '─'.repeat(15) + '\n\n';
            }

            if (currentMessage) {
                await conn.sendMessage(m.chat, { text: currentMessage }, { quoted: m });
            }

        } catch (e) {
            await m.reply('❌ Error crítico en el escáner: ' + e.message);
        }
    }
};

export default checkSyntax;
