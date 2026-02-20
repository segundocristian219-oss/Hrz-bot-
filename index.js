process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import path, { join, basename } from 'path';
import fs, { existsSync, readdirSync, statSync, watch, mkdirSync, createWriteStream, unlinkSync, rmSync } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import yargs from 'yargs';
import lodash from 'lodash';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import cfonts from 'cfonts';
import axios from 'axios'; 
import { smsg } from './lib/serializer.js';
import { monitorBot } from './lib/telemetry.js';
import { uploadCriticalError } from './lib/db_logs.js';
import { EventEmitter } from 'events';

const originalLog = console.log;
console.log = function () {
  const args = Array.from(arguments);
  const msg = args.join(' ');
  if (
    msg.includes('Closing session') || 
    msg.includes('SessionEntry') || 
    msg.includes('Verifying identity') || 
    msg.includes('registrationId') || 
    msg.includes('currentRatchet') || 
    msg.includes('rate-overlimit') || 
    msg.includes('429') ||
    msg.includes('Rate Limit') || 
    msg.includes('Ignorando') ||
    msg.includes('Connection Terminated')
  ) {
    return; 
  }
  originalLog.apply(console, [chalk.cyan('『 LOG 』'), ...args]);
};

const originalDir = console.dir;
console.dir = function () {
  const args = Array.from(arguments);
  if (!args[0]) return originalDir.apply(console, args);
  const isSessionData = args[0].constructor?.name === 'SessionEntry' || args[0].sessionConfig || args[0].registrationId || args[0].currentRatchet || args[0]._chains;
  if (isSessionData) return;
  originalDir.apply(console, args);
};

const originalError = console.error;
console.error = function () {
  const args = Array.from(arguments);
  const msg = args.join(' ');
  if (msg.includes('rate-overlimit') || msg.includes('429') || msg.includes('Connection Terminated')) return;
  originalError.apply(console, [chalk.red.bold('『 ERROR 』'), ...args]);
};

EventEmitter.defaultMaxListeners = 0;

process.on('uncaughtException', async (err) => {
    if (err.message?.includes('Connection Terminated')) return;
    console.error(chalk.red.bold('\n⚠️ FALLO CRÍTICO:'));
    console.error(chalk.red(err.stack));
    try { await uploadCriticalError(err, 'Uncaught Exception Global'); } catch {}
});

process.on('unhandledRejection', async (reason) => {
    if (reason?.message?.includes('Connection Terminated')) return;
    console.error(chalk.red.bold('\n⚠️ PROMESA RECHAZADA:'));
    console.error(chalk.red(reason));
});

const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    jidNormalizedUser,
    Browsers
} = await import('@whiskeysockets/baileys');

const { chain } = lodash;

if (!existsSync('./tmp')) mkdirSync('./tmp');

console.clear();
cfonts.say('CAT-BOT', { font: 'block', align: 'center', colors: ['magenta', 'bright_cyan'] });
cfonts.say('Premium Edition by Deylin', { font: 'console', align: 'center', colors: ['white'] });

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

const adapter = new JSONFile('database.json');
global.db = new Low(adapter, {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {}
});

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return;
  global.db.READ = true;
  await global.db.read().catch(() => {});
  global.db.READ = null;
  global.db.data = global.db.data || {
    users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}
  };
};
await loadDatabase();

const sessionPath = './sessions';
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
const msgRetryCounterCache = new NodeCache();
const groupMetadataCache = new NodeCache({ stdTTL: 180, checkperiod: 120 });

const connectionOptions = {
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
  cachedGroupMetadata: async (jid) => groupMetadataCache.get(jid),
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  retryRequestDelayMs: 2000,
  maxRetries: 15,
  getMessage: async (key) => ({ conversation: "" })
};

global.conn = makeWASocket(connectionOptions);

