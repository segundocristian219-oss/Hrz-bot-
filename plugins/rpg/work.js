const formatCol = (num) => {
    return Number(num).toLocaleString('de-DE');
};

const workCommand = {
    name: 'work',
    alias: ['trabajar', 'chamba', 'chambear'],
    category: 'rpg',
    run: async (m, { conn }) => {
        let user = await global.User.findOne({ id: m.sender });
        if (!user) user = await global.User.create({ id: m.sender, col: 0 });

        const now = Date.now();
        const cooldown = 10 * 60 * 1000; 
        const lastWork = user.lastWork || 0;

        if (now - lastWork < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastWork)) / 1000);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            return m.reply(`⨯ Necesitas descansar. Regresa en: ${mins}m ${secs}s`);
        }

        const isWin = Math.random() < 0.70; 

        let amount = 0;
        let lore = "";
        let newCol = user.col || 0;
        let statusPrefix = "";
        let headerTitle = "";

        if (isWin) {
            amount = Math.floor(Math.pow(Math.random(), 3) * 99999) + 1;
            
            const winLore = [
                "Desarrollaste un bot para una empresa y te pagaron el contrato.",
                "Reparaste la placa base de un telefono de alta gama.",
                "Hackeaste la seguridad de una corporacion rival y vendiste los datos.",
                "Trabajaste como guardia de seguridad en un evento VIP.",
                "Minaste criptomonedas aprovechando la electricidad de tu vecino.",
                "Ganaste un torneo de programacion clandestino.",
                "Encontraste una billetera perdida y el dueño te dio una recompensa.",
                "Ayudaste a descargar mercancía pesada en el muelle de la ciudad."
            ];
            lore = winLore[Math.floor(Math.random() * winLore.length)];
            newCol += amount;
            statusPrefix = `+${formatCol(amount)}`;
            headerTitle = "『 JORNADA EXITOSA 』";
        } else {
            amount = Math.floor(Math.pow(Math.random(), 1/3) * 9999) + 1;
            
            const loseLore = [
                "Invertiste en una criptomoneda falsa y perdiste tus ahorros.",
                "Rompiste equipo caro en el trabajo y te lo descontaron del sueldo.",
                "Te asaltaron en un callejon oscuro mientras volvias de cobrar.",
                "Apostaste en carreras clandestinas y tu corredor tropezo.",
                "La policia te multo por alterar el orden publico.",
                "Compraste hardware defectuoso por internet y el vendedor desaparecio.",
                "Te quedaste dormido en el trabajo y te multaron por ineficiencia."
            ];
            lore = loseLore[Math.floor(Math.random() * loseLore.length)];
            
            if (newCol < amount) amount = newCol; 
            newCol -= amount;
            statusPrefix = `-${formatCol(amount)}`;
            headerTitle = "『 ACCIDENTE LABORAL 』";
        }

        await global.User.updateOne({ id: m.sender }, { $set: { col: newCol, lastWork: now } });

        let txt = `${headerTitle}\n\n`;
        txt += `◈ ${lore}\n`;
        txt += `──────────────────\n`;
        txt += `✦ ${isWin ? 'Ganancia' : 'Perdida'}: ${statusPrefix} Col\n`;
        txt += `✧ Balance Actual: ${formatCol(newCol)} Col\n`;
        txt += `──────────────────`;

        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
    }
};

export default workCommand;
