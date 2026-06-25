import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'workerRouter.js');

const MAX_WORKERS = 6;
const TASK_TIMEOUT = 60000;
const IDLE_TIMEOUT = 300000;

class PersistentWorker {
    constructor() {
        this.busy = false;
        this.lastUsed = Date.now();
        this.currentResolve = null;
        this.currentReject = null;
        this.timer = null;
        this.isSpawning = false;
        this._spawn();
    }

    _spawn() {
        if (this.isSpawning) return;
        this.isSpawning = true;

        if (this.worker) {
            this.worker.removeAllListeners();
        }

        this.worker = new Worker(WORKER_PATH);
        this.isSpawning = false;

        this.worker.on('message', (msg) => {
            this.busy = false;
            this.lastUsed = Date.now();
            if (this.timer) { clearTimeout(this.timer); this.timer = null; }
            if (msg.success) {
                if (msg.result && msg.result.isBuffer && msg.result.data) {
                    msg.result.buffer = Buffer.from(msg.result.data);
                    delete msg.result.data;
                    delete msg.result.isBuffer;
                }
                this.currentResolve?.(msg.result);
            } else {
                this.currentReject?.(new Error(msg.error));
            }
            this.currentResolve = null;
            this.currentReject = null;
            processQueue();
        });

        this.worker.on('error', (err) => {
            this.busy = false;
            if (this.timer) { clearTimeout(this.timer); this.timer = null; }
            this.currentReject?.(err);
            this.currentResolve = null;
            this.currentReject = null;
            
            setTimeout(() => {
                this._spawn();
                processQueue();
            }, 1000);
        });

        this.worker.on('exit', (code) => {
            if (this.busy) {
                this.currentReject?.(new Error(`Worker terminado inesperadamente con código ${code}`));
                this.currentResolve = null;
                this.currentReject = null;
                this.busy = false;
            }
        });
    }

    run(task) {
        return new Promise((resolve, reject) => {
            this.busy = true;
            this.currentResolve = resolve;
            this.currentReject = reject;
            this.timer = setTimeout(() => {
                this.busy = false;
                this.currentResolve = null;
                this.currentReject = null;
                reject(new Error('Worker timeout'));
                this.terminate();
                this._spawn();
                processQueue();
            }, TASK_TIMEOUT);
            this.worker.postMessage(task);
        });
    }

    terminate() {
        try { 
            this.worker.terminate(); 
            this.worker.removeAllListeners();
        } catch (_) {}
    }
}

const pool = [];
const queue = [];

for (let i = 0; i < MAX_WORKERS; i++) pool.push(new PersistentWorker());

setInterval(() => {
    const now = Date.now();
    for (const w of pool) {
        if (!w.busy && now - w.lastUsed > IDLE_TIMEOUT) {
            w.terminate();
            w._spawn();
        }
    }
}, 60000);

function processQueue() {
    if (!queue.length) return;
    const free = pool.find(w => !w.busy);
    if (!free) return;
    const { task, resolve, reject } = queue.shift();
    free.run(task).then(resolve).catch(reject);
}

export function dispatchMediaTask(task) {
    const free = pool.find(w => !w.busy);
    if (free) return free.run(task);
    return new Promise((resolve, reject) => queue.push({ task, resolve, reject }));
}

export function getWorkerStats() {
    return { active: pool.filter(w => w.busy).length, idle: pool.filter(w => !w.busy).length, queued: queue.length, total: pool.length };
}
