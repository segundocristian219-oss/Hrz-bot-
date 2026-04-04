import axios from 'axios'

const gitinfo = {
    name: 'github',
    alias: ['git', 'repo', 'infogit'],
    category: 'main',
    run: async (m, { conn, args }) => {
        if (!args[0]) return m.reply('Ingresa la URL o el usuario/repositorio de GitHub.')

        const regex = /github\.com\/([^/]+)\/([^/]+)/
        const match = args[0].match(regex)
        const repoPath = match ? `${match[1]}/${match[2]}` : args[0]

        try {
            await m.react('🔘')

            const { data: repo } = await axios.get(`https://api.github.com/repos/${repoPath}`)
            const { data: lastCommits } = await axios.get(`https://api.github.com/repos/${repoPath}/commits?per_page=1`)
            const lastCommit = lastCommits[0]

            const commitsUrl = `https://api.github.com/repos/${repoPath}/commits?per_page=1`
            const firstCommitRes = await axios.get(commitsUrl)
            const linkHeader = firstCommitRes.headers.link
            let firstCommit = null
            
            if (linkHeader) {
                const lastPageUrl = linkHeader.split(',').find(s => s.includes('rel="last"'))?.match(/<(.*)>/)?.[1]
                if (lastPageUrl) {
                    const { data: firstCommits } = await axios.get(lastPageUrl)
                    firstCommit = firstCommits[0]
                } else {
                    firstCommit = lastCommit
                }
            } else {
                firstCommit = lastCommit
            }

            const txt = `*GITHUB REPOSITORY DATA*\n\n` +
                `*Nombre:* ${repo.full_name}\n` +
                `*Descripción:* ${repo.description || 'N/A'}\n` +
                `*Estrellas:* ${repo.stargazers_count}\n` +
                `*Forks:* ${repo.forks_count}\n` +
                `*Issues:* ${repo.open_issues_count}\n` +
                `*Lenguaje:* ${repo.language || 'N/A'}\n` +
                `*Creado:* ${new Date(repo.created_at).toLocaleDateString('es-ES')}\n\n` +
                `*ULTIMO COMMIT*\n` +
                `*Fecha:* ${new Date(lastCommit.commit.committer.date).toLocaleString()}\n` +
                `*Mensaje:* ${lastCommit.commit.message}\n` +
                `*Autor:* ${lastCommit.commit.author.name}\n\n` +
                `*PRIMER COMMIT*\n` +
                `*Fecha:* ${new Date(firstCommit.commit.committer.date).toLocaleString()}\n` +
                `*Mensaje:* ${firstCommit.commit.message}\n` +
                `*Autor:* ${firstCommit.commit.author.name}\n\n` +
                `*Link:* ${repo.html_url}`

            await conn.sendMessage(m.chat, {
                text: txt,
                contextInfo: {
                    externalAdReply: {
                        title: 'GITHUB ANALYST SYSTEM',
                        body: repo.owner.login,
                        thumbnailUrl: repo.owner.avatar_url,
                        sourceUrl: repo.html_url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

            await m.react('✅')

        } catch (e) {
            await m.react('❌')
            m.reply('Error: Repositorio no encontrado o límite de API excedido.')
        }
    }
}

export default gitinfo
