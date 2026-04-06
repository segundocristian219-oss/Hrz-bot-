import { execSync } from 'child_process';

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

            // Avisamos que estamos procesando los cambios y que habrá un reinicio
            const updateMsg = `
\t\t\t\t♛  *SISTEMA ACTUALIZADO* ♛

✦ *[ 📦 ] Cambios detectados:*\n\`\`\`${output.trim()}\`\`\`

◈ *APLICANDO CAMBIOS...*
✧ *NOTA:* Reiniciando el sistema para cargar los nuevos comandos desde cero. El bot volverá en unos segundos.
`;
            await conn.sendMessage(m.chat, { text: updateMsg }, { quoted: m });
            await m.react("⚙️");

            // Le damos 2 segundos de respiro al bot para que alcance a enviar el mensaje 
            // de WhatsApp antes de "suicidarse" para reiniciarse.
            setTimeout(() => {
                if (process.send) {
                    process.send('reset');
                } else {
                    process.exit(1); 
                }
            }, 2000);

        } catch (error) {
            let status = '';
            try {
                // Si el pull falla, revisamos el status del git
                status = execSync('git status --porcelain').toString().trim();
            } catch { 
                status = 'Error al obtener estado del repositorio.'; 
            }

            const conflictMsg = status ? `◈ *⚠️ Conflictos detectados (posibles cambios locales):*\n\n\`\`\`${status}\`\`\`\n\n✦ *Sugerencia:* Usa un reset forzado para solucionarlo.` : error.message;
            
            await conn.sendMessage(m.chat, { text: `💀 *ERROR CRÍTICO:* \n\n${conflictMsg}` }, { quoted: m });
            await m.react("❌");
        }
    }
};

export default updateCommand;
