const { Broadcast: B, ItemType } = require('ranvier')
const ArgParser = require('./../../../lib/ArgParser')

/**
 * Get an Item from the Room or a container
 *
 * @fires Item#get
 * @fires Player#getItem
 * @fires Room#itemRetrieved
 * @fires Npc#itemRetrieved
 */
module.exports = {
  usage: 'get <item>/all [container]',
  aliases: ['take', 'retrieve', 'loot'],

  command: (state) => (args, player, arg0) => {
    // if no argument provided, reject command
    if (!args) {
      return B.sayAt(player, `${B.capitalize(arg0)} what?`)
    }

    // if player isn't in a room, reject command
    if (!player.room) {
      return B.sayAt(player, `You are unable to ${arg0} anything here.`)
    }

    // if player's inventory is full, reject command
    if (player.isInventoryFull()) {
      return B.sayAt(player, 'Your inventory is full.')
    }

    // filter 'from' preposition from arguments
    // (e.g., 'get ball from bag' becomes 'get ball bag')
    const parts = args.split(' ').filter(arg => !arg.match(/\bfrom\b/i))

    // handle 'loot' as an alias for 'get all'
    if (arg0 === 'loot') {
      if (parts[0] !== 'all') {
        parts.unshift('all')
      // if no target container provided, reject command
      } if (parts.length === 1) {
        return B.sayAt(player, `${B.capitalize(arg0)} which container?`)
      }
    }

    const targetItem = parts[0]
    let source
    let sourceType
    let container = null

    // if only one argument provided, set room as source
    // (e.g., 'get ball')
    if (parts.length === 1) {
      // set room as source
      source = player.room.items
      sourceType = 'room'

    // otherwise, set container as source
    // (e.g., 'get ball bag')
    } else {
      // find container in room, inventory, or equipment
      // check newest containers in room first
      container = ArgParser.parseDot(parts[1], [...player.room.items].reverse()) ||
                  ArgParser.parseDot(parts[1], player.inventory) ||
                  ArgParser.parseDot(parts[1], player.equipment)

      // if no container found, reject command
      if (!container) {
        return B.sayAt(player, `You don't see ${parts[1]} here.`)
      }

      // if targeted container isn't a container, reject command
      if (container.type !== ItemType.CONTAINER) {
        return B.sayAt(player, `${container.name} isn't a container.`)
      }

      // if container is closed, reject command
      if (container.closed) {
        return B.sayAt(player, `${container.name} is closed.`)
      }

      // set container as source
      source = container.inventory
      sourceType = 'container'
    }

    // if getting all items from source
    if (targetItem === 'all') {
      // if no source from which to retrieve items, reject command
      if (!source || ![...source].length) {
        if (sourceType === 'room') {
          return B.sayAt(player, `You see nothing to ${arg0} from here.`)
        } if (sourceType === 'container') {
          return B.sayAt(player, `You see nothing to ${arg0} from there.`)
        }
      }

      // attempt to get every item from source
      for (let item of source) {
        // handle if source is a Set
        if (Array.isArray(item)) {
          item = item[1]
        }

        // if player's inventory is full, stop
        if (player.isInventoryFull()) {
          return B.sayAt(player, 'Your inventory is full.')
        }

        // get item
        getItem(item, player, container, arg0)
      }

      return
    }

    // search for item in source
    const item = ArgParser.parseDot(targetItem, source)

    // if no matching item found in specified source, reject command
    if (!item) {
      if (sourceType === 'room') {
        return B.sayAt(player, "You don't see that here.")
      } if (sourceType === 'container') {
        return B.sayAt(player, "You don't see that in there.")
      }
    }

    // get item
    getItem(item, player, container, arg0)
  }
}

// helper function for getting an item
function getItem (item, player, container, arg0) {
  // if item is irretrievable, stop
  if (item.metadata.irretrievable) {
    return B.sayAt(player, `You can't ${arg0} ${item.name}.`)
  }

  // if container was provided, remove item from it
  if (container) {
    container.removeItem(item)
  // otherwise, remove item from room
  } else {
    player.room.removeItem(item)
  }

  // add item to player's inventory
  player.addItem(item)

  // announce getting item
  if (container) {
    B.sayAt(player, `You ${arg0} ${item.name} from ${container.name}.`)
    B.sayAtExcept(player.room, B.capitalize(`${player.name} ${arg0}s ${item.name} from ${container.name}.`), [player])
  } else {
    B.sayAt(player, `You get ${item.name}.`)
    B.sayAtExcept(player.room, B.capitalize(`${player.name} ${arg0}s ${item.name}.`), [player])
  }

  /**
   * @event Item#get
   * (currently unused)
   */
  item.emit('get', player)

  /**
   * @event Player#getItem
   * (currently unused)
   */
  player.emit('getItem', item)

  /**
   * @event Room#itemRetrieved
   * (currently unused)
   */
  player.room.emit('itemRetrieved', player, item)

  // notify all NPCs in room
  for (const npc of player.room.npcs) {
    /**
     * @event Npc#itemRetrieved
     * (currently unused)
     */
    npc.emit('itemRetrieved', player, item)
  }
}