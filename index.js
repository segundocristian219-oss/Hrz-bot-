process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
process.removeAllListeners('warning');

import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path, { join, basename } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync, unlinkSync } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import yargs from 'yargs';
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import cfonts from 'cfonts';
import { EventEmitter } from 'events';
import { smsg } from './lib/serializer.js';
import { monitorBot } from './lib/telemetry.js';
import { uploadCriticalError } from './lib/db_logs.js';

const originalLog = console.log;
console.log = function (...args: any[]) {
  originalLog.apply(console, [chalk.cyan('┃'), ...args]);
};

const originalError = console.error;
console.error = function (...args: any[]) {
  originalError.apply(console, [chalk.red('┗'), ...args]);
};

EventEmitter.defaultMaxListeners = 0;

process.on('uncaughtException', async (err) => {
    console.error(chalk.red.bold('CRITICAL:'), err);
    try { await uploadCriticalError(err, 'Uncaught Exception Global'); } catch {}
});

const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    Browsers
} = await import('@whiskeysockets/baileys');

if (!existsSync('./tmp')) mkdirSync('./tmp');

console.clear();

cfonts.say('CAT-BOT', {
    font: 'slick', 
    align: 'center',
    colors: ['cyan', 'white'] as any,
    letterSpacing: 2
});

cfonts.say('CORE SYSTEM • PREMIUM EDITION BY DEYLIN', {
    font: 'console',
    align: 'center',
    colors: ['white'] as any,
    space: false
});
console.log(chalk.cyan('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));

declare global {
    var __filename: (pathURL?: string, rmPrefix?: boolean) => string;
    var __dirname: (pathURL: string) => string;
    var opts: any;
    var prefix: RegExp;
    var db: Low<any>;
    var loadDatabase: () => Promise<void>;
    var conn: any;
    var reload: (restatConn?: boolean) => Promise<void>;
    var plugins: Map<string, any>;
    var aliases: Map<string, string>;
    var botNumber: string;
    var isBotReady: boolean;
    var subBotsStarted: boolean;
}

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL: string) {
  return path.dirname(global.__filename(pathURL, true));
};

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

const adapter = new JSONFile('database.json');
global.db = new Low(adapter, { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} });

global.loadDatabase = async function loadDatabase() {
  if ((global.db as any).READ) return;
  (global.db as any).READ = true;
  await global.db.read().catch((e) => console.error(e));
  (global.db as any).READ = null;
  global.db.data = global.db.data || { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} };
};
await global.loadDatabase();

const sessionPath = './sessions';
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
const msgRetryCounterCache = new NodeCache();
const groupMetadataCache = new NodeCache({ stdTTL: 180, checkperiod: 120 });

const connectionOptions: any = {
  version,
  logger: pino({ level: 'silent' }), 
  printQRInTerminal: false,
  browser: Browsers.macOS("Safari"),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })), 
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  msgRetryCounterCache,
  cachedGroupMetadata: async (jid: string) => groupMetadataCache.get(jid),
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  retryRequestDelayMs: 2000,
  maxRetries: 15,
  getMessage: async () => ({ conversation: "" })
};

global.conn = makeWASocket(connectionOptions);
global.conn.contacts = global.conn.contacts || {}; 

if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (texto: string) => new Promise<string>((resolver) => rl.question(texto, resolver));
    console.log(chalk.cyan('┃ ') + chalk.bold('AUTENTICACIÓN REQUERIDA'));
    let phoneNumber = await question(chalk.cyan('┃ ') + `Ingresa el número:\n` + chalk.cyan('┗ ') + `> `);
    let addNumber = phoneNumber.replace(/\D/g, '');

    setTimeout(async () => {
        try {
            let codeBot = await global.conn.requestPairingCode(addNumber);
            codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
            console.log(chalk.cyan('┃ ') + chalk.bgWhite.black.bold(` CÓDIGO: ${codeBot} `));
        } catch (e) {
            console.error(e);
        }
    }, 3000);
}

const cleanSessions = async () => {
    const sessionDir = './sessions';
    if (!existsSync(sessionDir)) return;
    const files = readdirSync(sessionDir);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    for (const file of files) {
        if (file === 'creds.json' || statSync(join(sessionDir, file)).isDirectory()) continue;
        const filePath = join(sessionDir, file);
        const { mtime } = statSync(filePath);
        if (now - mtime.getTime() > oneDay) {
            try {
                unlinkSync(filePath);
            } catch (e) { console.error(e); }
        }
    }
};

setInterval(cleanSessions, 3600000);
if (global.db) setInterval(async () => { if (global.db.data) await global.db.write(); }, 30000);

