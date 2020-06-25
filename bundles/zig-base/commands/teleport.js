const { Broadcast: B, PlayerRoles, Config } = require('ranvier')

/**
 * Teleport to a Room or Player
 */
module.exports = {
  usage: 'teleport [<player/room>]',
  aliases: ['tp', 'recall'],
  requiredRole: PlayerRoles.ADMIN,

  command: (state) => (args, player, arg0) => {
    // initialize flair
    if (!player.getMeta('flair')) {
      player.setMeta('flair', {})
    }
    if (!player.getMeta('flair.teleport')) {
      player.setMeta('flair.teleport', 'in a puff of white smoke')
    }
    const flair = player.getMeta('flair.teleport')

    // handle if player isn't in a room
    if (!player.room) {
      B.sayAt(player, `You ${arg0} ${flair}.\n`)
      // reset player's teleport room to game's starting room
      player.setMeta('teleportRoom', Config.get('startingRoom'))
      return player.moveTo(state.RoomManager.getRoom(`admin-sanctum:${player.name.toLowerCase()}`), () => {
        B.sayAtExcept(player.room, `${player.name} suddenly appears ${flair}.`, [player])
        state.CommandManager.get('look').execute('', player)
      })
    }

    const argWords = args.split(' ')
    let target = args
    let targetRoom = null
    let targetPlayer = null

    // check for 'to' preposition
    if (argWords[0] === 'to') {
      if (argWords.length > 1) {
        target = argWords[1]
      } else {
        return B.sayAt(player, `${B.capitalize(arg0)} to where or whom?`)
      }
    }

    // determine if target is a room
    const isRoom = target.includes(':')

    // teleport to and from admin sanctum
    if (!args) {
      // ditch followers
      if (player.followers.size > 0) {
        state.CommandManager.get('ditch').execute('all', player)
      }

      // announce teleport
      B.sayAt(player, `You ${arg0} ${flair}.\n`)
      B.sayAtExcept(player.room, `${player.name} suddenly disappears ${flair}.`, [player])

      // move player and announce arrival
      if (player.room.entityReference !== `admin-sanctum:${player.name.toLowerCase()}`) {
        player.setMeta('teleportRoom', player.room.entityReference)
        player.moveTo(state.RoomManager.getRoom(`admin-sanctum:${player.name.toLowerCase()}`), () => {
          B.sayAtExcept(player.room, `${player.name} suddenly appears ${flair}.`, [player])
          state.CommandManager.get('look').execute('', player)
        })
      } else {
        player.moveTo(state.RoomManager.getRoom(player.getMeta('teleportRoom')), () => {
          B.sayAtExcept(player.room, `${player.name} suddenly appears ${flair}.`, [player])
          state.CommandManager.get('look').execute('', player)
        })
      }
    } else {
      // if targeting a room, check it exists and player not already there
      if (isRoom) {
        targetRoom = state.RoomManager.getRoom(target)
        if (!targetRoom) {
          return B.sayAt(player, "That room doesn't exist.")
        } else if (targetRoom === player.room) {
          return B.sayAt(player, "You're already in that room.")
        }
      // if targeting a player, check they're connected and player not already there
      } else {
        targetPlayer = state.PlayerManager.getPlayer(target)
        if (!targetPlayer) {
          return B.sayAt(player, 'No such player is connected.')
        } else if (targetPlayer === player || targetPlayer.room === player.room) {
          return B.sayAt(player, "You're already in that player's room.")
        }
        targetRoom = targetPlayer.room
      }

      // ditch followers
      if (player.followers.size > 0) {
        state.CommandManager.get('ditch').execute('all', player)
      }

      // announce teleport
      B.sayAt(player, `You ${arg0} to ${(targetPlayer && targetPlayer.name) || targetRoom.title} ${flair}.\n`)
      B.sayAtExcept(player.room, `${player.name} suddenly disappears ${flair}.`, [player])

      // move player and announce arrival
      player.moveTo(targetRoom, () => {
        state.CommandManager.get('look').execute('', player)
        B.sayAtExcept(player.room, `${player.name} suddenly appears ${flair}.`, [player])
      })
    }
  }
}
