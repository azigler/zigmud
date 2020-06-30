/**
 * Unfollow a Character
 * Handled by 'follow' command
 */
module.exports = {
  usage: 'unfollow',

  command: state => (args, player) => {
    state.CommandManager.get('follow').execute(null, player, 'unfollow')
  }
}
