
import axios from 'axios';
import crypto from 'crypto';
import { proto } from '@whiskeysockets/baileys';

// ── Utilidades de cifrado (igual que hace Baileys internamente) ──────────────
function hkdf(key, length, { salt, info } = {}) {
    const h = salt
        ? crypto.createHmac('sha256', salt).update(key).digest()
        : crypto.createHmac('sha256', Buffer.alloc(32)).update(key).digest();
    const infoBuffer = Buffer.from(info || '');
    const output = [];
    let prev = Buffer.alloc(0);
    let done = 0;
    let i = 0;
    while (done < length) {
        i++;
        const hmac = crypto.createHmac('sha256', h);
        hmac.update(prev);
        hmac.update(infoBuffer);
        hmac.update(Buffer.from([i]));
        prev = hmac.digest();
        output.push(prev);
        done += prev.length;
    }
    return Buffer.concat(output).slice(0, length);
}

function encryptZip(zipBuffer) {
    const mediaKey = crypto.randomBytes(32);
    const keys = hkdf(mediaKey, 112, { info: 'WhatsApp Sticker Pack Keys' });
    const iv = keys.slice(0, 16);
    const cipherKey = keys.slice(16, 48);
    const macKey = keys.slice(48, 80);

    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(zipBuffer), cipher.final()]);

    const mac = crypto.createHmac('sha256', macKey)
        .update(iv)
        .update(encrypted)
        .digest()
        .slice(0, 10);

    const encBody = Buffer.concat([encrypted, mac]);
    const fileSha256 = crypto.createHash('sha256').update(zipBuffer).digest();
    const fileEncSha256 = crypto.createHash('sha256').update(encBody).digest();

    return { mediaKey, encBody, fileSha256, fileEncSha256 };
}

// ── ZIP mínimo sin dependencias externas ────────────────────────────────────
function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (const b of buf) {
        crc ^= b;
        for (let j = 0; j < 8; j++)
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(files) {
    // files = [{ name: string, data: Buffer }]
    const localHeaders = [];
    const centralDirs = [];
    let offset = 0;

    for (const file of files) {
        const nameBuffer = Buffer.from(file.name, 'utf8');
        const crc = crc32(file.data);
        const size = file.data.length;

        // Local file header
        const local = Buffer.alloc(30 + nameBuffer.length);
        local.writeUInt32LE(0x04034b50, 0);   // signature
        local.writeUInt16LE(20, 4);            // version needed
        local.writeUInt16LE(0, 6);             // flags
        local.writeUInt16LE(0, 8);             // compression (store)
        local.writeUInt16LE(0, 10);            // mod time
        local.writeUInt16LE(0, 12);            // mod date
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(size, 18);
        local.writeUInt32LE(size, 22);
        local.writeUInt16LE(nameBuffer.length, 26);
        local.writeUInt16LE(0, 28);
        nameBuffer.copy(local, 30);

        localHeaders.push(local);
        localHeaders.push(file.data);

        // Central directory entry
        const central = Buffer.alloc(46 + nameBuffer.length);
        central.writeUInt32LE(0x02014b50, 0);  // signature
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(0, 8);
        central.writeUInt16LE(0, 10);
        central.writeUInt16LE(0, 12);
        central.writeUInt16LE(0, 14);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(size, 20);
        central.writeUInt32LE(size, 24);
        central.writeUInt16LE(nameBuffer.length, 28);
        central.writeUInt16LE(0, 30);
        central.writeUInt16LE(0, 32);
        central.writeUInt16LE(0, 34);
        central.writeUInt16LE(0, 36);
        central.writeUInt32LE(0, 38);
        central.writeUInt32LE(offset, 42);
        nameBuffer.copy(central, 46);
        centralDirs.push(central);

        offset += local.length + size;
    }

    const centralBuffer = Buffer.concat(centralDirs);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(centralBuffer.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...localHeaders, centralBuffer, eocd]);
}

