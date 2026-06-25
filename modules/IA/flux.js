import axios from 'axios';

export const fluxCommand = {
    category: 'ai',
    commands: {
        flux: {
            name: 'flux',
            alias: ['fluxpro', 'flux2', 'imagine'],
            run: async (m, { conn, text }) => {
                if (!text) return conn.sendMessage(m.chat, { text: '*INGRESE UN TEXTO PARA GENERAR LA IMAGEN*' }, { quoted: m });

                await m.react('⏳');

                try {
                    const initUrl = `https://omegatech-api.dixonomega.tech/api/ai/flux-pro2?prompt=${encodeURIComponent(text)}`;
                    const { data: initRes } = await axios.get(initUrl);

                    if (!initRes.success || !initRes.task_id) {
                        throw new Error('TASK_START_FAILED');
                    }

                    const taskId = initRes.task_id;
                    let resultUrl = null;
                    let attempts = 0;
                    const maxAttempts = 20;

                    while (!resultUrl && attempts < maxAttempts) {
                        await new Promise(r => setTimeout(r, 4000));

                        const checkUrl = `https://omegatech-api.dixonomega.tech/api/ai/nano-banana2-result?task_id=${taskId}`;
                        const { data: check } = await axios.get(checkUrl);

                        if (check.status === 'completed' && check.image_url) {
                            resultUrl = check.image_url;
                            break;
                        }

                        if (check.status === 'failed') {
                            throw new Error('SERVER_GENERATION_FAILED');
                        }

                        attempts++;
                    }

                    if (!resultUrl) throw new Error('TIMEOUT_EXCEEDED');

                    await m.react('✅');

                    await conn.sendMessage(m.chat, { 
                        image: { url: resultUrl }, 
                        caption: `*FLUX GENERATION SUCCESS*\n\n*PROMPT:* ${text}\n*ENGINE:* FLUX.1 PRO` 
                    }, { quoted: m });

                } catch (e) {
                    console.error(e);
                    await m.react('❌');
                    const errorMessage = e.message === 'TIMEOUT_EXCEEDED' 
                        ? '*EL TIEMPO DE ESPERA HA EXPIRADO*' 
                        : '*ERROR EN EL PROCESAMIENTO DE IMAGEN*';
                    await conn.sendMessage(m.chat, { text: errorMessage }, { quoted: m });
                }
            }
        }
    }
};
