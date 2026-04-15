import axios from 'axios';
import fs from 'fs';
import { spawn } from 'child_process';
import webpmux from 'node-webpmux';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const toBuffer = async (url) => {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(res.data);
};

const toWebp = (buffer, isAnimated = false) => new Promise((resolve, reject) => {
    const tmpIn = `./tmp/k-in-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmpOut = `./tmp/k-out-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp', { recursive: true });
    fs.writeFileSync(tmpIn, buffer);
    const vf = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba,format=yuva420p';
    const codec = isAnimated ? 'libwebp_anim' : 'libwebp';
    const args = ['-y', '-i', tmpIn, '-vf', vf, '-c:v', codec, '-q:v', '50', '-compression_level', '6'];
    if (isAnimated) args.push('-loop', '0');
    args.push(tmpOut);
    const p = spawn('ffmpeg', args);
    p.on('close', (code) => {
        try { fs.unlinkSync(tmpIn); } catch {}
        if (code === 0 && fs.existsSync(tmpOut)) {
            const result = fs.readFileSync(tmpOut);
            try { fs.unlinkSync(tmpOut); } catch {}
            resolve(result);
        } else {
            reject(new Error('ffmpeg error'));
        }
    });
});

const downloadPack = async (url) => {
    try {
        const { data } = await axios.get('https://api.stellarwa.xyz/stickerly/detail', { params: { url, key: 'YukiWaBot' }, timeout: 10000 });
        return data;
    } catch {
        return { status: false };
    }
};

const searchPacks = async (query) => {
    try {
        const { data } = await axios.get('https://api.stellarwa.xyz/stickerly/search', { params: { query, key: 'YukiWaBot' }, timeout: 10000 });
        return data;
    } catch {
        return { status: false };
    }
};

export default {
    name: 'stickerpack',
    alias: ['spack', 'stickers'],
    category: 'stickers',
    run: async (client, m) => {
        const socket = client.sendMessage ? client : client.conn ? client.conn : m.conn;
        
        try {
            const text = m.text || m.body || m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const query = text.split(' ').slice(1).join(' ');

            if (!query) return socket.sendMessage(m.chat, { text: 'ᰔᩚ *KIRITO STICKERS*\n\nEscribe el nombre de un pack o un link de Sticker.ly.' }, { quoted: m });

            if (m.react) await m.react('⏳');
            let packData;

            if (/sticker\.ly\/s\//i.test(query)) {
                const detail = await downloadPack(query);
                if (!detail?.status) throw new Error("Pack no encontrado.");
                packData = detail.detalles;
            } else {
                const search = await searchPacks(query);
                if (!search?.status || !search.resultados?.length) throw new Error("Sin resultados.");
                const res = await downloadPack(search.resultados[0].url);
                packData = res.detalles;
            }

            const stickers = packData.stickers.slice(0, 10);
            
            for (let s of stickers) {
                const buffer = await toBuffer(s.imageUrl);
                const webp = await toWebp(buffer, s.isAnimated);
                await socket.sendMessage(m.chat, { sticker: webp }, { quoted: m });
                await delay(2000);
            }

            if (m.react) await m.react('✅');
        } catch (e) {
            console.error(e);
            if (m.react) await m.react('❌');
            socket.sendMessage(m.chat, { text: `*Error:* ${e.message}` }, { quoted: m });
        }
    }
};