// ── Plugin principal ─────────────────────────────────────────────────────────
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

            // 2. Obtener stickers individuales
            const { data: dlData } = await axios.get(
                `https://sylphyy.xyz/download/stickerly?url=${encodeURIComponent(pack.url)}&api_key=sylphy-hz8pNip`
            );
            if (!dlData.status || !dlData.result?.stickers?.length) {
                await m.react('✖️');
                return m.reply('No se pudieron obtener los stickers del pack.');
            }

            const stickers = dlData.result.stickers.slice(0, 30); // máx 30

            // 3. Descargar cada sticker + cover
            m.reply(`⏳ Descargando ${stickers.length} stickers...`);

            const [coverRes, ...stickerBuffers] = await Promise.all([
                axios.get(dlData.result.thumbnailUrl, { responseType: 'arraybuffer' }),
                ...stickers.map(s => axios.get(s.imageUrl, { responseType: 'arraybuffer' }))
            ]);

            const coverBuffer = Buffer.from(coverRes.data);

            // 4. Construir ZIP
            const zipFiles = [];

            // Cover: packId.png
            zipFiles.push({ name: `${packId}.png`, data: coverBuffer });

            // Cada sticker: índice_hash.webp
            for (let i = 0; i < stickerBuffers.length; i++) {
                const buf = Buffer.from(stickerBuffers[i].data);
                const hash = crypto.createHash('sha256').update(buf).digest('base64url');
                zipFiles.push({
                    name: `${String(i).padStart(2, '0')}_${hash}.webp`,
                    data: buf
                });
            }

            const zipBuffer = buildZip(zipFiles);

            // 5. Cifrar ZIP
            const { mediaKey, encBody, fileSha256, fileEncSha256 } = encryptZip(zipBuffer);

            // 6. Subir a WhatsApp
            const uploadResult = await conn.uploadMedia(encBody, 'sticker-pack');

            // 7. Construir lista de stickers para el proto
            const stickerList = stickers.map((s, i) => {
                const buf = Buffer.from(stickerBuffers[i].data);
                const hash = crypto.createHash('sha256').update(buf).digest('base64url');
                return {
                    fileName: `${String(i).padStart(2, '0')}_${hash}.webp`,
                    isAnimated: s.isAnimated || false,
                    isLottie: false,
                    mimetype: 'image/webp',
                    accessibilityLabel: '',
                    emojis: []
                };
            });

            // 8. Descargar thumbnail para el proto
            const thumbRes = await axios.get(dlData.result.thumbnailUrl, { responseType: 'arraybuffer' });
            const thumbBuffer = Buffer.from(thumbRes.data);
            const thumbSha256 = crypto.createHash('sha256').update(thumbBuffer).digest('base64');

            // 9. Enviar con relayMessage
            const msgId = crypto.randomBytes(8).toString('hex').toUpperCase();

            await conn.relayMessage(m.chat, {
                stickerPackMessage: {
                    stickerPackId: packId,
                    name: dlData.result.name || pack.name,
                    publisherName: dlData.result.author?.name || pack.author,
                    trayIconFileName: `${packId}.png`,
                    stickers: stickerList,
                    fileLength: encBody.length,
                    fileSha256: Buffer.from(fileSha256),
                    fileEncSha256: Buffer.from(fileEncSha256),
                    mediaKey: Buffer.from(mediaKey),
                    directPath: uploadResult.directPath,
                    mediaKeyTimestamp: Math.floor(Date.now() / 1000),
                    thumbnailDirectPath: uploadResult.directPath,
                    thumbnailSha256: Buffer.from(thumbSha256, 'base64'),
                    thumbnailEncSha256: Buffer.from(thumbSha256, 'base64'),
                    thumbnailHeight: 252,
                    thumbnailWidth: 252,
                    stickerPackSize: zipBuffer.length,
                    stickerPackOrigin: 'THIRD_PARTY'
                }
            }, {
                messageId: msgId,
                quoted: m
            });

            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            console.error(e);
            m.reply('Error: ' + e.message);
        }
    }
};

export default stickerPackSearch;
