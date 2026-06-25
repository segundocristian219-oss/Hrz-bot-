import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys';
import axios from 'axios';

const thumb_width = 720;
const thumb_height = 480;

const getBuffer = async (src) => {
    if (!src) return null;
    if (Buffer.isBuffer(src)) return src;
    if (typeof src === 'string' && /^https?:\/\//.test(src)) {
        const res = await axios.get(src, { responseType: 'arraybuffer' }).catch(() => null);
        return res ? Buffer.from(res.data) : null;
    }
    if (typeof src === 'string' && /^data:.*?;base64,/.test(src)) {
        return Buffer.from(src.split(',')[1], 'base64');
    }
    try { return Buffer.from(src, 'base64'); } catch { return null; }
};

const processImage = async (buffer, type, ratio) => {
    let w = thumb_width;
    let h = thumb_height;

    if (type === 3) {
        w = 150;
        h = 150;
    } else if (ratio === 'portrait' || type === 2) {
        w = 480;
        h = 720;
    }

    try {
        const sharpMod = await import('sharp');
        const sharp = sharpMod.default || sharpMod;
        return await sharp(buffer)
            .resize(w, h, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 90 })
            .toBuffer();
    } catch {
        try {
            const jimpMod = await import('jimp');
            const Jimp = jimpMod.Jimp || jimpMod.default || jimpMod;
            const image = await Jimp.read(buffer);
            if (typeof image.cover === 'function') image.cover(w, h);
            else image.resize(w, h);

            if (typeof image.getBufferAsync === 'function') {
                return await image.getBufferAsync('image/jpeg');
            } else {
                return await new Promise((res, rej) => {
                    image.getBuffer('image/jpeg', (err, buf) => { if (err) rej(err); else res(buf); });
                });
            }
        } catch {
            return buffer;
        }
    }
};

export function initPreview(conn) {
    conn.sendPreviewMessage = async (jid, text = '', opts = {}) => {
        const {
            type = 1,
            ratio = 'landscape',
            url = 'https://cdn.dix.lat',
            thumbnail = null,
            title = '',
            body = '',
            quoted = null,
            mentions = [],
            contextInfo = {}
        } = opts;

        let rawBuffer = await getBuffer(thumbnail);
        let finalThumb = rawBuffer ? await processImage(rawBuffer, type, ratio) : null;

        let hiddenLinkText = `${url}\n\u200e`.repeat(1) + text;

        let extendedTextStructure = {
            text: hiddenLinkText,
            matchedText: url,
            canonicalUrl: url,
            title: title,
            description: body,
            previewType: 0,
            contextInfo: {
                ...contextInfo,
                mentionedJid: mentions,
                groupMentions: []
            }
        };

        if (type === 1 || type === 2) {
            extendedTextStructure.thumbnailWidth = ratio === 'landscape' && type !== 2 ? thumb_width : 480;
            extendedTextStructure.thumbnailHeight = ratio === 'landscape' && type !== 2 ? thumb_height : 720;

            if (finalThumb && typeof conn.waUploadToServer === 'function') {
                const uploaded = await prepareWAMessageMedia(
                    { image: finalThumb },
                    { upload: conn.waUploadToServer, mediaTypeOverride: 'thumbnail-link', mediaUploadTimeoutMs: 30000 }
                ).catch(() => ({}));

                const imgMsg = uploaded.imageMessage || {};
                if (imgMsg.directPath) {
                    extendedTextStructure.jpegThumbnail = imgMsg.jpegThumbnail;
                    extendedTextStructure.thumbnailDirectPath = imgMsg.directPath;
                    extendedTextStructure.mediaKey = imgMsg.mediaKey;
                    extendedTextStructure.mediaKeyTimestamp = imgMsg.mediaKeyTimestamp;
                    extendedTextStructure.thumbnailSha256 = imgMsg.fileSha256;
                    extendedTextStructure.thumbnailEncSha256 = imgMsg.fileEncSha256;
                } else {
                    extendedTextStructure.jpegThumbnail = finalThumb;
                }
            } else if (finalThumb) {
                extendedTextStructure.jpegThumbnail = finalThumb;
            }
        } else if (type === 3) {
            if (finalThumb) {
                extendedTextStructure.jpegThumbnail = finalThumb;
            }
        }

        const waMsg = generateWAMessageFromContent(jid, { extendedTextMessage: extendedTextStructure }, { quoted, userJid: conn.user?.jid });
        return conn.relayMessage(jid, waMsg.message, { messageId: waMsg.key.id });
    };
}