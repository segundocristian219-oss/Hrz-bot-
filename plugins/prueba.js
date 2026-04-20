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

        const validateFile = (fullPath) => {
            const relativePath = path.relative(rootDir, fullPath);
            try {
                const code = fs.readFileSync(fullPath, 'utf8');
                if (!code.trim()) return;

                acorn.parse(code, {
                    ecmaVersion: 'latest',
                    sourceType: 'module'
                });
            } catch (err) {
                const code = fs.readFileSync(fullPath, 'utf8');
                const lines = code.split('\n');
                const errorLine = err.loc ? err.loc.line : 0;
                
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
📍 *Línea:* ${errorLine}

\`\`\`javascript
${snippet}
\`\`\``);
            }
        };

        const walk = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (['node_modules', '.git', 'sessions', 'tmp', '.npm'].includes(file)) continue;
                    walk(fullPath);
                } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
                    filesChecked++;
                    validateFile(fullPath);
                }
            }
        };

        try {
            await m.reply(`🔍 *Escaneando:* \`${path.basename(rootDir)}\`...`);
            
            walk(rootDir);

            if (reports.length === 0) {
                return await conn.sendMessage(m.chat, { 
                    text: `✅ *PROYECTO LIMPIO*\n\nArchivos revisados: *${filesChecked}*` 
                }, { quoted: m });
            }

            let header = `🚨 *ERRORES ENCONTRADOS (${reports.length})*\n\n`;
            let chunks = [];
            let currentChunk = header;

            for (let report of reports) {
                if ((currentChunk + report).length > 3500) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }
                currentChunk += report + '\n' + '─'.repeat(10) + '\n';
            }
            chunks.push(currentChunk + `\nTotal revisado: ${filesChecked}`);

            for (let text of chunks) {
                await conn.sendMessage(m.chat, { text }, { quoted: m });
            }

        } catch (e) {
            await m.reply('❌ Error: ' + e.message);
        }
    }
};

export default checkSyntax;
