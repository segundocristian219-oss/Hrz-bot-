import axios from 'axios';
import * as cheerio from 'cheerio';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const inspect = {
    name: 'inspect',
    alias: ['urlinfo', 'analizar', 'infra'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        
        if (!args[0]) return m.reply('*[!] INGRESA UNA URL*');

        try {
            const queryUrl = args[0].startsWith('http') ? args[0] : `https://${args[0]}`;
            
            const response = await axios.get(queryUrl, {
                timeout: 12000,
                maxRedirects: 5,
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
                }
            });

            const $ = cheerio.load(response.data);
            const finalUrl = response.request?.res?.responseUrl || queryUrl;
            
            const socket = response.request?.res?.socket || response.request?.socket || {};
            const ip = socket.remoteAddress || 'No accesible';

            const scripts = [];
            $('script[src]').each((_, el) => {
                const src = $(el).attr('src');
                if (src) scripts.push(src.split('?')[0]);
            });

            const detectCloud = (s) => {
                if (s.includes('cloudflare')) return 'Cloudflare';
                if (s.includes('cloudfront')) return 'AWS CloudFront';
                if (s.includes('akamai')) return 'Akamai';
                if (s.includes('vercel')) return 'Vercel Edge';
                return null;
            };

            const proxyFound = [...new Set(scripts.map(detectCloud).filter(Boolean))].join(', ') || 'Directo / Desconocido';

            const info = {
                title: ($('title').text() || $('meta[property="og:title"]').attr('content') || 'Sin título').trim(),
                server: response.headers['server'] || 'Oculto',
                poweredBy: response.headers['x-powered-by'] || 'No declarado',
                type: response.headers['content-type']?.split(';')[0] || 'Desconocido',
                cache: response.headers['cf-cache-status'] || response.headers['x-cache'] || 'N/A'
            };

            let report = `┏━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            report += `┃  *REPORTE DE INFRAESTRUCTURA* ┃\n`;
            report += `┃\n`;
            report += `┃  *WEB:* ${info.title.slice(0, 30)}\n`;
            report += `┃  *IP:* ${ip}\n`;
            report += `┃  *PROXY/CDN:* ${proxyFound}\n`;
            report += `┃  *SERVER:* ${info.server}\n`;
            report += `┃  *ENGINE:* ${info.poweredBy}\n`;
            report += `┃  *CACHE:* ${info.cache}\n`;
            report += `┃  *URL:* ${finalUrl.slice(0, 35)}...\n`;
            report += `┃\n`;
            report += `┃  *SCRIPTS DETECTADOS:* ${scripts.length}\n`;
            report += `┗━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

            await conn.sendMessage(m.chat, { text: report }, { quoted: m });

        } catch (e) {
            await m.reply(`*ERROR DE ANÁLISIS:*\n${e.message}`);
        }
    }
};

export default inspect;
