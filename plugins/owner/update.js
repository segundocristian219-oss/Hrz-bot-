import { exec } from 'child_process';

const runCmd = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);
        resolve(stdout);
    });
});

const updateCommand = {
    name: 'update',
    alias: ['actualizar', 'up', 'sync'],
    category: 'owner',
    rowner: true,
    run: async (m, { conn, args }) => {
        try {
            await m.react("🔄");
            const output = await runCmd(`git pull ${args[0] || ''}`);

            if (/Already up[ -]to[ -]date/i.test(output)) {
                await m.react("✅");
                return conn.sendMessage(m.chat, { text: '✧ *[ ✓ ] El sistema ya está en su versión más reciente.*' }, { quoted: m });
            }

            const updateMsg = `♛  *SISTEMA ACTUALIZADO* ♛\n\n✦ *[ 📦 ] Cambios detectados:*\n\`\`\`${output.trim()}\`\`\`\n\n◈ *APLICANDO CAMBIOS...*\n✧ *Los cambios se aplicarán en caliente sin reiniciar sockets.*`;

            await conn.sendMessage(m.chat, { text: updateMsg }, { quoted: m });
            await m.react("⚙️");

        } catch (error) {
            let status = '';
            try {
                status = await runCmd('git status --porcelain');
            } catch {
                status = 'Error al obtener estado del repositorio.';
            }

            const conflictMsg = status.trim()
                ? `◈ *⚠️ Conflictos detectados:*\n\n\`\`\`${status.trim()}\`\`\`\n\n✦ Resuelve los conflictos manualmente.`
                : error.toString();

            await conn.sendMessage(m.chat, { text: `💀 *ERROR CRÍTICO:* \n\n${conflictMsg}` }, { quoted: m });
            await m.react("❌");
        }
    }
};

export default updateCommand;
