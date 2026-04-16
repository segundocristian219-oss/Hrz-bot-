import os from 'os';
import fs from 'fs';
import { performance, monitorEventLoopDelay } from 'perf_hooks';

export default {
    name: 'ping',
    alias: ['status', 'm', 'voker'],
    category: 'system',
    run: async function (m, { conn }) {
        const hld = monitorEventLoopDelay();
        hld.enable();
        
        const start = performance.now();
        await m.react('✅');
        const end = performance.now();
        const redLatency = (end - start).toFixed(3);
        
        hld.disable();
        const cpuDelay = (hld.mean / 1e6).toFixed(3);

        const usedMem = process.memoryUsage();
        const load = os.loadavg();
        const cpuCount = os.cpus().length;
        
        let openFiles = 'N/A';
        try {
            openFiles = fs.readdirSync('/proc/self/fd').length;
        } catch (e) {
            openFiles = 'ERR';
        }

        const uptime = process.uptime();
        const hrs = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);

        const statusReport = `
[ REPORTE TECNICO ]
---------------------------------------
> LATENCIA RED: ${redLatency} ms
> DELAY HILO: ${cpuDelay} ms
> UPTIME: ${hrs}h ${mins}m

[ RECURSOS DEL SERVIDOR ]
+ CARGA 1M: ${load[0].toFixed(2)}
+ CARGA 5M: ${load[1].toFixed(2)}
+ USO DE CORES: ${((load[0] / cpuCount) * 100).toFixed(2)}%
+ TOTAL CORES: ${cpuCount}

[ GESTION DE ARCHIVOS Y SOCKETS ]
- SOCKETS ABIERTOS: ${openFiles}
- LIMITE SISTEMA: 524288
- ESTADO FD: ${openFiles > 1000 ? 'FUGA_DETECTADA' : 'NORMAL'}

[ MEMORIA RAM ]
- RSS (REAL): ${(usedMem.rss / 1024 / 1024).toFixed(2)} MB
- HEAP TOTAL: ${(usedMem.heapTotal / 1024 / 1024).toFixed(2)} MB
- HEAP USADO: ${(usedMem.heapUsed / 1024 / 1024).toFixed(2)} MB

[ INFRAESTRUCTURA ]
- INSTANCIAS: 34 SUB-BOTS
- DB: MONGODB_REMOTE
- PLATAFORMA: ${os.platform()}
---------------------------------------
DIAGNOSTICO: ${load[0] > cpuCount ? 'CRITICAL_LOAD' : 'SYSTEM_STABLE'}
`.trim();

        await conn.sendMessage(m.chat, { text: statusReport }, { quoted: m });
    }
};
