import axios from 'axios';
import * as cheerio from 'cheerio';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const inspect = {
    name: 'inspect',
    alias: ['urlinfo', 'analizar'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        

        if (!args[0]) return m.reply('*[!] INGRESA UNA URL PARA ANALIZAR*');

        try {
            const queryUrl = args[0].startsWith('http') ? args[0] : `https://${args[0]}`;
            
            const response = await axios.get(queryUrl, {
                timeout: 10000,
                maxRedirects: 5,
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' 
                }
            });

            const $ = cheerio.load(response.data);
            const finalUrl = response.request.res.responseUrl || queryUrl;
            
            const info = {
                title: $('title').text() || $('meta[property="og:title"]').attr('content') || 'Sin título',
                description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || 'Sin descripción',
                server: response.headers['server'] || 'No detectado',
                poweredBy: response.headers['x-powered-by'] || 'No declarado',
                contentType: response.headers['content-type'] || 'Desconocido',
                contentLen: response.headers['content-length'] ? `${(response.headers['content-length'] / 1024).toFixed(2)} KB` : 'Variable',
                ip: response.request.res.socket.remoteAddress || 'Protegida'
            };

            let report = `┏━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            report += `┃  *REPORTE TÉCNICO DE URL* ┃\n`;
            report += `┃\n`;
            report += `┃  *WEB:* ${info.title.trim()}\n`;
            report += `┃  *URL FINAL:* ${finalUrl}\n`;
            report += `┃  *IP ORIGEN:* ${info.ip}\n`;
            report += `┃  *SERVIDOR:* ${info.server}\n`;
            report += `┃  *TECNOLOGÍA:* ${info.poweredBy}\n`;
            report += `┃  *TIPO:* ${info.contentType}\n`;
            report += `┃  *PESO:* ${info.contentLen}\n`;
            report += `┃\n`;
            report += `┃  *DESCRIPCIÓN:*\n`;
            report += `┃  ${info.description.trim().slice(0, 200)}...\n`;
            report += `┗━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

            await conn.sendMessage(m.chat, { text: report }, { quoted: m });

        } catch (e) {
            await m.reply(`*ERROR AL INVESTIGAR URL:*\n${e.message}`);
        }
    }
};

export default inspect;
