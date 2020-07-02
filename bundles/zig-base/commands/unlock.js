/**
 * Unlock a container Item or door
 * Handled by 'open' command
 */
module.exports = {
  usage: 'unlock [door] <door/direction/item>',

  command: state => (args, player) => {
    state.CommandManager.get('open').execute(args, player, 'unlock')
  }
}
