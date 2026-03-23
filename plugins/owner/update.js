import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const updateCommand = {
    name: 'update',
    alias: ['actualizar', 'up'],
    category: 'owner',
    rowner: true,
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {
            const output = execSync('git pull ' + (args[0] || '')).toString();

            if (output.includes('Already up to date')) {
                return await conn.sendMessage(m.chat, { text: '*[ ✓ ] El sistema ya está en su versión más reciente.*' }, { quoted: m });
            }

            await conn.sendMessage(m.chat, { text: `*[ 📦 ] Cambios detectados:*\n\n${output}\n\n*Limpiando caché y refrescando plugins...*` }, { quoted: m });

            const getFiles = (dir) => {
                let results = [];
                const list = fs.readdirSync(dir);
                for (let file of list) {
                    file = path.join(dir, file);
                    const stat = fs.statSync(file);
                    if (stat && stat.isDirectory()) {
                        results = results.concat(getFiles(file));
                    } else if (file.endsWith('.js')) {
                        results.push(file);
                    }
                }
                return results;
            };

            const pluginFolder = path.join(process.cwd(), './plugins');
            const files = getFiles(pluginFolder);

            for (let file of files) {
                const resolvedPath = path.resolve(file);
                const pluginName = path.basename(file);

                const timestamp = Date.now();
                try {
                    const module = await import(`file://${resolvedPath}?update=${timestamp}`);
                    
                    
                    if (global.plugins instanceof Map) {
                        global.plugins.set(pluginName, module.default || module);
                    } else {
                        global.plugins[pluginName] = module.default || module;
                    }
                } catch (e) {
                    console.error(`Error al recargar ${pluginName}:`, e);
                }
            }

            await conn.sendMessage(m.chat, { text: '*[ ✅ ] Actualización aplicada con éxito. Plugins re-mapeados sin duplicados en memoria.*' }, { quoted: m });

        } catch (error) {
            let status = '';
            try {
                status = execSync('git status --porcelain').toString().trim();
            } catch { status = 'Error al obtener estado.'; }

            const conflictMsg = status ? `*⚠️ Conflictos detectados (posibles cambios locales):*\n\n${status}\n\n*Sugerencia:* Usa .await execSync("git reset --hard origin/main")` : error.message;
            await conn.sendMessage(m.chat, { text: `*❌ Error Crítico:* ${conflictMsg}` }, { quoted: m });
        }
    }
};

export default updateCommand;
