import axios from 'axios';
import * as cheerio from 'cheerio';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const inspect = {
    name: 'inspect',
    alias: ['analizar', 'investigar', 'trace'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        
        if (!args[0]) return m.reply('*[!] INGRESA LA URL A INVESTIGAR*');

        try {
            const queryUrl = args[0].startsWith('http') ? args[0] : `https://${args[0]}`;
            const startTime = Date.now();

            const res = await axios.get(queryUrl, {
                timeout: 15000,
                maxRedirects: 10,
                validateStatus: () => true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Cache-Control': 'no-cache'
                }
            });

            const $ = cheerio.load(res.data || '');
            const headers = res.headers;
            const socket = res.request?.res?.socket || res.request?.socket || {};
            
            const infra = {
                ip: socket.remoteAddress || 'Oculta/Proxy',
                port: socket.remotePort || 'N/A',
                protocol: socket.alpnProtocol || 'HTTP/1.1',
                server: headers['server'] || 'No detectado',
                cdn: headers['cf-ray'] ? 'Cloudflare' : headers['x-vercel-id'] ? 'Vercel Edge' : headers['x-amz-cf-id'] ? 'AWS CloudFront' : 'Directo',
                cache: headers['cf-cache-status'] || headers['x-vercel-cache'] || headers['x-cache'] || 'MISS',
                provider: headers['x-powered-by'] || 'Protegido',
                location: headers['x-vercel-ip-country'] || headers['cf-ipcountry'] || 'Desconocida'
            };

            const security = {
                hsts: headers['strict-transport-security'] ? 'Activo' : 'Inactivo',
                cors: headers['access-control-allow-origin'] || 'Restringido',
                csp: headers['content-security-policy'] ? 'Configurado' : 'Abierto',
                frame: headers['x-frame-options'] || 'No definido'
            };

            const meta = {
                title: ($('title').text() || $('meta[property="og:title"]').attr('content') || 'N/A').trim(),
                type: headers['content-type']?.split(';')[0] || 'Desconocido',
                size: headers['content-length'] ? `${(headers['content-length'] / 1024).toFixed(2)} KB` : 'Indeterminado'
            };

            let report = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            report += `┃  *INVESTIGADOR DE INFRAESTRUCTURA* ┃\n`;
            report += `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
            report += `┃\n`;
            report += `┃  *── [ NODO DE RED ] ──*\n`;
            report += `┃  *IP:* ${infra.ip}\n`;
            report += `┃  *PUERTO:* ${infra.port} | *PROT:* ${infra.protocol}\n`;
            report += `┃  *REGIÓN:* ${infra.location}\n`;
            report += `┃\n`;
            report += `┃  *── [ CAPA DE SERVICIO ] ──*\n`;
            report += `┃  *CDN/WAF:* ${infra.cdn}\n`;
            report += `┃  *SERVER:* ${infra.server}\n`;
            report += `┃  *TECNOLOGÍA:* ${infra.provider}\n`;
            report += `┃  *ESTADO CACHÉ:* ${infra.cache}\n`;
            report += `┃\n`;
            report += `┃  *── [ SEGURIDAD & CORS ] ──*\n`;
            report += `┃  *CORS POLICY:* ${security.cors}\n`;
            report += `┃  *HSTS:* ${security.hsts}\n`;
            report += `┃  *X-FRAME:* ${security.frame}\n`;
            report += `┃\n`;
            report += `┃  *── [ DATOS DEL RECURSO ] ──*\n`;
            report += `┃  *TIPO:* ${meta.type}\n`;
            report += `┃  *PESO:* ${meta.size}\n`;
            report += `┃  *LATENCIA:* ${Date.now() - startTime}ms\n`;
            report += `┃\n`;
            report += `┃  *URL ANALIZADA:*\n`;
            report += `┃  ${queryUrl.slice(0, 45)}...\n`;
            report += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

            await conn.sendMessage(m.chat, { text: report }, { quoted: m });

        } catch (e) {
            await m.reply(`*FALLO CRÍTICO EN INVESTIGACIÓN:*\n${e.message}`);
        }
    }
};

export default inspect;
