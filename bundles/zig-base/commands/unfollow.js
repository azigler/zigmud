/**
 * Follow a Character
 */
module.exports = {
  usage: 'unfollow',

  command: state => (args, player) => {
    state.CommandManager.get('follow').execute(undefined, player, 'unfollow')
  }
}
