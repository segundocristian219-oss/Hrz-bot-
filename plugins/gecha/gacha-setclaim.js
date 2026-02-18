import { promises as fs } from "fs"

let handler = async (m, { args, usedPrefix, command }) => {
  try {
    if (!global.db.data.chats) global.db.data.chats = {}
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    const chatData = global.db.data.chats[m.chat]

    if (!chatData.gacha && m.isGroup) {
      return m.reply(
        `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`
      )
    }

    if (!global.db.data.users) global.db.data.users = {}
    if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}

    switch (command) {
      case "setclaim":
      case "setclaimmsg":
        if (!args[0]) {
          return m.reply(
            `❀ Debes especificar un mensaje para reclamar un personaje.\n` +
            `> Ejemplos:\n` +
            `> ${usedPrefix + command} €user ha reclamado el personaje €character!\n` +
            `> ${usedPrefix + command} €character ha sido reclamado por €user`
          )
        }

        const newMessage = args.join(" ")

        if (!newMessage.includes("€user") || !newMessage.includes("€character")) {
          return m.reply("ꕥ Tu mensaje debe incluir *€user* y *€character* para que funcione correctamente.")
        }

        global.db.data.users[m.sender].claimMessage = newMessage
        m.reply("❀ Mensaje de reclamación modificado.")
        break

      case "unsetclaim":
      case "resetclaimmsg":
        delete global.db.data.users[m.sender].claimMessage
        m.reply("❀ Mensaje de reclamación restablecido.")        break
    }

  } catch (e) {
    await conn.reply(
      m.chat,
      `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${e.message}`,
      m
    )
  }
}

handler.help = ["setclaim", "setclaimmsg", "delclaimmsg", "resetclaimmsg"]
handler.tags = ["gacha"]
handler.command = ["setclaimmsg", "setclaim", "unsetclaim", "resetclaimmsg"]
handler.group = true

export default handler
