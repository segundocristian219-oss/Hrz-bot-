import axios from 'axios';
import * as cheerio from 'cheerio';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const inspect = {
    name: 'inspect',
    alias: ['trace', 'mask', 'investigar'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        
        if (!args[0]) return m.reply('*[!] INGRESA LA URL MÁSCARA*');

        try {
            const queryUrl = args[0].startsWith('http') ? args[0] : `https://${args[0]}`;
            const startTime = Date.now();

            const res = await axios.get(queryUrl, {
                timeout: 15000,
                maxRedirects: 10,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'X-Forwarded-For': '127.0.0.1', 
                    'Accept': '*/*'
                }
            });

            const h = res.headers;
            
            const masking = {
                isMasked: (h['via'] || h['x-forwarded-for'] || h['cf-ray'] || h['x-vercel-id']) ? 'SÍ' : 'PROBABLE',
                via: h['via'] || 'No declarado',
                forwarded: h['x-forwarded-for'] || h['x-real-ip'] || 'Oculto por Proxy',
                backend: h['server'] || 'Desconocido',
                timing: h['server-timing'] || 'N/A',
                upstream: h['x-powered-by'] || h['x-aspnet-version'] || h['x-redirect-by'] || 'No filtrado'
            };

            const trace = {
                ip: res.request?.res?.socket?.remoteAddress || 'Protegida',
                location: h['cf-ipcountry'] || h['x-vercel-ip-country'] || 'Desconocida',
                cacheStatus: h['x-cache'] || h['cf-cache-status'] || h['x-vercel-cache'] || 'MISS',
                corsOrigin: h['access-control-allow-origin'] || 'None'
            };

            let report = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            report += `┃  *DETECTOR DE ENMASCARAMIENTO* ┃\n`;
            report += `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
            report += `┃\n`;
            report += `┃  *── [ ANÁLISIS DE MÁSCARA ] ──*\n`;
            report += `┃  *PROXY DETECTADO:* ${masking.isMasked}\n`;
            report += `┃  *VIA (SALTO):* ${masking.via}\n`;
            report += `┃  *SERVER MÁSCARA:* ${masking.backend}\n`;
            report += `┃  *TECNOLOGÍA:* ${masking.upstream}\n`;
            report += `┃\n`;
            report += `┃  *── [ RASTREO DE ORIGEN ] ──*\n`;
            report += `┃  *IP PÚBLICA:* ${trace.ip}\n`;
            report += `┃  *PAÍS NODO:* ${trace.location}\n`;
            report += `┃  *CORS ORIGIN:* ${trace.corsOrigin}\n`;
            report += `┃  *CACHÉ STATUS:* ${trace.cacheStatus}\n`;
            report += `┃\n`;
            report += `┃  *── [ HUELLA DIGITAL ] ──*\n`;
            report += `┃  *TIPO:* ${h['content-type']}\n`;
            report += `┃  *TIMING:* ${masking.timing.slice(0, 25)}\n`;
            report += `┃  *LATENCIA:* ${Date.now() - startTime}ms\n`;
            report += `┃\n`;
            report += `┃  *INFO:* Si 'CORS ORIGIN' es un \n`;
            report += `┃  dominio distinto a la URL,\n`;
            report += `┃  ese es el servidor REAL.\n`;
            report += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

            await conn.sendMessage(m.chat, { text: report }, { quoted: m });

        } catch (e) {
            await m.reply(`*ERROR EN TRAZADO:* ${e.message}`);
        }
    }
};

export default inspect;
