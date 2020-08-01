const { Broadcast: B, Item, ItemType, Character } = require('ranvier')
const ArgParser = require('../lib/ArgParser')
const TraceryUtil = require('./../../ranvier-tracery/lib/TraceryUtil')

const nl = '\r\n'

/**
 * Look at a GameEntity
 * (e.g., Item, Character, or a Room)
 */
module.exports = {
  usage: 'look [target]',
  aliases: ['glance', 'examine'],

  command: state => (args, player, arg0) => {
    // if arguments provided, attempt looking at the arguments
    if (args) {
      return lookEntity(state, player, args, arg0)
    } else {
      // otherwise, look at the Player's room
      lookRoom(state, player, arg0)
    }
  }
}

// helper function for looking at a Room
function lookRoom (state, player, arg0) {
  const room = player.room
  TraceryUtil.flattenEntityProps(room)

  // announce the action to the player
  if (arg0 && arg0 === 'examine') {
    B.sayAt(player, `You examine your surroundings...${nl}`)
  } else if (arg0) {
    B.sayAt(player, `You ${arg0} at your surroundings...${nl}`)
  } else {
    B.sayAt(player, `You look at your surroundings...${nl}`)
  }

  // print room title
  B.sayAt(player, room.title, undefined, undefined, undefined, 1)

  // print decorative divider line
  B.sayAt(player, B.line(39, '*~') + '*', false)

  // print room description
  B.sayAt(player, B.indent(B.wrap(room.description, 78), 1), false)

  // start printing the room's exits
  B.at(player, `${nl} [exits: `)

  // find explicitly defined exits
  let foundExits = Array.from(room.exits).map(ex => {
    return [ex.direction, state.RoomManager.getRoom(ex.roomId)]
  })

  // infer directions from coordinates
  if (room.coordinates) {
    const coords = room.coordinates
    const area = room.area
    const directions = {
      north: [0, 1, 0],
      south: [0, -1, 0],
      east: [1, 0, 0],
      west: [-1, 0, 0],
      up: [0, 0, 1],
      down: [0, 0, -1]
      // northeast: [1, 1, 0]
      // TODO: add others
    }

    foundExits = [...foundExits, ...(Object.entries(directions)
      .map(([dir, diff]) => {
        return [dir, area.getRoomAtCoordinates(coords.x + diff[0], coords.y + diff[1], coords.z + diff[2])]
      })
      .filter(([dir, exitRoom]) => {
        return !!exitRoom
      })
    )]
  }

  // print list of exits, indicating any doors
  B.at(player, foundExits.map(([dir, exitRoom]) => {
    const door = room.getDoor(exitRoom) || exitRoom.getDoor(room)
    if (door && (door.locked || door.closed)) {
      return '(' + dir + ')'
    }

    return dir
  }).join(' '))

  // handle if there are no exits
  if (!foundExits.length) {
    B.at(player, 'none')
  }

  // finish printing exits
  B.sayAt(player, ']')

  // if there are Players, list them
  if (room.players.size > 1) {
    B.at(player, nl)

    room.players.forEach(otherPlayer => {
      // don't list the player's own name
      if (otherPlayer === player) {
        return
      }
      B.sayAt(player, `  ${otherPlayer.name} is here`, false)
    })
  }

  // if there are Npcs, list them
  if (room.npcs.size > 0) {
    B.at(player, nl)

    for (const print of TraceryUtil.pluralizeEntityList(room.npcs, undefined, true)) {
      // TODO: add roomDesc
      B.sayAt(player, print + ' is here', false)
    }
  }

  // if there are Items, list them
  if (room.items.size > 0) {
    B.at(player, nl)

    for (const print of TraceryUtil.pluralizeEntityList(room.items, 'roomDesc', true)) {
      B.sayAt(player, print, false)
    }
  }
}

