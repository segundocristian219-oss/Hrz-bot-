import os from 'os';
import { performance, monitorEventLoopDelay } from 'perf_hooks';

export default {
    name: 'ping',
    alias: ['status'],
    category: 'system',
    run: async function (m, { conn }) {
        const hld = monitorEventLoopDelay();
        hld.enable();
        
        const start = performance.now();
        await m.react('✅');
        const end = performance.now();
        const latency = (end - start).toFixed(3);
        
        hld.disable();
        const elpDelay = (hld.mean / 1e6).toFixed(3);

        const usedMem = process.memoryUsage();
        const load = os.loadavg();
        const cpuCount = os.cpus().length;
        const loadRatio = (load[0] / cpuCount).toFixed(2);

        const statusReport = `
[ MONITOR VOKER PRO ]
---------------------------------------
> LATENCIA RED: ${latency} ms
> DELAY HILO: ${elpDelay} ms
> UPTIME: ${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s

[ CARGA DE PROCESAMIENTO ]
+ CORES: ${cpuCount}
+ CARGA 1M: ${load[0].toFixed(2)}
+ USO RELATIVO: ${(loadRatio * 100).toFixed(2)}%
+ ESTADO I/O: ${load[0] > cpuCount ? 'CONGESTIONADO' : 'FLUIDO'}

[ MEMORIA DINAMICA ]
- RSS: ${(usedMem.rss / 1024 / 1024).toFixed(2)} MB
- HEAP USADO: ${(usedMem.heapUsed / 1024 / 1024).toFixed(2)} MB
- HEAP TOTAL: ${(usedMem.heapTotal / 1024 / 1024).toFixed(2)} MB

[ INFRAESTRUCTURA ]
- DB: MONGODB CLOUD (REMOTE)
- STORAGE: FS_PLUGINS_MAP
---------------------------------------
DIAGNOSTICO: ${loadRatio > 0.8 ? 'ADVERTENCIA_POR_CARGA' : 'SISTEMA_OPERATIVO'}
`.trim();

        await conn.sendMessage(m.chat, { text: statusReport }, { quoted: m });
    }
};
