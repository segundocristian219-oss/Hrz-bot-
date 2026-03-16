import cp, { exec as _exec } from 'child_process';
import { promisify } from 'util';

const exec = promisify(_exec).bind(cp);

const shellCommand = {
    name: 'shell',
    alias: ['$'],
    category: 'owner',
    run: async (m, { conn, text, command, isROwner }) => {
        if (!isROwner) return;
        if (global.conn.user.jid != conn.user.jid) return;

        if (!text) return;

        await m.react('🕓');
        
        let o;
        try {
            o = await exec(text.trim());
        } catch (e) {
            o = e;
        } finally {
            const { stdout, stderr } = o;
            if (stdout && stdout.trim()) await m.reply(stdout.trim());
            if (stderr && stderr.trim()) await m.reply(stderr.trim());
            await m.react('✅');
        }
    }
};

export default shellCommand;
