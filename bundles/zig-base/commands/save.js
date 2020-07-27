const { Broadcast: B } = require('ranvier')

/**
 * Save the Player and their Account
 */
module.exports = {
  usage: 'save',

  command: state => (args, player) => {
    player.account.save(() => {
      player.save(() => {
        B.sayAt(player, 'Saved.')
      })
    })
  }
}
