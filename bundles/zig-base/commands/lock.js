/**
 * Lock a container Item or door
 * Handled by 'open' command
 */
module.exports = {
  usage: 'lock [door] <door/direction/item>',

  command: state => (args, player) => {
    state.CommandManager.get('open').execute(args, player, 'lock')
  }
}
