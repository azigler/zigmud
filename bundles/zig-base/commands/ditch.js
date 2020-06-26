const { Broadcast: B } = require('ranvier')
const ArgParser = require('./../../../lib/ArgParser')

/**
 * Ditch a Character so they no longer follow the Player
 */
module.exports = {
  usage: 'ditch <character>',
  aliases: ['unhitch'],

  command: state => (args, player, arg0) => {
    // if no argument provided, reject command
    if (!args) {
      return B.sayAt(player, `${B.capitalize(arg0)} whom?`)
    }

    // if no one is following player, reject command
    if (player.followers.size === 0) {
      return B.sayAt(player, 'No one is following you.')
    }

    let target

    // handle ditching all followers
    if (args === 'all') {
      return player.followers.forEach(follower => {
        ditch(player, follower)
      })
    // otherwise determine target from followers
    } else {
      target = ArgParser.parseDot(args, player.followers)
    }

    // handle no target found
    if (!target) {
      // determine if any matching character is in same room as player
      const matchingCharacter = ArgParser.parseDot(args, player.room.players) || ArgParser.parseDot(args, player.room.npcs)

      // handle matching character exists
      if (matchingCharacter) {
        return B.sayAt(player, "They aren't following you.")
      // handle no matching character exists
      } else {
        return B.sayAt(player, 'No such character is here.')
      }
    }

    // ditch target
    ditch(player, target)
  }
}

// helper function for ditching a character
function ditch (player, follower) {
  B.sayAt(player, `You ditch ${follower.name} and they stop following you.`)
  follower.unfollow()

  // if characters are in same room, announce ditching to following player
  if (!follower.isNpc && (player.room === follower.room)) {
    B.sayAt(follower, `${player.name} ditches you and you stop following them.`)
  }
}
