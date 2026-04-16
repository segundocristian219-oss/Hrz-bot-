import os from 'os';
import { performance } from 'perf_hooks';

export default {
    name: 'ping',
    alias: ['status'],
    category: 'system',
    run: async function (m, { conn }) {
        const start = performance.now();
        await m.react('✅');
        const end = performance.now();
        const latency = (end - start).toFixed(3);

        const usedMem = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        
        const load = os.loadavg();
        const cpuCount = os.cpus().length;
        const cpuUsage = ((load[0] * 100) / cpuCount).toFixed(2);

        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const statusReport = `
[ SISTEMA VOKER | MONITOREO ]
---------------------------------------
> LATENCIA: ${latency} ms
> UPTIME: ${hours}h ${minutes}m ${seconds}s
> CARGA CPU: ${cpuUsage}% (${cpuCount} Cores)

[ ESTADO DE MEMORIA RAM ]
+ RSS ACTUAL: ${(usedMem.rss / 1024 / 1024).toFixed(2)} MB
+ HEAP TOTAL: ${(usedMem.heapTotal / 1024 / 1024).toFixed(2)} MB
+ HEAP USADO: ${(usedMem.heapUsed / 1024 / 1024).toFixed(2)} MB
+ DISPONIBLE: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB

[ DETALLES TECNICOS ]
- PLATAFORMA: ${os.platform()} ${os.arch()}
- NODE VERSION: ${process.version}
- SERVER LOAD (1M): ${load[0].toFixed(2)}
---------------------------------------
STATUS: ${cpuUsage > 80 ? 'CRITICAL_LOAD' : 'STABLE_SYSTEM'}
`.trim();

        await conn.sendMessage(m.chat, { text: statusReport }, { quoted: m });
    }
};
