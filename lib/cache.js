import { jidNormalizedUser } from '@whiskeysockets/baileys';

class CacheManager {
    constructor() {
        if (!global.groupCache) {
            global.groupCache = new Map();
        }
        this.cache = global.groupCache;
    }

    async get(conn, jid, force = false) {
        if (!jid || !jid.endsWith('@g.us')) return {};
        
        if (!force && this.cache.has(jid)) {
            return this.cache.get(jid);
        }

        try {
            const data = await conn.groupMetadata(jid).catch(() => null);
            if (data?.id) {
                this.cache.set(jid, data);
                return data;
            }
        } catch {
            return this.cache.get(jid) || {};
        }
        return {};
    }

    updateParticipants(jid, participants) {
        if (!jid || !participants) return;
        const data = this.cache.get(jid) || { id: jid };
        data.participants = participants;
        this.cache.set(jid, data);
    }

    delete(jid) {
        this.cache.delete(jid);
    }

    getAdminStatus(jid, userJid, authorJid = null) {
        const data = this.cache.get(jid);
        if (!data?.participants) return false;

        const p = data.participants.find(p => 
            jidNormalizedUser(p.id) === jidNormalizedUser(userJid) || 
            (authorJid && jidNormalizedUser(p.id) === jidNormalizedUser(authorJid)) ||
            (p.lid && jidNormalizedUser(p.lid) === jidNormalizedUser(userJid))
        );
        return !!(p?.admin || p?.isCommunityAdmin);
    }
}

export const cacheManager = new CacheManager();
