import os from 'os';
import { performance, monitorEventLoopDelay } from 'perf_hooks';

const hrduration = (ms) => {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const h = Math.floor(ms / (1000 * 60 * 60));
    return `${h}h ${m}m ${s}s`;
};

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
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const heapPct = ((usedMem.heapUsed / usedMem.heapTotal) * 100).toFixed(2);
        
        const load = os.loadavg();
        const cpuCount = os.cpus().length;
        const loadRatio = (load[0] / cpuCount).toFixed(2);

        let systemStatus = 'OPTIMAL';
        if (loadRatio > 0.7 || elpDelay > 100) systemStatus = 'CONGESTED';
        if (loadRatio > 1.0 || elpDelay > 500) systemStatus = 'CRITICAL_OVERLOAD';

        const statusReport = `
[ REPORTE DE SALUD VOKER ]
---------------------------------------
> LATENCIA RED: ${latency} ms
> RETRASO HILO: ${elpDelay} ms
> UPTIME: ${hrduration(process.uptime() * 1000)}

[ ANALISIS DE CARGA ]
+ CORES DETECTADOS: ${cpuCount}
+ CARGA 1M: ${load[0].toFixed(2)}
+ RATIO DE CARGA: ${loadRatio}
+ NIVEL DE TRABAJO: ${(loadRatio * 100).toFixed(2)}%

[ GESTION DE MEMORIA ]
- RSS (FISICA): ${(usedMem.rss / 1024 / 1024).toFixed(2)} MB
- HEAP TOTAL: ${(usedMem.heapTotal / 1024 / 1024).toFixed(2)} MB
- HEAP USADO: ${(usedMem.heapUsed / 1024 / 1024).toFixed(2)} MB (${heapPct}%)
- DISPONIBLE SRV: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB

[ ENTORNO ]
- NODE: ${process.version}
- PLATAFORMA: ${os.platform()}
---------------------------------------
DIAGNOSTICO: ${systemStatus}
`.trim();

        await conn.sendMessage(m.chat, { text: statusReport }, { quoted: m });
    }
};
