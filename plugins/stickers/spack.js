import axios from 'axios';
import crypto from 'crypto';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';

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

let patchedDefaults = false;
async function patchMediaPathMap() {
    if (patchedDefaults) return;
    try {
        const defaults = await import('/home/container/node_modules/@whiskeysockets/baileys/lib/Defaults/index.js');
        defaults.MEDIA_PATH_MAP['sticker-pack'] = '/mms/sticker-pack';
        defaults.MEDIA_HKDF_KEY_MAPPING['sticker-pack'] = 'Sticker Pack';
        patchedDefaults = true;
    } catch (e) {
        console.error(e.message);
    }
}

const stickerPackSearch = {
    name: 'stickerpack',
    alias: ['spack', 'stickerly'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('Ingresa el nombre.');
        try {
            await m.react('🕒');
            await patchMediaPathMap();

            const { data: searchRes } = await axios.post('https://panel.apinexus.fun/api/stickers/buscar', { query: text }, {
                headers: { 'Content-Type': 'application/json', 'x-api-key': key }
            });

            if (!searchRes.success || !searchRes.data?.packs?.length) return m.reply('Sin resultados.');
            const pack = searchRes.data.packs[0];

            const { data: dlRes } = await axios.post('https://panel.apinexus.fun/api/stickers/descargar', { url: pack.url }, {
                headers: { 'Content-Type': 'application/json', 'x-api-key': key }
            });

            if (!dlRes.success || !dlRes.data?.stickers) return m.reply('Error al descargar.');

            const stickersToProcess = dlRes.data.stickers.slice(0, 10);

            const [coverRes, ...stickerResps] = await Promise.all([
                axios.get(pack.thumbnail, { responseType: 'arraybuffer' }),
                ...stickersToProcess.map(url => axios.get(url, { responseType: 'arraybuffer' }))
            ]);

            const trayBuffer = await sharp(Buffer.from(coverRes.data)).resize(96, 96).png().toBuffer();
            const zipFiles = [];
            const stickerMeta = [];

            for (let i = 0; i < stickerResps.length; i++) {
                const processedBuffer = await sharp(Buffer.from(stickerResps[i].data))
                    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .webp({ quality: 75 })
                    .toBuffer();
                const hash = crypto.createHash('sha256').update(processedBuffer).digest('base64url');
                const fileName = `${String(i).padStart(2, '0')}_${hash}.webp`;
                zipFiles.push({ name: fileName, data: processedBuffer });
                stickerMeta.push({
                    fileName,
                    isAnimated: false,
                    emojis: ['✨']
                });
            }

            const zipBuffer = buildZip(zipFiles);
            const { mediaKey, encBody, fileSha256, fileEncSha256 } = encryptZip(zipBuffer);
            const msgId = crypto.randomBytes(8).toString('hex').toUpperCase();

            const packId = fileEncSha256.toString('base64url');
            const trayIconName = `${packId}.png`;

            const trayBuf = trayBuffer;
            const thumbSha256 = crypto.createHash('sha256').update(trayBuf).digest();
            const thumbKeys = hkdf(mediaKey, 112, 'WhatsApp Sticker Pack Keys');
            const thumbIv = thumbKeys.slice(0, 16);
            const thumbCipherKey = thumbKeys.slice(16, 48);
            const thumbMacKey = thumbKeys.slice(48, 80);
            const thumbCipher = crypto.createCipheriv('aes-256-cbc', thumbCipherKey, thumbIv);
            const thumbEnc = Buffer.concat([thumbCipher.update(trayBuf), thumbCipher.final()]);
            const thumbMac = crypto.createHmac('sha256', thumbMacKey).update(thumbIv).update(thumbEnc).digest().slice(0, 10);
            const thumbEncBody = Buffer.concat([thumbEnc, thumbMac]);
            const thumbEncSha256 = crypto.createHash('sha256').update(thumbEncBody).digest();

            const fullZipFiles = [{ name: trayIconName, data: trayBuf }, ...zipFiles];
            const finalZipBuffer = buildZip(fullZipFiles);
            const finalEncrypted = encryptZip(finalZipBuffer);

            const tmpPath = join(tmpdir(), `spack-${msgId}.enc`);
            await writeFile(tmpPath, finalEncrypted.encBody);

            const { directPath } = await conn.waUploadToServer(tmpPath, {
                fileEncSha256B64: finalEncrypted.fileEncSha256.toString('base64'),
                mediaType: 'sticker-pack'
            });
            await unlink(tmpPath);

            const stickerPackMsg = {
                stickerPackId: packId,
                name: pack.packname.substring(0, 30),
                publisherName: 'Cat Bot',
                trayIconFileName: trayIconName,
                stickers: stickerMeta,
                stickerPackSize: finalZipBuffer.length,
                stickerPackOrigin: 'THIRD_PARTY',
                mediaKey: finalEncrypted.mediaKey,
                fileLength: finalEncrypted.encBody.length,
                fileSha256: finalEncrypted.fileSha256,
                fileEncSha256: finalEncrypted.fileEncSha256,
                directPath,
                thumbnailDirectPath: directPath,
                thumbnailSha256: thumbSha256,
                thumbnailEncSha256: thumbEncSha256,
                thumbnailHeight: 96,
                thumbnailWidth: 96,
                mediaKeyTimestamp: Math.floor(Date.now() / 1000),
                packDescription: 'Sticker Pack',
                imageDataHash: thumbSha256.toString('base64')
            };

            await conn.relayMessage(m.chat, { stickerPackMessage: stickerPackMsg }, { messageId: msgId, quoted: m });
            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
        }
    }
};

export default stickerPackSearch;