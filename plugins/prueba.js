
import axios from 'axios';
import crypto from 'crypto';
import { Readable } from 'stream';

function hkdf(key, length, info = '') {
    const h = crypto.createHmac('sha256', Buffer.alloc(32)).update(key).digest();
    const infoBuffer = Buffer.from(info);
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
    const keys = hkdf(mediaKey, 112, 'WhatsApp Sticker Pack Keys');
    const iv = keys.slice(0, 16);
    const cipherKey = keys.slice(16, 48);
    const macKey = keys.slice(48, 80);
    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(zipBuffer), cipher.final()]);
    const mac = crypto.createHmac('sha256', macKey).update(iv).update(encrypted).digest().slice(0, 10);
    const encBody = Buffer.concat([encrypted, mac]);
    const fileSha256 = crypto.createHash('sha256').update(zipBuffer).digest();
    const fileEncSha256 = crypto.createHash('sha256').update(encBody).digest();
    return { mediaKey, encBody, fileSha256, fileEncSha256 };
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (const b of buf) {
        crc ^= b;
        for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(files) {
    const localParts = [];
    const centralDirs = [];
    let offset = 0;
    for (const file of files) {
        const name = Buffer.from(file.name, 'utf8');
        const crc = crc32(file.data);
        const size = file.data.length;
        const local = Buffer.alloc(30 + name.length);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0, 6);
        local.writeUInt16LE(0, 8);
        local.writeUInt16LE(0, 10);
        local.writeUInt16LE(0, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(size, 18);
        local.writeUInt32LE(size, 22);
        local.writeUInt16LE(name.length, 26);
        local.writeUInt16LE(0, 28);
        name.copy(local, 30);
        localParts.push(local, file.data);
        const cd = Buffer.alloc(46 + name.length);
        cd.writeUInt32LE(0x02014b50, 0);
        cd.writeUInt16LE(20, 4);
        cd.writeUInt16LE(20, 6);
        cd.writeUInt16LE(0, 8);
        cd.writeUInt16LE(0, 10);
        cd.writeUInt16LE(0, 12);
        cd.writeUInt16LE(0, 14);
        cd.writeUInt32LE(crc, 16);
        cd.writeUInt32LE(size, 20);
        cd.writeUInt32LE(size, 24);
        cd.writeUInt16LE(name.length, 28);
        cd.writeUInt16LE(0, 30);
        cd.writeUInt16LE(0, 32);
        cd.writeUInt16LE(0, 34);
        cd.writeUInt16LE(0, 36);
        cd.writeUInt32LE(0, 38);
        cd.writeUInt32LE(offset, 42);
        name.copy(cd, 46);
        centralDirs.push(cd);
        offset += 30 + name.length + size;
    }
    const central = Buffer.concat(centralDirs);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(central.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);
    return Buffer.concat([...localParts, central, eocd]);
}

const stickerPackSearch = {
    name: 'stickerpack',
    alias: ['spack', 'stickerly'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('Ingresa el nombre de un paquete de stickers.');
        try {
            await m.react('🕒');

            const { data: searchData } = await axios.get(
                `https://sylphyy.xyz/search/stickerly?q=${encodeURIComponent(text)}&api_key=sylphy-hz8pNip`
            );
            if (!searchData.status || !searchData.result?.length) {
                await m.react('✖️');
                return m.reply('No se encontraron resultados.');
            }

            const pack = searchData.result[0];
            const packId = pack.url.split('/').pop();

            const { data: dlData } = await axios.get(
                `https://sylphyy.xyz/download/stickerly?url=${encodeURIComponent(pack.url)}&api_key=sylphy-hz8pNip`
            );
            if (!dlData.status || !dlData.result?.stickers?.length) {
                await m.react('✖️');
                return m.reply('No se pudieron obtener los stickers.');
            }

            const stickers = dlData.result.stickers.slice(0, 5);

            const [coverRes, ...stickerResps] = await Promise.all([
                axios.get(dlData.result.thumbnailUrl, { responseType: 'arraybuffer' }),
                ...stickers.map(s => axios.get(s.imageUrl, { responseType: 'arraybuffer' }))
            ]);

            const coverBuf = Buffer.from(coverRes.data);
            const stickerBufs = stickerResps.map(r => Buffer.from(r.data));

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
            const { mediaKey, encBody, fileSha256, fileEncSha256 } = encryptZip(zipBuffer);

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

            const thumbSha256 = crypto.createHash('sha256').update(coverBuf).digest();
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
