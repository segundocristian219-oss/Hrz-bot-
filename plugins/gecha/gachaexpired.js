// Codigo creado por ❖ ρєяѕσηα qυє иσ ¢σησz¢σ https://github.com/ulises12354

import chalk from "chalk"

console.log(chalk.green("[sistema] Limpiador de personajes expirados activo"))

const isRollExpirado = (roll, now = Date.now()) => {
  return (
    roll?.expiresAt &&
    now > roll.expiresAt &&
    !roll.user &&
    !(roll.reservedBy && now < roll.reservedUntil)
  )
}

const limpiarRollsExpirados = () => {
  try {
    if (!global.db?.data) return

    const groups = global.db.data.groupGacha
    if (!groups || typeof groups !== "object") return

    const now = Date.now()

    for (const chatId of Object.keys(groups)) {
      const group = groups[chatId]
      if (!group || typeof group !== "object") continue

      if (!Array.isArray(group.activeRolls)) {
        group.activeRolls = []
        continue
      }

      const antes = group.activeRolls.length

      group.activeRolls = group.activeRolls.filter(
        roll => !isRollExpirado(roll, now)
      )

      const eliminados = antes - group.activeRolls.length

      if (eliminados > 0) {
        console.log(
          chalk.gray(
            `[roll-cleaner] ${chatId}: ${eliminados} roll(s) expirado(s) eliminado(s)`
          )
        )
      }
    }
  } catch (e) {
    console.log(chalk.red("[roll-cleaner] Error limpiando rolls expirados"))
    console.error(e)
  }
}

setInterval(limpiarRollsExpirados, 30 * 60 * 1000)

setTimeout(limpiarRollsExpirados, 5000)
