import { watchFile, unwatchFile } from 'fs';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import axios from 'axios';
import moment from 'moment-timezone';
import fs from 'fs';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

Object.assign(global, { cheerio, fs, fetch, axios, moment });

Object.defineProperty(global, 'channelInfo', {
    get() {
        try {
            let c = global.conn;
            let b = c?.user ? jidNormalizedUser(c.user.id) : '';
            let p = !!global.subbotConfig?.[b]?.isPremium;
            let a = !!global.restrictionsCache?.get(b)?.restrictedMode;
            
            
            if (p || a) return { forwardingScore: 1, isForwarded: true };
            return { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: global.ch, newsletterName: typeof global.name === 'function' ? global.name(c) : 'Channel' } };
        } catch { return { forwardingScore: 1, isForwarded: true }; }
    }
});

let f = fileURLToPath(import.meta.url);
watchFile(f, () => {
    unwatchFile(f);
    console.log(chalk.redBright("config.js update"));
    import(`${f}?update=${Date.now()}`);
});