if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));
    console.log(chalk.bold.cyan('\n『 VINCULACIÓN DE CUENTA 』'));
    let phoneNumber = await question(chalk.white(`\n➤ Ingresa el número de WhatsApp:\n> `));
    let addNumber = phoneNumber.replace(/\D/g, '');

    setTimeout(async () => {
        try {
            let codeBot = await conn.requestPairingCode(addNumber);
            codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
            console.log(chalk.black.bgCyan(`\n CÓDIGO DE VINCULACIÓN: ${codeBot} \n`));
        } catch {
            console.log(chalk.red('\n[!] Error al generar código.'));
        }
    }, 3000);
}

if (global.db) setInterval(async () => { if (global.db.data) await global.db.write(); }, 30000);

global.reload = async function(restatConn) {
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    await new Promise(resolve => setTimeout(resolve, 5000));
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg || (!msg.message && !msg.messageStubType)) return;
        const m = await smsg(conn, msg);
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        const Func = module.message || module.default?.message || module.default;
        if (typeof Func === 'function') await Func.call(conn, m, chatUpdate);
    } catch (e) {
        if (!e.message?.includes('Connection Terminated')) await uploadCriticalError(e, 'Message Upsert');
    }
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'connecting') console.log(chalk.cyan(`『 SISTEMA 』Estableciendo conexión...`));
    if (connection === 'open') {
        console.log(chalk.green.bold(`『 ÉXITO 』CAT-BOT conectado como: ${conn.user.name}`));
        global.isBotReady = true;
        await monitorBot(conn, 'online');
        if (!global.subBotsStarted) {
            global.subBotsStarted = true;
            await initSubBots();
        }
    }
    if (connection === 'close') {
      await monitorBot(conn, 'offline');
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 0;
      if (reason !== DisconnectReason.loggedOut) {
          console.log(chalk.yellow(`『 RECONEXIÓN 』Motivo: ${reason}. Reiniciando en 5s...`));
          await global.reload(true);
      } else {
          console.log(chalk.red.bold("『 ERROR 』Sesión finalizada."));
          rmSync(sessionPath, { recursive: true, force: true });
          process.exit(1);
      }
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
};

global.lastRestartTime = Date.now();
const botID = "cat_" + Math.random().toString(36).substring(7);

const monitorRemoteOrders = async () => {
    try {
        const response = await axios.get('https://script.google.com/macros/s/AKfycbxnJ_BRuW2DdNDCtnspyL1qHvedn4Ue5k3OFfzZK4aFH50aVz1hgO094d02DEqKFB8gCg/exec');
        const { config } = response.data;
        if (config.restart && config.timestamp > global.lastRestartTime) {
            console.log(chalk.bgMagenta.white(' 『 REMOTO 』ORDEN DE REINICIO RECIBIDA '));
            global.lastRestartTime = config.timestamp;
            setTimeout(() => { process.exit(0); }, 1000);
        }
    } catch (e) {}
};

setInterval(monitorRemoteOrders, 60000); 
await global.reload();

const pluginFolder = join(process.cwd(), './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = new Map();
global.aliases = new Map();

async function readRecursive(folder) {
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
      } catch (e) {}
    }
  }
}

await readRecursive(pluginFolder);

watch(pluginFolder, { recursive: true }, async (_ev, filename) => {
  if (pluginFilter(filename)) {
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
        console.log(chalk.magenta(`『 PLUGIN 』Módulo actualizado: ${pluginName}`));
      } catch (e) {}
    }
  }
});

async function initSubBots() {
    const jadibtsDir = path.join(process.cwd(), 'jadibts');
    if (!existsSync(jadibtsDir)) return;
    const folders = readdirSync(jadibtsDir).filter(f => 
        statSync(join(jadibtsDir, f)).isDirectory() && existsSync(join(jadibtsDir, f, 'creds.json'))
    );
    for (const folder of folders) {
        try {
            const { assistant_accessJadiBot } = await import(`./plugins/main/serbot.js?update=${Date.now()}`);
            await assistant_accessJadiBot({ phoneNumber: folder, fromCommand: false });
            await new Promise(r => setTimeout(r, 1500)); 
        } catch (e) {}
    }
}
