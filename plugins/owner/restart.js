const restartCommand = {
    name: 'restart',
    alias: ['reiniciar', 'reboot'],
    category: 'owner',
    run: async (m, { conn }) => {
        const owners = (global.owner || []).map(owner => owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net');
        if (!owners.includes(m.sender.split(':')[0] + '@s.whatsapp.net') && !m.fromMe) return;

        try {
            await m.reply('⌬ REINICIANDO SISTEMA\n\nEspere unos segundos...');
            await new Promise(r => setTimeout(r, 2000));
            process.exit(0);
        } catch (e) {
            await m.reply('☒ Error: ' + e.message);
        }
    }
};

export default restartCommand;
