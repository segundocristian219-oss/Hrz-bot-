import fetch from "node-fetch";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

const uploadCommand = {
    name: 'geturl',
    alias: ['tourl', 'img'],
    category: 'tools',
    run: async (conn, m, { command }) => {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        const sendReaction = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
        const sendMsg = (text) => conn.sendMessage(m.chat, { text: text }, { quoted: m });

        if (!mime || !/image/.test(mime)) {
            return sendMsg(`> ✰⋆͙̈ Responde a una imagen con el comando ➠ *${command}*`);
        }

        try {
            await sendReaction('🕒');

            const buffer = await quoted.download();
            if (!buffer) {
                await sendReaction('❌');
                return sendMsg("> ⚔ Error al obtener el buffer.");
            }

            const type = await fileTypeFromBuffer(buffer);
            const fileName = `img_${Date.now()}.${type?.ext || 'jpg'}`;

            const formData = new FormData();
            const blob = new Blob([buffer], { type: mime });
            formData.append('file', blob, fileName);

            const response = await fetch('https://api.dix.lat/upload1', {
                method: 'POST',
                body: formData,
                headers: { 'User-Agent': 'Drive-Client' }
            });

            const json = await response.json();

            if (json.status && json.data) {
                const result = json.data;
                let txt = `▢ *ID:* ${result.id}\n`;
                txt += `▢ *URL:* ${result.url}\n`;
                txt += `▢ *PESO:* ${result.size}\n`;
                txt += `▢ *MIME:* ${result.mime}`;

                await sendMsg(txt);
                await sendReaction('✅');
            } else {
                await sendReaction('❌');
                sendMsg("> ⚔ Error en la respuesta del servidor.");
            }
        } catch (e) {
            await sendReaction('❌');
            sendMsg(`> ⚔ Error: ${e.message}`);
        }
    }
};

export default uploadCommand;
