const socialConfig = {
    name: 'configuracion-social',
    alias: ['setgenero', 'gender', 'setidentidad', 'setorientacion', 'setedad', 'setage', 'setdesc', 'setbiografia'],
    category: 'social',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const genders = ['Hombre', 'Mujer', 'No binario', 'Otro'];
        const identities = ['Heterosexual', 'Gay', 'Bisexual', 'Lesbiana', 'Pansexual', 'Transexual', 'Asexual'];

        if (command === 'setgenero' || command === 'gender') {
            const idx = parseInt(text) - 1;
            if (!text || !genders[idx]) {
                return conn.reply(m.chat, `--- SELECCION DE GENERO ---\n\nUso: ${usedPrefix + command} [numero]\n\nOPCIONES:\n${genders.map((g, i) => `${i + 1}. ${g}`).join('\n')}`, m);
            }
            await global.User.findOneAndUpdate({ $or: [{ id: m.sender }, { lid: m.sender }] }, { $set: { gender: genders[idx] } }, { upsert: true });
            return conn.reply(m.chat, `> Genero actualizado a: ${genders[idx]}`, m);
        }

        if (command === 'setidentidad' || command === 'setorientacion') {
            const idx = parseInt(text) - 1;
            if (!text || !identities[idx]) {
                return conn.reply(m.chat, `--- SELECCION DE ORIENTACION ---\n\nUso: ${usedPrefix + command} [numero]\n\nOPCIONES:\n${identities.map((id, i) => `${i + 1}. ${id}`).join('\n')}`, m);
            }
            await global.User.findOneAndUpdate({ $or: [{ id: m.sender }, { lid: m.sender }] }, { $set: { identity: identities[idx] } }, { upsert: true });
            return conn.reply(m.chat, `> Orientacion actualizada a: ${identities[idx]}`, m);
        }

        if (command === 'setedad' || command === 'setage') {
            const age = parseInt(text);
            if (isNaN(age) || age < 5 || age > 99) return conn.reply(m.chat, `> Error: Ingresa una edad valida.\nUso: ${usedPrefix + command} [numero]`, m);
            await global.User.findOneAndUpdate({ $or: [{ id: m.sender }, { lid: m.sender }] }, { $set: { age: age } }, { upsert: true });
            return conn.reply(m.chat, `> Edad actualizada a: ${age} años`, m);
        }

        if (command === 'setdesc' || command === 'setbiografia') {
            if (!text || text.length > 150) return conn.reply(m.chat, `> Error: Ingresa una descripcion (Max 150 caracteres).\nUso: ${usedPrefix + command} [texto]`, m);
            await global.User.findOneAndUpdate({ $or: [{ id: m.sender }, { lid: m.sender }] }, { $set: { description: text } }, { upsert: true });
            return conn.reply(m.chat, `> Descripcion actualizada correctamente.`, m);
        }
    }
};

export default socialConfig;
