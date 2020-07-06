/**
 * Toggle the Player's where list visibility as anonymous
 * Handled by 'where' command
 */
module.exports = {
  usage: 'whereanon',
  aliases: ['whereanonymous'],

  command: state => (args, player) => {
    state.CommandManager.get('where').execute('vis $vis=anon', player)
  }
}
