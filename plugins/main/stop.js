import fs from 'fs';
import path from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const stopSubBot = {
    name: 'stop',
    alias: ['detener', 'logout', 'desconectar'],
    category: 'main',
    run: async (m, { conn }) => {
        const id = m.sender.split('@')[0];
        const authFolder = path.join(process.cwd(), 'sessions/jadibts', id);

        const subBot = global.conns.find(c => jidNormalizedUser(c.user?.id) === jidNormalizedUser(m.sender));

        if (!subBot) {
            return m.reply('*NO TIENES UNA SESIÓN ACTIVA EN ESTE MOMENTO*');
        }

        try {
            subBot.logout(); 
            subBot.end();
            
            global.conns = global.conns.filter(c => jidNormalizedUser(c.user?.id) !== jidNormalizedUser(m.sender));

            if (fs.existsSync(authFolder)) {
                fs.rmSync(authFolder, { recursive: true, force: true });
            }

            await m.reply('*SESIÓN FINALIZADA Y DATOS ELIMINADOS CORRECTAMENTE*');
        } catch (e) {
            m.reply('*ERROR AL INTENTAR CERRAR LA SESIÓN*');
        }
    }
};

export default stopSubBot;
