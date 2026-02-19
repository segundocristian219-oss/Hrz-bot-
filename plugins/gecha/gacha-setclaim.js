const setClaimCommand = {
  name: 'setclaim',
  alias: ['setclaimmsg', 'unsetclaim', 'resetclaimmsg'],
  category: 'gacha',
  run: async (m, { conn, args, usedPrefix, command, chat, user }) => {
    try {
      if (!chat.gacha && m.isGroup) {
        return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`)
      }

      switch (command) {
        case "setclaim":
        case "setclaimmsg":
          if (!args[0]) {
            return m.reply(`❀ Debes especificar un mensaje para reclamar un personaje.\n> Ejemplos:\n> ${usedPrefix + command} €user ha reclamado el personaje €character!\n> ${usedPrefix + command} €character ha sido reclamado por €user`)
          }
          const newMessage = args.join(" ")
          if (!newMessage.includes("€user") || !newMessage.includes("€character")) {
            return m.reply("ꕥ Tu mensaje debe incluir *€user* y *€character* para que funcione correctamente.")
          }
          user.claimMessage = newMessage
          m.reply("❀ Mensaje de reclamación modificado.")
          break

        case "unsetclaim":
        case "resetclaimmsg":
          delete user.claimMessage
          m.reply("❀ Mensaje de reclamación restablecido.")
          break
      }
    } catch (e) {
      console.error(e)
      await m.reply(`⚠︎ Se ha producido un problema.\n\n${e.message}`)
    }
  }
}

export default setClaimCommand
