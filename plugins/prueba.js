import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import fs from 'fs';
import { promisify } from 'util';

const vokerFfmpegBrand = {
    name: 'vbrand',
    alias: ['marcarvideo', 'vforce'],
    category: 'system',
    run: async (m, { conn, text }) => {
        try {
            m.react('⏳');
            const videoUrl = text || 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1772941655924.mp4';
            const tempInput = `./temp_in_${Date.now()}.mp4`;
            const tempOutput = `./temp_out_${Date.now()}.mp4`;

            // 1. Descargamos el video
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(tempInput, Buffer.from(response.data));

            // 2. Proceso de Fuerza Bruta: Inyectamos el texto en el video
            ffmpeg(tempInput)
                .videoFilters([
                    {
                        filter: 'drawtext',
                        options: {
                            text: 'VOKER SYSTEM v5', // TU MARCA AQUÍ
                            fontcolor: 'white',
                            fontsize: 24,
                            x: 'w-tw-10', // 10px desde la derecha
                            y: 'h-th-10', // 10px desde abajo
                            shadowcolor: 'black',
                            shadowx: 2,
                            shadowy: 2
                        }
                    }
                ])
                .format('mp4')
                .on('end', async () => {
                    const videoBuffer = fs.readFileSync(tempOutput);

                    // 3. Enviamos el video LIMPIO de etiquetas de sistema que bloquean
                    await conn.sendMessage(m.chat, {
                        video: videoBuffer,
                        mimetype: 'video/mp4',
                        caption: `*── 「 SISTEMA VOKER 」 ──*`,
                        gifPlayback: true
                    }, { quoted: m });

                    // Limpieza de archivos temporales
                    fs.unlinkSync(tempInput);
                    fs.unlinkSync(tempOutput);
                    m.react('✅');
                })
                .on('error', (err) => {
                    console.error(err);
                    m.react('❌');
                })
                .save(tempOutput);

        } catch (error) {
            console.error(error);
            m.react('❌');
        }
    }
};

export default vokerFfmpegBrand;
