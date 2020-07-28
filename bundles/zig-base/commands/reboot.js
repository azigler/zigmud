const { Broadcast: B, PlayerRoles } = require('ranvier')

/**
 * Kill the server so it can reboot
 * (requires something like PM2 to reboot the process)
 */
module.exports = {
  requiredRole: PlayerRoles.BUILDER,
  usage: 'reboot',

  command: state => (args, player) => {
    const sec = args * 1000 || 10000
    state.PlayerManager.saveAll()
    state.ChannelManager.get('ooc').send(state, B.getSystemReporter(), `The server is rebooting in ${sec / 1000} seconds...`)
    setTimeout(() => {
      process.exit()
    }, sec)
  }
}
