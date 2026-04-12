let handler = async (m, { conn, args, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    let costoBoleto = 500 // Costo fijo por entrada
    let premio = 25000 // Premio mayor
    
    if (user.col < costoBoleto) return m.reply(`❌ No tienes suficientes Col para comprar un boleto. Necesitas ${costoBoleto} Col.`)

    // El usuario elige un número del 1 al 10 o el bot le asigna uno si no pone nada
    let numeroElegido = parseInt(args[0])
    if (!numeroElegido || numeroElegido < 1 || numeroElegido > 10) {
        return m.reply(`🎰 *LOTERÍA KIRITO* 🎰\n\nPara participar, elige un número del 1 al 10.\nEjemplo: *${usedPrefix + command} 7*\n\n*Costo:* ${costoBoleto} Col\n*Premio:* ${premio} Col`)
    }

    // Cobrar el boleto
    user.col -= costoBoleto
    
    // Sorteo rápido
    let numeroGanador = Math.floor(Math.random() * 10) + 1
    let mensaje = `🎟️ *BOLETO COMPRADO* 🎟️\n\nTu número: [ ${numeroElegido} ]\nNúmero ganador: [ ${numeroGanador} ]\n\n`

    if (numeroElegido === numeroGanador) {
        user.col += premio
        mensaje += `✨ ¡FELICIDADES! ✨\nHas ganado el premio mayor de *${premio} Col*. Tu saldo ha sido actualizado.`
    } else {
        mensaje += `😞 No hubo suerte esta vez. Perdiste los ${costoBoleto} Col invertidos. ¡Sigue intentando!`
    }

    await m.reply(mensaje)
}

handler.command = /^(loteria|lotto)$/i
handler.tags = ['rpg']
handler.help = ['loteria <1-10>']

export default handler
