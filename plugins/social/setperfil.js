const setSocialProfile = {
    name: 'setperfil',
    alias: ['configperfil', 'identidad'],
    category: 'social',
    run: async (m, { conn, text, usedPrefix, command }) => {
        const genders = ['Hombre', 'Mujer', 'No binario', 'Otro'];
        const identities = ['Heterosexual', 'Gay', 'Bisexual', 'Lesbiana', 'Pansexual', 'Transexual', 'Asexual'];

        if (!text) {
            return conn.reply(m.chat, `
📝 *CONFIGURA TU CARTA DE PRESENTACIÓN*

Uso: *${usedPrefix + command} [Edad] [Num Género] [Num Orientación]*
Ejemplo: *${usedPrefix + command} 19 1 2*

*GÉNEROS:*
${genders.map((g, i) => `${i + 1}. ${g}`).join(' | ')}

*ORIENTACIÓN:*
${identities.map((id, i) => `${i + 1}. ${id}`).join(' | ')}
`.trim(), m);
        }

        const [age, gIdx, iIdx] = text.split(' ').map(n => parseInt(n));
        const finalG = genders[gIdx - 1];
        const finalI = identities[iIdx - 1];

        if (isNaN(age) || age < 5 || age > 99) return conn.reply(m.chat, '⚠️ Por favor ingresa una edad válida (5-99).', m);
        if (!finalG || !finalI) return conn.reply(m.chat, '⚠️ Selección de género u orientación inválida.', m);

        await global.User.findOneAndUpdate(
            { $or: [{ id: m.sender }, { lid: m.sender }] },
            { $set: { age: age, gender: finalG, identity: finalI } },
            { upsert: true }
        );

        await m.react("👤");
        conn.reply(m.chat, `✅ *DATOS GUARDADOS*\n\nAhora cuando alguien use *${usedPrefix}perfil*, verá tu información actualizada.`, m);
    }
};

export default setSocialProfile;
