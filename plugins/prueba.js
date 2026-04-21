
import axios from 'axios';
import crypto from 'crypto';
import { Readable } from 'stream';

// ── HKDF, encryptZip, crc32, buildZip — igual que antes ─────────────────────
// (mantén todas esas funciones sin cambios)

// ── Plugin ───────────────────────────────────────────────────────────────────
const stickerPackSearch = {
    name: 'stickerpack',
    alias: ['spack', 'stickerly'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('Ingresa el nombre de un paquete de stickers.');

        try {
            await m.react('🕒');

            // 1. Buscar pack
            const { data: searchData } = await axios.get(
                `https://sylphyy.xyz/search/stickerly?q=${encodeURIComponent(text)}&api_key=sylphy-hz8pNip`
            );
            if (!searchData.status || !searchData.result?.length) {
                await m.react('✖️');
                return m.reply('No se encontraron resultados.');
            }

            const pack = searchData.result[0];
            const packId = pack.url.split('/').pop();

            // 2. Obtener stickers
            const { data: dlData } = await axios.get(
                `https://sylphyy.xyz/download/stickerly?url=${encodeURIComponent(pack.url)}&api_key=sylphy-hz8pNip`
            );
            if (!dlData.status || !dlData.result?.stickers?.length) {
                await m.react('✖️');
                return m.reply('No se pudieron obtener los stickers.');
            }

            const stickers = dlData.result.stickers.slice(0, 5);

            // 3. Descargar cover + stickers
            const [coverRes, ...stickerResps] = await Promise.all([
                axios.get(dlData.result.thumbnailUrl, { responseType: 'arraybuffer' }),
                ...stickers.map(s => axios.get(s.imageUrl, { responseType: 'arraybuffer' }))
            ]);

            const coverBuf = Buffer.from(coverRes.data);
            const stickerBufs = stickerResps.map(r => Buffer.from(r.data));

            // 4. Construir ZIP
            const zipFiles = [{ name: `${packId}.png`, data: coverBuf }];
            const stickerMeta = [];

            for (let i = 0; i < stickerBufs.length; i++) {
                const buf = stickerBufs[i];
                const hash = crypto.createHash('sha256').update(buf).digest('base64url');
                const fileName = `${String(i).padStart(2, '0')}_${hash}.webp`;
                zipFiles.push({ name: fileName, data: buf });
                stickerMeta.push({
                    fileName,
                    isAnimated: stickers[i].isAnimated || false,
                    isLottie: false,
                    mimetype: 'image/webp',
                    accessibilityLabel: '',
                    emojis: []
                });
            }

            const zipBuffer = buildZip(zipFiles);

            // 5. Cifrar
            const { mediaKey, encBody, fileSha256, fileEncSha256 } = encryptZip(zipBuffer);

            // 6. ✅ CORRECCIÓN: pasar ReadableStream + fileEncSha256B64 string
            const readStream = Readable.from(encBody);
            const fileEncSha256B64 = fileEncSha256.toString('base64');

            const uploadResult = await conn.waUploadToServer(
                readStream,
                {
                    fileEncSha256B64,
                    mediaType: 'sticker-pack',
                    timeoutMs: 60_000
                }
            );

            // 7. Thumbnail sha
            const thumbSha256 = crypto.createHash('sha256').update(coverBuf).digest();

            // 8. Enviar
            const msgId = crypto.randomBytes(8).toString('hex').toUpperCase();

            await conn.relayMessage(m.chat, {
                stickerPackMessage: {
                    stickerPackId: packId,
                    name: dlData.result.name || pack.name,
                    publisherName: dlData.result.author?.name || pack.author,
                    trayIconFileName: `${packId}.png`,
                    stickers: stickerMeta,
                    fileLength: encBody.length,
                    fileSha256,
                    fileEncSha256,
                    mediaKey,
                    directPath: uploadResult.directPath,
                    mediaKeyTimestamp: Math.floor(Date.now() / 1000),
                    thumbnailDirectPath: uploadResult.directPath,
                    thumbnailSha256: thumbSha256,
                    thumbnailEncSha256: thumbSha256,
                    thumbnailHeight: 252,
                    thumbnailWidth: 252,
                    stickerPackSize: zipBuffer.length,
                    stickerPackOrigin: 'THIRD_PARTY'
                }
            }, { messageId: msgId, quoted: m });

            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            console.error(e);
            m.reply('Error: ' + e.message);
        }
    }
};

export default stickerPackSearch;
