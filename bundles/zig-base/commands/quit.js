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
    const builderMessage = `${player.name} logged off.`
    const playerMessage = 'A spirit fades away.'
    state.ChannelManager.get('builder').send(state, B.getSystemReporter(), builderMessage)
    state.ChannelManager.get('ooc').send(state, B.getSystemReporter(), playerMessage)
    Logger.log(`${player.name} has quit`)

    // announce to player and room
    B.sayAt(player, 'You blink out of existence.')
    B.sayAtExcept(player.room, `${player.name} blinks out of existence.`, [player])

    // quit
    state.PlayerManager.removePlayer(player, true)
  }
}
