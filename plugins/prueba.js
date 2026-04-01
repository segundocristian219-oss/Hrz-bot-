import chalk from 'chalk'

let handler = m => m

handler.before = async function (m, { conn }) {
    if (m.pollUpdates || m.message?.pollCreationMessage || m.message?.pollCreationMessageV2 || m.message?.pollCreationMessageV3 || m.message?.pollUpdateMessage) {
        
        console.log(chalk.bgMagenta.white(' [DEBUG POLL EVENT] '))
        
        console.log(chalk.cyan('─'.repeat(30)))
        console.log(chalk.yellow('ESTRUCTURA DEL MENSAJE (m):'))
        console.log(JSON.stringify(m, null, 2))
        
        if (m.pollUpdates) {
            console.log(chalk.green('\nDETALLE DE POLL UPDATES:'))
            console.log(JSON.stringify(m.pollUpdates, null, 2))
        }

        if (m.message?.pollUpdateMessage) {
            console.log(chalk.red('\nDETALLE DE POLL UPDATE MESSAGE:'))
            console.log(JSON.stringify(m.message.pollUpdateMessage, null, 2))
        }
        console.log(chalk.cyan('─'.repeat(30)))
    }
}

export default handler
