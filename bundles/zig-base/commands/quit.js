const { Broadcast: B, Logger } = require('ranvier')

/**
 * Save and quit the game
 */
module.exports = {
  usage: 'quit',
  aliases: ['logout', 'logoff'],

  command: (state) => (args, player) => {
    // save player and account
    state.CommandManager.get('save').execute('', player)

    // announce to server
    state.ChannelManager.get('chat').send(state, B.getSystemReporter(), `${player.name} has logged off.`)
    Logger.log(`${player.name} has quit`)

    // announce to player and room
    B.sayAt(player, 'You fade away...')
    B.sayAtExcept(player.room, `${player.name} fades away...`, [player])

    // quit
    state.PlayerManager.removePlayer(player, true)
  }
}
