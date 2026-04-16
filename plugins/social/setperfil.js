const setSocialProfile = {
    name: 'setperfil',
    alias: ['configperfil', 'identidad', 'setp'],
    category: 'social',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const genders = ['Hombre', 'Mujer', 'No binario', 'Otro'];
        const identities = ['Heterosexual', 'Gay', 'Bisexual', 'Lesbiana', 'Pansexual', 'Transexual', 'Asexual'];

        if (!text) {
            return conn.reply(m.chat, `
--- CONFIGURACION DE IDENTIDAD ---

Uso: ${usedPrefix + command} [Edad] [Num Genero] [Num Orientacion]
Ejemplo: ${usedPrefix + command} 19 1 2

LISTA DE GENEROS:
${genders.map((g, i) => `${i + 1}. ${g}`).join(' | ')}

LISTA DE ORIENTACION:
${identities.map((id, i) => `${i + 1}. ${id}`).join(' | ')}
`.trim(), m);
        }

        const [age, gIdx, iIdx] = text.split(' ').map(n => parseInt(n));
        const finalG = genders[gIdx - 1];
        const finalI = identities[iIdx - 1];

        if (isNaN(age) || age < 5 || age > 99) return conn.reply(m.chat, '> Error: Ingresa una edad valida (5-99).', m);
        if (!finalG || !finalI) return conn.reply(m.chat, '> Error: Seleccion de genero u orientacion invalida.', m);

        await global.User.findOneAndUpdate(
            { $or: [{ id: m.sender }, { lid: m.sender }] },
            { $set: { age: age, gender: finalG, identity: finalI } },
            { upsert: true }
        );

        conn.reply(m.chat, `> Datos actualizados correctamente.\n> Usa ${usedPrefix}perfil para ver los cambios.`, m);
    }
};

export default setSocialProfile;
