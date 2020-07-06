/**
 * Toggle on the Player's where list visibility
 * Handled by 'where' command
 */
module.exports = {
  usage: 'wherevis',

  command: state => (args, player) => {
    state.CommandManager.get('where').execute('vis $vis=true', player)
  }
}
