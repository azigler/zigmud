/**
 * Toggle off the Player's who list visibility
 * Handled by 'who' command
 */
module.exports = {
  usage: 'whoinvis',

  command: state => (args, player) => {
    state.CommandManager.get('who').execute('vis $vis=false', player)
  }
}
