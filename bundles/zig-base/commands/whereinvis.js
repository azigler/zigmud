/**
 * Toggle off the Player's where list visibility
 * Handled by 'where' command
 */
module.exports = {
  usage: 'whereinvis',

  command: state => (args, player) => {
    state.CommandManager.get('where').execute('vis $vis=false', player)
  }
}
