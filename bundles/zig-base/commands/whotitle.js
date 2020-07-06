/**
 * Change the Player's who list title
 * Handled by 'who' command
 */
module.exports = {
  usage: 'whotitle <title>',

  command: state => (args, player) => {
    state.CommandManager.get('who').execute(`title ${args}`, player)
  }
}
