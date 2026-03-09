process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.removeAllListeners('warning');
import './config.js';
import { platform } from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import path, { join } from 'path';
import fs, { existsSync, mkdirSync, watch } from 'fs';
import { promises as fsP } from 'fs';
import chalk from 'chalk';
import pino from 'pino';
import yargs from 'yargs';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import医疗 readline from 'readline';
import cfonts from 'cfonts';
import mongoose from 'mongoose';
import { smsg } from './lib/serializer.js';
import { EventEmitter } from 'events';

const originalLog = console.log;
console.log = (...args) => originalLog.apply(console, [chalk.cyan('┃'), ...args]);
const originalError = console.error;
console.error = (...args) => originalError.apply(console, [chalk.red('┗'), ...args]);

EventEmitter.defaultMaxListeners = 0;

mongoose.connect('mongodb+srv://voker:voker@cluster0.dsle1da.mongodb.net/catbot?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,    
    family: 4                          
}).catch(err => console.error('MongoDB Error:', err.message));

const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    Browsers
} = await import('@whiskeysockets/baileys');

if (!existsSync('./tmp')) mkdirSync('./tmp');
if (!existsSync('./sessions')) mkdirSync('./sessions');

console.clear();
cfonts.say('Guilty', { font: 'slick', align: 'center', colors: ['cyan', 'white'], letterSpacing: 2 });
console.log(chalk.cyan('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

const sessionPath = './sessions';
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();


const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
global.groupCache = new Map();

const connectionOptions = {
  version,
  logger: pino({ level: 'fatal' }), 
  printQRInTerminal: false,
  browser: Browsers.ubuntu("Chrome"),
  auth: {
    creds: state.creds,
    
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })), 
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: false,
  syncFullHistory: false,
  msgRetryCounterCache,
  connectTimeoutMs: 60000, 
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  getMessage: async () => ({ conversation: "" })
};

global.conn = makeWASocket(connectionOptions);


if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (t) => new Promise((r) => rl.question(t, r));
    let phoneNumber = await question(chalk.cyan('┃ ') + `Número: `);
    let addNumber = phoneNumber.replace(/\D/g, '');
    setTimeout(async () => {
        try {
            let codeBot = await conn.requestPairingCode(addNumber);
            console.log(chalk.cyan('┃ ') + chalk.white.bold('CÓDIGO: ') + chalk.cyan.bold(codeBot?.match(/.{1,4}/g)?.join("-") || codeBot));
        } catch (e) { console.error('Error al generar código:', e); }
    }, 3000);
}

const cleanSessions = async () => {
    const files = await fsP.readdir(sessionPath);
    const limit = 3 * 24 * 60 * 60 * 1000;
    await Promise.all(files.map(async (file) => {
        if (file === 'creds.json' || file.startsWith('app-state')) return;
        const filePath = join(sessionPath, file);
        try {
            const st = await fsP.stat(filePath);
            if (Date.now() - st.mtimeMs > limit) await fsP.unlink(filePath);
        } catch {}
    }));
};

let messageHandler;
const loadHandler = async () => {
    try {
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        messageHandler = module.message || module.default?.message || module.default;
    } catch (e) { console.error('Error cargando Handler:', e); }
};
await loadHandler();
watch(path.join(process.cwd(), 'lib/message.js'), loadHandler);

global.reload = async function(restatConn) {
  if (restatConn) {
    try { global.conn.ws.close(); } catch {}
    global.conn = makeWASocket(connectionOptions);
  }

  global.conn.ev.on('messages.upsert', async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg || !msg.message) return;
    try {
        const m = await smsg(conn, msg);
        if (messageHandler) await messageHandler.call(conn, m, chatUpdate);
    } catch (e) { console.error('Error en mensaje:', e); }
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log(chalk.red(`┃ Conexión cerrada. Razón: ${reason}`));
        
        if (reason !== DisconnectReason.loggedOut) {
            global.reload(true);
        } else {
            process.exit(1);
        }
    }

    if (connection === 'open') {
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: ONLINE`));
        console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
        await cleanSessions();
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
};

await global.reload();

global.plugins = new Map();
async function loadPlugins(folder) {
  const files = await fsP.readdir(folder);
  for (let filename of files) {
    const file = join(folder, filename);
    const st = await fsP.stat(file);
    if (st.isDirectory()) await loadPlugins(file);
    else if (filename.endsWith('.js')) {
      try {
        const module = await import(`file://${file}`);
        global.plugins.set(filename, module.default || module);
      } catch (e) { console.error(`Error en plugin ${filename}:`, e.message); }
    }
  }
}
await loadPlugins(join(process.cwd(), './plugins'));
