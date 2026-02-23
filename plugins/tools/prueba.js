import axios from "axios";
import * as cheerio from "cheerio";

const PAISES = {
    es: "www", mx: "mx", ar: "ar", cl: "cl", co: "co",
    us: "us", ve: "ve", pe: "pe", ec: "ec", bo: "bo",
    cu: "cu", cr: "cr", pa: "pa", py: "py", uy: "uy",
    do: "do", pr: "pr", sv: "sv", gt: "gt", hn: "hn",
    ni: "ni", br: "br", it: "it", fr: "fr", ca: "ca",
};

async function scrapeGrupos(termino, pais = "es", maxPaginas = 3) {
    const subdomain = PAISES[pais.toLowerCase()] || "www";
    const baseUrl = `https://${subdomain}.gruposwats.com`;
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    };

    const grupos = [];
    const slug = encodeURIComponent(termino.toLowerCase().replace(/ /g, "-"));

    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
        const url = pagina === 1
            ? `${baseUrl}/${slug}.html`
            : `${baseUrl}/${slug}_${pagina}.html`;

        try {
            const { data } = await axios.get(url, { headers, timeout: 12000 });
            const $ = cheerio.load(data);

            // Buscar todos los enlaces de WhatsApp en la página
            const encontrados = [];

            $("a[href*='chat.whatsapp.com']").each((_, el) => {
                const enlace = $(el).attr("href")?.trim();
                if (!enlace) return;

                const contenedor = $(el).closest("div, article, li, section");

                // Nombre del grupo
                let nombre =
                    contenedor.find("h2, h3, h4, strong, b, .titulo, .nombre").first().text().trim() ||
                    $(el).attr("title")?.trim() ||
                    $(el).text().trim() ||
                    "Sin nombre";

                // Descripción
                let descripcion =
                    contenedor.find("p, .descripcion, .desc, span").first().text().trim() ||
                    $(el).attr("title")?.trim() ||
                    "";

                // Categoría desde la URL
                const catMatch = url.match(/\/([^/_]+?)(?:_\d+)?\.html/);
                const categoria = catMatch
                    ? catMatch[1].replace(/-/g, " ").replace(/_/g, " ")
                    : termino;

                // Evitar duplicados
                if (!grupos.find(g => g.enlace === enlace) && !encontrados.find(g => g.enlace === enlace)) {
                    encontrados.push({ nombre, descripcion, enlace, categoria });
                }
            });

            if (encontrados.length === 0) break;
            grupos.push(...encontrados);

            // Pequeña pausa para no saturar el servidor
            await new Promise(r => setTimeout(r, 800));

        } catch (err) {
            // Si la página no existe (404 u otro error), dejamos de paginar
            if (err?.response?.status === 404 || err?.code === "ERR_BAD_REQUEST") break;
            console.error(`[buscargrupos] Error en ${url}:`, err.message);
            break;
        }
    }

    return grupos;
}

function formatearResultados(grupos, termino, pagina = 1, porPagina = 5) {
    const total = grupos.length;
    const inicio = (pagina - 1) * porPagina;
    const fin = Math.min(inicio + porPagina, total);
    const slice = grupos.slice(inicio, fin);
    const totalPaginas = Math.ceil(total / porPagina);

    if (slice.length === 0) return null;

    let texto = `╔══════════════════════╗\n`;
    texto += `║  🔍 *GRUPOS DE WHATSAPP*  ║\n`;
    texto += `╚══════════════════════╝\n\n`;
    texto += `📌 *Búsqueda:* ${termino}\n`;
    texto += `📊 *Total:* ${total} grupo(s) | Página ${pagina}/${totalPaginas}\n`;
    texto += `${"─".repeat(28)}\n\n`;

    slice.forEach((g, i) => {
        texto += `*${inicio + i + 1}.* 👥 *${g.nombre}*\n`;
        if (g.descripcion) texto += `📝 ${g.descripcion.slice(0, 80)}${g.descripcion.length > 80 ? "…" : ""}\n`;
        texto += `🏷️ _${g.categoria}_\n`;
        texto += `🔗 ${g.enlace}\n\n`;
    });

    if (totalPaginas > 1) {
        texto += `${"─".repeat(28)}\n`;
        texto += `💡 Usa *!buscargrupos ${termino} -p${pagina + 1}* para ver más`;
    }

    return texto;
}

// ─────────────────────────────────────────────
//  COMANDO
// ─────────────────────────────────────────────

const buscarGruposCommand = {
    name: "buscargrupos",
    alias: ["searchgroup", "findgroup", "bgrupos", "gruposwats"],
    category: "util",
    desc: "Busca grupos de WhatsApp en gruposwats.com",
    usage: "!buscargrupos <término> [-p<página>] [-pais <código>]",

    run: async (m, { conn, text }) => {
        if (!text) {
            return m.reply(
                `> ❓ *Uso:* !buscargrupos <término>\n\n` +
                `*Ejemplos:*\n` +
                `• !buscargrupos música\n` +
                `• !buscargrupos gaming -p2\n` +
                `• !buscargrupos deportes -pais mx\n\n` +
                `*Países disponibles:* es, mx, ar, cl, co, us, ve, pe, ec, bo, cu, cr, br, it, fr, ca`
            );
        }

        // Parsear argumentos
        // -p2 → página 2 | -pais mx → país México
        let termino = text;
        let pagina = 1;
        let pais = "es";

        const paginaMatch = text.match(/-p(\d+)/i);
        if (paginaMatch) {
            pagina = parseInt(paginaMatch[1]);
            termino = termino.replace(paginaMatch[0], "").trim();
        }

        const paisMatch = text.match(/-pais\s+([a-z]{2})/i);
        if (paisMatch) {
            pais = paisMatch[1].toLowerCase();
            termino = termino.replace(paisMatch[0], "").trim();
        }

        termino = termino.trim();
        if (!termino) return m.reply("> ⚠️ Escribe un término de búsqueda.");

        try {
            await m.react("🔍");

            const grupos = await scrapeGrupos(termino, pais, 3);

            if (!grupos.length) {
                await m.react("❌");
                return m.reply(
                    `> ❌ *No se encontraron grupos* para *"${termino}"*.\n\n` +
                    `Prueba con otro término o país (ej: -pais mx)`
                );
            }

            const mensaje = formatearResultados(grupos, termino, pagina, 5);

            if (!mensaje) {
                await m.react("❌");
                return m.reply(`> ⚠️ No hay resultados en la página ${pagina}.`);
            }

            await conn.sendMessage(
                m.chat,
                {
                    text: mensaje,
                    contextInfo: {
                        externalAdReply: {
                            title: `🔍 Grupos: ${termino}`,
                            body: `${grupos.length} grupos encontrados en gruposwats.com`,
                            mediaType: 1,
                            renderLargerThumbnail: false,
                            showAdAttribution: false,
                            sourceUrl: `https://www.gruposwats.com/${encodeURIComponent(termino)}.html`,
                        },
                    },
                },
                { quoted: m }
            );

            await m.react("✅");
        } catch (e) {
            console.error("[buscargrupos]", e);
            await m.react("✖️");
            m.reply("> ❌ *Error al buscar grupos.* Intenta de nuevo.");
        }
    },
};

export default buscarGruposCommand;
