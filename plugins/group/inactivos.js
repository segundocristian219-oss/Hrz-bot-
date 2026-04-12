const delay = (ms) => new Promise(res => setTimeout(res, ms));

const inactivosCommand = {
    name: 'inactivos',
    alias: ['kickinactivos', 'warninactivos', 'radar'],
    category: 'group',

    async before(m) {
        if (!m.isGroup) return false;
        global.actividadGrupo = global.actividadGrupo || {};
        global.actividadGrupo[m.chat] = global.actividadGrupo[m.chat] || {};
        if (!global.actividadGrupo[m.chat]._startRadar) {
            global.actividadGrupo[m.chat]._startRadar = Date.now();
        }
        global.actividadGrupo[m.chat][m.sender] = Date.now();
        return false;
    },

    run: async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
        if (!m.isGroup) return m.reply("⨯ El radar solo funciona en grupos.");
        if (!isAdmin) return m.reply("⨯ Acceso denegado. Solo administradores.");

        global.actividadGrupo = global.actividadGrupo || {};
        const chatActividad = global.actividadGrupo[m.chat] || {};
        const startRadar = chatActividad._startRadar || Date.now();

        const meta = await conn.groupMetadata(m.chat);
        const participants = meta.participants;
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        const ownerList = (global.config?.owner || []).map(o => o[0] + '@s.whatsapp.net');
        
        const now = Date.now();
        const unDiaYMedio = 1.5 * 24 * 60 * 60 * 1000; 

        const tiempoTranscurrido = now - startRadar;
        if (tiempoTranscurrido < unDiaYMedio && (command === 'kickinactivos' || command === 'warninactivos')) {
            const faltante = unDiaYMedio - tiempoTranscurrido;
            const horas = Math.floor(faltante / (60 * 60 * 1000));
            const mins = Math.floor((faltante % (60 * 60 * 1000)) / (60 * 1000));
            return m.reply(`『 📡 RADAR
            
