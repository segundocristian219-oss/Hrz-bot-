import { jidNormalizedUser } from '@whiskeysockets/baileys';
import axios from 'axios';

global.name = (c) => {
    let u = c || global.conn;
    if (!u?.user) return global.botNames[0];
    let j = jidNormalizedUser(u.user.id);
    return u.settings?.botName || global.subbotConfig?.[j]?.botName || global.botNames[Math.floor(Math.random() * global.botNames.length)];
};

global.surl = (c) => {
    let u = c || global.conn;
    let j = u?.user ? jidNormalizedUser(u.user.id) : null;
    return u.settings?.botUrl || global.subbotConfig?.[j]?.botUrl || 'https://dix.lat/channel';
};

global.img = (c) => {
    let u = c || global.conn;
    let j = u?.user ? jidNormalizedUser(u.user.id) : null;
    return u.settings?.botImage || global.subbotConfig?.[j]?.botImage || global.botImages[Math.floor(Math.random() * global.botImages.length)];
};

global.bufferCache = global.bufferCache || new Map();
global.getBuffer = async (u, o = {}) => {
    try {
        let r = await axios.get(u, { ...o, responseType: 'arraybuffer' });
        return r.status === 200 ? r.data : null;
    } catch { return null; }
};