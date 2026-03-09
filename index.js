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
import readline from 'readline'; // Corregido el error de escritura anterior
import cfonts from 'cfonts';
import mongoose from 'mongoose';
import { smsg } from './lib/serializer.js';
import { EventEmitter } from 'events';

// --- DEFINICIONES DE RUTA (Soluciona el error de la imagen) ---
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};

// Configuración de Consola
const originalLog = console.log;
console.log = (...args) => originalLog.apply(console, [chalk.cyan('┃'), ...args]);
const originalError = console.error;
console.error = (...args) => originalError.apply(console, [chalk.red('┗'), ...args]);

EventEmitter.defaultMaxListeners = 0;

// Conexión a Base de Datos
mongoose.connect('mongodb+srv://voker:voker@cluster0.dsle1da.mongodb.net/catbot?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,    
    family: 4                          
}).catch(err => console.error('Error DB:', err.message));

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
cfonts.say('Guilty', { font: 'slick', align: 'center', colors: ['cyan', 'white'], letterSpacing: 2 });

const sessionPath = './sessions';
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

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
  syncFullHistory: false,
  msgRetryCounterCache,
  connectTimeoutMs: 60000,
  keepAliveIntervalMs: 15000,
  emitOwnEvents: true,
  getMessage: async () => ({ conversation: "" })
};

global.conn = makeWASocket(connectionOptions);

// Pairing Code
if (!state.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (t) => new Promise((r) => rl.question(t, r));
    let phoneNumber = await question(chalk.cyan('┃ ') + `Número: `);
    let addNumber = phoneNumber.replace(/\D/g, '');
    setTimeout(async () => {
        try {
            let codeBot = await conn.requestPairingCode(addNumber);
            console.log(chalk.cyan('┃ ') + chalk.bgWhite.black.bold(` CÓDIGO: ${codeBot?.match(/.{1,4}/g)?.join("-") || codeBot} `));
        } catch (e) { console.error(e); }
    }, 3000);
}

// Limpieza de Sesión (Automática cada 3 días)
const cleanSessions = async () => {
    try {
        const files = await fsP.readdir(sessionPath);
        const limit = 3 * 24 * 60 * 60 * 1000;
        await Promise.all(files.map(async (file) => {
            if (file === 'creds.json') return;
            const st = await fsP.stat(join(sessionPath, file));
            if (Date.now() - st.mtimeMs > limit) await fsP.unlink(join(sessionPath, file));
        }));
    } catch {}
};

let messageHandler;
const loadHandler = async () => {
    try {
        const Path = path.join(process.cwd(), 'lib/message.js');
        const module = await import(`file://${Path}?update=${Date.now()}`);
        messageHandler = module.message || module.default?.message || module.default;
    } catch (e) { console.error('Error en Handler:', e); }
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
    } catch (e) { console.error(e); }
  });

  global.conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) setTimeout(() => global.reload(true), 3000);
    }
    if (connection === 'open') {
        console.log(chalk.cyan('┃ ') + chalk.greenBright.bold(`STATUS: ONLINE`));
        await cleanSessions();
    }
  });

  global.conn.ev.on('creds.update', saveCreds);
};

await global.reload();
