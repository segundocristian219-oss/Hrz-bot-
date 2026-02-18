import { promises as fs } from "fs";
import stringSimilarity from "string-similarity";

const charactersFilePath = "./lib/characters.json";

async function loadCharacters() {

    try {
        const data = await fs.readFile(charactersFilePath, "utf-8");
        return JSON.parse(data);
    } catch {
        await fs.writeFile(charactersFilePath, "{}");
        return {};
    }
}

function flattenCharacters(data) {
    return Object.values(data).flatMap(series =>
        Array.isArray(series.characters) ? series.characters : []
    );
}

function getSeriesByName(data, name) {
    name = name.toLowerCase();
    const entries = Object.entries(data);
    const exact = entries.find(([_, s]) => s.name.toLowerCase() === name);
    if (exact) return exact;

    const allNames = entries.map(([_, s]) => s.name);
    const match = stringSimilarity.findBestMatch(name, allNames);

    if (match.bestMatch.rating >= 0.4) {
        const bestName = match.bestMatch.target;
        return entries.find(([_, s]) => s.name === bestName);
    }

    return null;
}

let handler = async (m, { conn, args, usedPrefix, command }) => {

    try {

        if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup)
            return m.reply(
                `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`

            );

        if (!args[0])
            return m.reply(`❀ Debes especificar la serie.\n> Ejemplo: *${usedPrefix + command} Blue Archive*`);

        global.db.data.groupGacha = global.db.data.groupGacha || {};
        const group = global.db.data.groupGacha[m.chat] =

            global.db.data.groupGacha[m.chat] || { characters: {}, users: {} };
        let page = 1;
        const pageArg = args.find(a => /^page=\d+$/i.test(a));
        if (pageArg) page = parseInt(pageArg.split("=")[1]) || 1;
        const seriesNameQuery = args
             .filter(a => a !== pageArg)
             .join(" ")
             .trim();

        const allCharactersData = await loadCharacters();
        const seriesEntry = getSeriesByName(allCharactersData, seriesNameQuery);

        if (!seriesEntry)
            return m.reply(`ꕥ No se encontró la serie *${seriesNameQuery}*.\n> Usa ${usedPrefix}suggest Sugerencia de la serie: ${seriesNameQuery}`);

        const [seriesId, series] = seriesEntry;
        const characters = Array.isArray(series.characters) ? series.characters : [];

        if (!characters.length)
            return m.reply(`ꕥ La serie *${series.name}* no tiene personajes.`);

        characters.forEach(c => {
            if (!group.characters[c.id])
                group.characters[c.id] = { ...c, user: null, value: Number(c.value || 100) };
        });

        const total = characters.length;
        const claimedChars = characters.filter(c => {

            const charDB = group.characters[c.id];

            return charDB && charDB.user;

        });

        const claimed = claimedChars.length;
        const percent = ((claimed / total) * 100).toFixed(0);
        const perPage = 50;
        const totalPages = Math.ceil(total / perPage);

        if (page > totalPages)
        return m.reply(
          `❀ La página *${page}* no existe.\n` +
          `> Esta serie solo tiene *${totalPages}* páginas.\n` +
          `> Ejemplo: *${usedPrefix}ainfo ${series.name} page=1*`
         );

        const start = (page - 1) * perPage;
        const end = Math.min(start + perPage, total);
        let text = `*❀ Nombre:* \`<${series.name}>\`\n\n`;
        text += `❏ Personajes » *\`${total}\`*\n`;
        text += `♡ Reclamados » *\`${claimed}/${total} (${percent}%)\`*\n`;
        text += `❏ Lista de personajes:\n\n`;

        for (let i = start; i < end; i++) {
            const c = characters[i];
            const cDB = group.characters[c.id];
            let estado = "Libre";

            if (cDB.user) {
                const who = cDB.user;
                let name = await (async () =>
                    global.db.data.users[who]?.name ||
                    (async () => {
                        try {
                            const n = await conn.getName(who);
                            return typeof n === "string" && n.trim()
                                ? n
                                : who.split("@")[0];
                        } catch {
                            return who.split("@")[0];
                        }
                    })())();
                estado = `Reclamado por ${name}`;

            }

            const valor = cDB.value?.toLocaleString() || 0;
            text += `» *${c.name}* (${valor}) • ${estado}\n`;
        }

        text += `\n> ⌦ _Página *${page}* de *${totalPages}*_`;
        if (totalPages > 1 && page < totalPages) {
    const nextPage = page + 1;
    text += `\n⌦ usa *${usedPrefix + command} ${series.name} page=${nextPage}* para ver la siguiente Página.`;
}
        await conn.reply(m.chat, text, m);
    } catch (err) {
        console.error(err);
        await conn.reply(
            m.chat,
            `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`,
            m
        );
    }
};

handler.help = ["ainfo <serie> [pagina]"];
handler.tags = ["gacha"];
handler.command = ["ainfo", "animeinfo"];
handler.group = true;

export default handler;