global.reload = async function(restatConn?: boolean) {
  if (restatConn) {
    try { global.conn.ws.close(); } catch (e) { console.error(e); }
    await new Promise(resolve => setTimeout(resolve, 5000));
    global.conn = makeWASocket(connectionOptions);
    global.conn.contacts = global.conn.contacts || {}; 
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate: any) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg || (!msg.message && !msg.messageStubType)) return;
        const m = await smsg(global.conn, msg);
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        const Func = module.message || module.default?.message || module.default;
        if (typeof Func === 'function') await Func.call(global.conn, m, chatUpdate);
    } catch (e) {
        console.error(e);
        await uploadCriticalError(e, 'Message Upsert');
    }
  });

  global.conn.ev.on('contacts.upsert', (contacts: any[]) => {
    for (let contact of contacts) {
      let id = global.conn.decodeJid ? global.conn.decodeJid(contact.id) : contact.id;
      if (id) {
        if (!global.conn.contacts) global.conn.contacts = {};
        let data = { id, name: contact.verifiedName || contact.name || contact.notify };
        global.conn.contacts[id] = data;
        if (global.db.data) {
           global.db.data.users[id] = { ...global.db.data.users[id], name: data.name };
        }
      }
    }
  });

  global.conn.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'connecting') console.log(chalk.cyan('┃ ') + `Sincronizando con servidores...`);
    if (connection === 'open') {
        global.botNumber = global.conn.user.id;
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: CAT-BOT ONLINE`));
        console.log(chalk.cyan('┃ ') + chalk.white(`USER: ${global.conn.user.name}`));
        console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
        global.isBotReady = true;
        await monitorBot(global.conn, 'online');
        await cleanSessions();
        if (!global.subBotsStarted) {
            global.subBotsStarted = true;
            await initSubBots();
        }
    }

    if (connection === 'close') {
      await monitorBot(global.conn, 'offline');
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
      console.error(chalk.red(`Conexión cerrada con código: ${reason}`));
      if (reason !== DisconnectReason.loggedOut) {
          console.log(chalk.cyan('┃ ') + chalk.yellow(`Reconectando automáticamente...`));
          await global.reload(true);
      } else {
          console.log(chalk.red('┗ Sesión finalizada por WhatsApp (401/Logout).'));
          process.exit(1); 
      }
    }
  });

  global.conn.ev.on('creds.update', async () => {
      await saveCreds();
  });

  const eventFolder = join(process.cwd(), 'lib/event');
  if (existsSync(eventFolder)) {
      const eventFiles = readdirSync(eventFolder).filter(file => file.endsWith('.js'));
      for (const file of eventFiles) {
          try {
              const module = await import(`file://${join(eventFolder, file)}?update=${Date.now()}`);
              const eventFunc = module.default || module;
              if (typeof eventFunc === 'function') eventFunc(global.conn);
          } catch (e) { console.error(e); }
      }
  }
};

await global.reload();

const pluginFolder = join(process.cwd(), './plugins');
const pluginFilter = (filename: string) => /\.js$/.test(filename);
global.plugins = new Map();
global.aliases = new Map();

async function readRecursive(folder: string) {
  for (const filename of readdirSync(folder)) {
    const file = join(folder, filename);
    if (statSync(file).isDirectory()) await readRecursive(file);
    else if (pluginFilter(filename)) {
      try {
        const module = await import(`file://${file}`);
        const plugin = module.default || module;
        const pluginName = plugin.name || basename(filename, '.js');
        global.plugins.set(pluginName, plugin);
        if (plugin.alias) {
            const aliases = Array.isArray(plugin.alias) ? plugin.alias : [plugin.alias];
            aliases.forEach(a => global.aliases.set(a, pluginName));
        }
      } catch (e) { console.error(e); }
    }
  }
}

await readRecursive(pluginFolder);

watch(pluginFolder, { recursive: true }, async (_ev, filename) => {
  if (filename && pluginFilter(filename)) {
    const dir = join(pluginFolder, filename);
    if (existsSync(dir) && statSync(dir).isFile()) {
      try {
        const module = await import(`file://${dir}?update=${Date.now()}`);
        const plugin = module.default || module;
        const pluginName = plugin.name || basename(filename, '.js');
        for (const [a, p] of global.aliases.entries()) if (p === pluginName) global.aliases.delete(a);
        global.plugins.set(pluginName, plugin);
        if (plugin.alias) {
            const aliases = Array.isArray(plugin.alias) ? plugin.alias : [plugin.alias];
            aliases.forEach(a => global.aliases.set(a, pluginName));
        }
        console.log(chalk.cyan('┃ ') + chalk.white(`Update: ${pluginName}`));
      } catch (e) { console.error(e); }
    }
  }
});

async function initSubBots() {
    const jadibtsDir = path.join(process.cwd(), 'jadibts');
    if (!existsSync(jadibtsDir)) return;
    const folders = readdirSync(jadibtsDir).filter(f => 
        statSync(join(jadibtsDir, f)).isDirectory() && existsSync(join(jadibtsDir, f, 'creds.json'))
    );
    await Promise.allSettled(folders.map(async (folder) => {
        try {
            const { assistant_accessJadiBot } = await import(`./plugins/main/serbot.js?update=${Date.now()}`);
            await assistant_accessJadiBot({ phoneNumber: folder, fromCommand: false });
        } catch (e) { console.error(e); }
    }));
}
