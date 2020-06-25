const { Broadcast: B } = require('ranvier')
const ArgParser = require('./../../../lib/ArgParser')

module.exports = {
  usage: 'follow <character>',

  command: state => (arg, player) => {
    // if no argument provided, reject command
    if (!arg) {
      return B.sayAt(player, 'Follow whom?')
    }

    // prioritize targeting players over NPCs
    let target = ArgParser.parseDot(arg, player.room.players) || ArgParser.parseDot(arg, player.room.npcs)

    if (!target) {
      switch (arg) {
        // handle special arguments
        case 'me':
        case 'self':
        case 'none':
        case 'stop': {
          target = player
          break
        }
        // handle invalid target
        default: return B.sayAt(player, 'No such character is here.')
      }
    }

    // handle targeting self
    if (target === player) {
      // if following someone, stop following
      if (player.following) {
        stopFollowing(player)
      // if not following anyone, reject command
      } else {
        B.sayAt(player, 'Huh?')
      }
      return
    }

    // if they're following player, reject following target
    if (target.isFollowing(player)) {
      return B.sayAt(player, 'You cannot follow someone who is already following you.')
    }

    // if already following them, reject following target
    if (player.isFollowing(target)) {
      return B.sayAt(player, `You are already following ${target.name}.`)
    }

    // if already following someone, stop doing so
    if (player.following) {
      stopFollowing(player)
    }

    // handle following
    B.sayAt(player, `You start following ${target.name}.`)
    B.sayAt(target, `${player.name} starts following you.`)
    player.follow(target)
  }
}

// helper function to stop following a character
function stopFollowing (player) {
  B.sayAt(player, `You stop following ${player.following.name}.`)
  // only announce stopping following if characters are in same room
  if (player.room === player.following.room) {
    B.sayAt(player.following, `${player.name} stops following you.`)
  }
  player.unfollow()
}
