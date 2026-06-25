import gtts from 'node-gtts';
import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
import { join } from 'path';

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const execPromise = promisify(exec);

export const ttsCommand = {
    category: 'tools',
    commands: {
        tts: {
            name: 'tts',
            alias: ['voz', 'decir'],
            run: async (m, { conn, text }) => {
                if (!text) return;

                const id = Math.floor(Math.random() * 10000);
                const input = join('./', `input_${id}.mp3`);
                const output = join('./', `output_${id}.opus`);

                try {
                    await m.react('🗣️');

                    const originalLog = console.log;
                    console.log = () => {};

                    const speech = gtts('es');

                    await new Promise((resolve, reject) => {
                        speech.save(input, text, (err) => {
                            console.log = originalLog;
                            if (err) reject(err);
                            else resolve();
                        });
                    });

                    await execPromise(`ffmpeg -i ${input} -c:a libopus -b:a 32k -vbr on -compression_level 10 ${output}`);

                    const buffer = await readFile(output);

                    await conn.sendMessage(m.chat, { 
                        audio: buffer, 
                        mimetype: 'audio/ogg; codecs=opus', 
                        ptt: true 
                    }, { quoted: m });

                    await m.react('✅');

                } catch (error) {
                    console.error('Error en TTS:', error);
                    await m.react('❌');
                } finally {
                    if (fs.existsSync(input)) await unlink(input).catch(() => {});
                    if (fs.existsSync(output)) await unlink(output).catch(() => {});
                }
            }
        }
    }
};
