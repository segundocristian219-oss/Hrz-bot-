import os from 'os';
import { performance, monitorEventLoopDelay } from 'perf_hooks';

export default {
    name: 'ping',
    alias: ['speed', 'status'],
    category: 'system',
    run: async function (m, { conn }) {
        const hld = monitorEventLoopDelay();
        hld.enable();
        
        const start = performance.now();
        await m.react('✅');
        const end = performance.now();
        
        hld.disable();
        const speed = (end - start).toFixed(0);
        const loopDelay = (hld.mean / 1e6).toFixed(2);

        const cpus = os.cpus();
        const cpuModel = cpus[0].model.replace(/\s+/g, ' ').trim();
        const cpuSpeed = cpus[0].speed;
        const load = os.loadavg();
        
        const totalRam = (os.totalmem() / (1024 ** 3)).toFixed(2);
        const freeRam = (os.freemem() / (1024 ** 3)).toFixed(2);
        const usedRam = (totalRam - freeRam).toFixed(2);

        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const response = `
*» Speed* : ${speed} _ms_
*» Latency* : ${loopDelay} _ms_
*» Processor* : ${cpuModel}
*» CPU* : ${cpuSpeed} MHz
*» Cores* : ${cpus.length}
*» Load* : ${((load[0] / cpus.length) * 100).toFixed(1)}%
*» RAM* : ${usedRam} GB / ${totalRam} GB
*» Platform* : ${os.platform()} ${os.arch()}
*» Active time* : ${days} days, ${hours} hour, ${minutes} minutes, ${seconds} seconds
`.trim();

        await conn.sendMessage(m.chat, { text: response }, { quoted: m });
    }
};
