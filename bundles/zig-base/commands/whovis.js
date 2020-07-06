/**
 * Toggle on the Player's who list visibility
 * Handled by 'who' command
 */
module.exports = {
  usage: 'whovis',

  command: state => (args, player) => {
    state.CommandManager.get('who').execute('vis $vis=true', player)
  }
}
