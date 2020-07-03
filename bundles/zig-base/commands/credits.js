/**
 * Display the game credits
 * Handled by 'help' command
 */
module.exports = {
  usage: 'credits',

  command: state => (args, player) => {
    state.CommandManager.get('help').execute('credits', player)
  }
}
