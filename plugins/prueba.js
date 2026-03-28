import axios from 'axios';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const pierce = {
    name: 'pierce',
    alias: ['perforar', 'reveal', 'origin'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        
        if (!args[0]) return m.reply('*[!] INGRESA LA URL A PERFORAR*');

        try {
            const target = args[0].startsWith('http') ? args[0] : `https://${args[0]}`;
            
            const res = await axios.get(target, {
                timeout: 15000,
                maxRedirects: 8,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'X-Forwarded-For': '1.1.1.1',
                    'X-Real-IP': '1.1.1.1',
                    'Accept': '*/*',
                    'X-Forwarded-Proto': 'https'
                }
            });

            const h = res.headers;
            
            // 1. Detección de Fugas en Cabeceras (Leaks)
            const originLeak = h['x-orig-dest'] || h['x-backend-host'] || h['x-host'] || h['x-origin-server'] || 'No filtrado';
            
            // 2. Identificación de Infraestructura Interna
            const serverInfo = {
                backend: h['server'] || 'Desconocido',
                cdn: h['cf-ray'] ? 'Cloudflare' : h['x-vercel-id'] ? 'Vercel Edge' : h['x-amz-cf-id'] ? 'AWS' : 'N/A',
                k8s: h['x-kubernetes-footer'] || 'No detectado',
                powered: h['x-powered-by'] || 'Oculto'
            };

            // 3. Trazado de IP y Nodo
            const ipData = res.request?.res?.socket?.remoteAddress || 'Protegida';
            
            // 4. Análisis de Enmascaramiento Dinámico
            let maskType = 'Nivel Bajo (Transparente)';
            if (h['cf-ray'] || h['x-vercel-id']) maskType = 'Nivel Alto (Proxy Ciego)';
            if (h['via']) maskType = 'Nivel Medio (Puerta de enlace)';

            let report = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            report += `┃  *PERFORADOR DE MÁSCARAS URL* ┃\n`;
            report += `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
            report += `┃\n`;
            report += `┃  *── [ ORIGEN DETECTADO ] ──*\n`;
            report += `┃  *HOST REAL:* ${originLeak}\n`;
            report += `┃  *IP NODO:* ${ipData}\n`;
            report += `┃  *POWERED:* ${serverInfo.powered}\n`;
            report += `┃\n`;
            report += `┃  *── [ CAPA DE ENMASCARAMIENTO ] ──*\n`;
            report += `┃  *TIPO:* ${maskType}\n`;
            report += `┃  *PROVEEDOR:* ${serverInfo.cdn}\n`;
            report += `┃  *VIA:* ${h['via'] || 'Directo'}\n`;
            report += `┃\n`;
            report += `┃  *── [ CABECERAS CRÍTICAS ] ──*\n`;
            report += `┃  *CACHE:* ${h['cf-cache-status'] || h['x-vercel-cache'] || 'MISS'}\n`;
            report += `┃  *LOCATION:* ${h['location'] || 'Final'}\n`;
            report += `┃  *REMAINDER:* ${h['server-timing'] ? 'Si (Fuga de tiempo)' : 'No'}\n`;
            report += `┃\n`;
            report += `┃  *── [ RASTREO DE ARCHIVO ] ──*\n`;
            report += `┃  *MIME:* ${h['content-type']}\n`;
            report += `┃  *HASH:* ${h['etag'] || 'Sin ETag'}\n`;
            report += `┃\n`;
            report += `┃  *ANÁLISIS:* El sistema usa un \n`;
            report += `┃  ${serverInfo.cdn} para ocultar el \n`;
            report += `┃  bucket/servidor real.\n`;
            report += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

            await conn.sendMessage(m.chat, { text: report }, { quoted: m });

        } catch (e) {
            await m.reply(`*ERROR EN PERFORACIÓN:* ${e.message}`);
        }
    }
};

export default pierce;