// helper function for looking at a non-Room GameEntity
function lookEntity (state, player, args, arg0) {
  const room = player.room

  args = args.split(' ')
  let search = null

  // check if the first argument is 'in' or 'at'
  if (args.length > 1) {
    // don't allow 'examine' with a preposition
    if (arg0 === 'examine') {
      return B.sayAt(player, 'Huh?')
    }
    search = (args[0] === 'in' || args[0] === 'at') ? args[1] : args[0]
  } else {
    search = args[0]
  }

  // check if trying to look at the Room
  if (search === 'here' || search === 'room') {
    if (args[0] === 'in') {
      return B.sayAt(player, 'Huh?')
    }
    return lookRoom(state, player, arg0)
  }

  // check if target is the Player's own self
  if (search === 'me' || search === 'self' || search === 'myself' || search === player.name.toLowerCase() || search === player.name) {
    // announce the action to Player
    if (arg0 && arg0 === 'examine') {
      B.sayAt(player, 'You examine yourself...')
    } else if (arg0 && arg0 === 'glance') {
      B.sayAt(player, 'You glance at yourself...')
    } else if (arg0) {
      B.sayAt(player, `You ${arg0} yourself...`)
    } else {
      B.sayAt(player, 'You look at yourself...')
    }

    // print Player's own description
    B.sayAt(player, nl + player.description + nl, 80)

    // print a list of Player's own equipment, if they have any
    return state.CommandManager.get('equipment').execute(undefined, player)
  }

  // otherwise, search Player's Inventory and equipment before
  // checking the room's players, NPCs, and items to find the target
  const entity = ArgParser.parseDot(search, player.inventory) ||
                 ArgParser.parseDot(search, player.equipment) ||
                 ArgParser.parseDot(search, room.players) ||
                 ArgParser.parseDot(search, room.npcs) ||
                 ArgParser.parseDot(search, room.items)

  // if there's no matching entity
  if (!entity) {
    return B.sayAt(player, "You don't see that.")
  }

  // if the entity is a Character
  if (entity instanceof Character) {
    TraceryUtil.flattenEntityProps(entity)

    // announce the action to Player
    if (arg0 && arg0 === 'examine') {
      B.sayAt(player, `You examine ${TraceryUtil.pluralizeEntity(entity)}.`)
    } else if (arg0 && arg0 === 'glance') {
      B.sayAt(player, `You glance at ${TraceryUtil.pluralizeEntity(entity)}.`)
    } else if (arg0) {
      B.sayAt(player, `You ${arg0} ${TraceryUtil.pluralizeEntity(entity)}.`)
    } else {
      B.sayAt(player, `You look at ${TraceryUtil.pluralizeEntity(entity)}.`)
    }

    // announce the action to target
    if (arg0 && arg0 === 'examine') {
      B.sayAt(entity, `${player.name} examines you.`)
    } else if (arg0 && arg0 === 'glance') {
      B.sayAt(entity, `${player.name} glances at you.`)
    } else if (arg0) {
      B.sayAt(entity, `${player.name} ${arg0}s at you.`)
    } else {
      B.sayAt(entity, `${player.name} looks at you.`)
    }

    // announce the action to everyone in Room
    if (arg0 && arg0 === 'examine') {
      B.sayAtExcept(player.room, `${player.name} examines ${TraceryUtil.pluralizeEntity(entity)}.`, [player, entity])
    } else if (arg0 && arg0 === 'glance') {
      B.sayAtExcept(player.room, `${player.name} glances at ${TraceryUtil.pluralizeEntity(entity)}.`, [player, entity])
    } else if (arg0) {
      B.sayAtExcept(player.room, `${player.name} ${arg0}s at ${TraceryUtil.pluralizeEntity(entity)}.`, [player, entity])
    } else {
      B.sayAtExcept(player.room, `${player.name} looks at ${TraceryUtil.pluralizeEntity(entity)}.`, [player, entity])
    }

    // print Character's description
    B.sayAt(player, nl + entity.description + nl, 80)

    // print Character's equipment list
    if (entity.isNpc) {
      return state.CommandManager.get('equipment').execute(`$target=${entity.uuid}`, player)
    } else {
      return state.CommandManager.get('equipment').execute(`$target=${entity.name}`, player)
    }
  }

  // if the entity is an Item
  if (entity instanceof Item) {
    TraceryUtil.flattenEntityProps(entity)

    if (entity.closed && args[0] === 'in') {
      return B.sayAt(player, 'It is closed.')
    }

    // announce the action to Player
    if (arg0 && arg0 === 'examine') {
      B.sayAt(player, `You examine ${TraceryUtil.pluralizeEntity(entity)}.`)
    } else if (arg0 && arg0 === 'glance') {
      B.sayAt(player, `You glance ${args[0] === 'at' || args[0] === 'in' ? args[0] : 'at'} ${TraceryUtil.pluralizeEntity(entity)}.`)
    } else if (arg0) {
      B.sayAt(player, `You ${arg0} ${args[0] === 'at' || args[0] === 'in' ? args[0] : 'at'} ${TraceryUtil.pluralizeEntity(entity)}.`)
    } else {
      B.sayAt(player, `You look ${args[0] === 'at' || args[0] === 'in' ? args[0] : 'at'} ${TraceryUtil.pluralizeEntity(entity)}.`)
    }

    if (args[0] !== 'in') {
      B.sayAt(player, nl + entity.description, 80)
    }

    if (args[0] === 'in') {
      switch (entity.type) {
        case ItemType.CONTAINER: {
          B.at(player, nl)
          return state.CommandManager.get('inventory').execute(`$target=${entity.uuid}`, player)
        }
      }
    }
  }
}
