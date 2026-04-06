import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const updateCommand = {
    name: 'update',
    alias: ['actualizar', 'up', 'sync'],
    category: 'owner',
    rowner: true,
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {
            await m.react("🔄");
            
            // Ejecutamos el git pull
            const output = execSync('git pull ' + (args[0] || '')).toString();

            // Si no hay cambios, avisamos y cortamos la ejecución
            if (output.includes('Already up to date')) {
                await m.react("✅");
                return await conn.sendMessage(m.chat, { text: '✧ *[ ✓ ] El sistema ya está en su versión más reciente.*' }, { quoted: m });
            }

            // Avisamos que estamos procesando los cambios
            await conn.sendMessage(m.chat, { text: `✦ *[ 📦 ] Cambios detectados:*\n\n\`\`\`${output.trim()}\`\`\`\n\n◈ *Limpiando caché y refrescando módulos en tiempo real...*` }, { quoted: m });

            // Función recursiva para obtener todos los .js
            const getFiles = (dir) => {
                let results = [];
                const list = fs.readdirSync(dir);
                for (let file of list) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat && stat.isDirectory()) {
                        results = results.concat(getFiles(fullPath));
                    } else if (file.endsWith('.js')) {
                        results.push(fullPath);
                    }
                }
                return results;
            };

            const pluginFolder = path.join(process.cwd(), './plugins');
            const files = getFiles(pluginFolder);
            let reloadedCount = 0;

            for (let file of files) {
                const resolvedPath = path.resolve(file);
                const pluginName = path.basename(file);
                const timestamp = Date.now();
                
                try {
                    // Importación dinámica evadiendo la caché nativa de Node.js
                    const moduleUrl = `file://${resolvedPath}?update=${timestamp}`;
                    const module = await import(moduleUrl);
                    
                    // Borramos la referencia antigua antes de asignar la nueva (CLAVE PARA HOT-RELOAD)
                    if (global.plugins instanceof Map) {
                        if (global.plugins.has(pluginName)) global.plugins.delete(pluginName);
                        global.plugins.set(pluginName, module.default || module);
                    } else {
                        if (global.plugins[pluginName]) delete global.plugins[pluginName];
                        global.plugins[pluginName] = module.default || module;
                    }
                    
                    reloadedCount++;
                } catch (e) {
                    console.error(`❌ Error al recargar el plugin ${pluginName}:`, e);
                }
            }

            const successMsg = `
\t\t\t\t♛  *SISTEMA ACTUALIZADO* ♛

◈ *ESTADO:* Actualización aplicada con éxito.
✦ *PLUGINS CARGADOS:* ${reloadedCount} archivos.
✧ *NOTA:* Plugins re-mapeados sin duplicados en memoria. ¡No es necesario reiniciar!
`;
            await conn.sendMessage(m.chat, { text: successMsg }, { quoted: m });
            await m.react("✅");

        } catch (error) {
            let status = '';
            try {
                // Si el pull falla, revisamos el status del git para ver por qué
                status = execSync('git status --porcelain').toString().trim();
            } catch { 
                status = 'Error al obtener estado del repositorio.'; 
            }

            const conflictMsg = status ? `◈ *⚠️ Conflictos detectados (posibles cambios locales):*\n\n\`\`\`${status}\`\`\`\n\n✦ *Sugerencia:* Usa el comando \`execSync("git reset --hard origin/main")\` para forzar la actualización.` : error.message;
            
            await conn.sendMessage(m.chat, { text: `💀 *ERROR CRÍTICO:* \n\n${conflictMsg}` }, { quoted: m });
            await m.react("❌");
        }
    }
};

export default updateCommand;
