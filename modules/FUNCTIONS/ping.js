import os from 'os';
import { performance, monitorEventLoopDelay } from 'perf_hooks';
import process from 'process';

export const pingCommand = {
    category: 'system',
    commands: {
        ping: {
            name: 'ping',
            alias: ['speed', 'status'],
            run: async function (m, { conn }) {
                const hld = monitorEventLoopDelay();
                hld.enable();

                const start = performance.now();
                await m.react('✅');
                const end = performance.now();

                hld.disable();

                const cpus = os.cpus();
                const cpuModel = cpus[0].model.replace(/\s+/g, ' ').trim();
                const load = os.loadavg()[0];
                const cpuUsage = ((load / cpus.length) * 100).toFixed(1);

                const totalRam = os.totalmem();
                const freeRam = os.freemem();
                const usedRam = totalRam - freeRam;
                const ramPercent = ((usedRam / totalRam) * 100).toFixed(1);

                const uptime = process.uptime();
                const days = Math.floor(uptime / 86400);
                const hours = Math.floor((uptime % 86400) / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = Math.floor(uptime % 60);

                const processMemory = (process.memoryUsage().rss / 1024 / 1024 / 1024).toFixed(2);

                const response = `
*» SISTEMA DE MONITOREO*
*» Latencia* : ${(end - start).toFixed(0)} ms
*» Event Loop* : ${(hld.mean / 1e6).toFixed(3)} ms
*» CPU Modelo* : ${cpuModel}
*» Núcleos* : ${cpus.length}
*» Carga CPU* : ${cpuUsage}%
*» RAM Total* : ${(totalRam / 1e9).toFixed(2)} GB
*» RAM Uso* : ${(usedRam / 1e9).toFixed(2)} GB (${ramPercent}%)
*» RAM Bot* : ${processMemory} GB
*» Plataforma* : ${os.platform()} (${os.arch()})
*» Node.js* : ${process.version}
*» Tiempo Activo* : ${days}d ${hours}h ${minutes}m ${seconds}s
`.trim();

                await conn.sendMessage(m.chat, { text: response }, { quoted: m });
            }
        }
    }
};
