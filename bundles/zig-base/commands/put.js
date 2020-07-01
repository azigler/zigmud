const { Broadcast: B, ItemType } = require('ranvier')
const ArgParser = require('./../../../lib/ArgParser')

/**
 * Put an Item from the Player's Inventory into a container
 *
 * @fires Item#put
 * @fires Player#putItem
 * @fires Item#itemPut
 */
module.exports = {
  usage: 'put <item>/all [in/into] <container>',
  aliases: ['stow'],

  command: (state) => (args, player, arg0) => {
    // if no argument provided, reject command
    if (!args) {
      return B.sayAt(player, `${B.capitalize(arg0)} what?`)
    }

    // filter 'in' and 'into' prepositions from arguments
    // (e.g., 'put ball in bag' and 'put ball into bag' become 'put ball bag')
    const parts = args.split(' ').filter(arg => !arg.match(/\bin(|to)\b/i))

    // set player's inventory as source
    const source = player.inventory

    // search for item in player's inventory
    const item = ArgParser.parseDot(parts[0], [...source].reverse())

    // if item found but no container provided, reject command
    if (parts.length === 1 && item) {
      return B.sayAt(player, `${B.capitalize(arg0)} ${item.name} where?`)
    }
    // handle special message for 'all' argument
    if (parts.length === 1 && parts[0].match(/\b^all\b/i)) {
      return B.sayAt(player, `${B.capitalize(arg0)} all where?`)
    // otherwise, reject command because item not found
    } else if (parts.length === 1) {
      return B.sayAt(player, "That isn't in your inventory.")
    }

    // determine the destination container
    // check newest containers in room and player inventory first
    const toContainer = ArgParser.parseDot(parts[1], [...player.room.items].reverse()) ||
                        ArgParser.parseDot(parts[1], [...player.inventory].reverse()) ||
                        ArgParser.parseDot(parts[1], player.equipment)

    // if putting all items from inventory into container
    if (parts[0].match(/\b^all\b/i)) {
      // if player has items, attempt putting each in container
      if (player.inventory.size > 0) {
        for (let item of player.inventory) {
          // handle if inventory is a Set
          if (Array.isArray(item)) {
            item = item[1]
          }

          if (checkPutting(item, player, toContainer, arg0)) {
            putItem(item, player, toContainer, arg0)
          }
        }

      // otherwise, announce there's nothing to put
      } else {
        return B.sayAt(player, "There's nothing in your inventory.")
      }
      return
    }

    // if item not found, reject command
    if (!item) {
      if (toContainer) {
        return B.sayAt(player, `${B.capitalize(arg0)} what in ${toContainer.name}?`)
      } else {
        return B.sayAt(player, `${B.capitalize(arg0)} what in what?`)
      }
    }

    if (checkPutting(item, player, toContainer, arg0)) {
      putItem(item, player, toContainer, arg0)
    }
  }
}

// helper function for putting an item
function putItem (item, player, container, arg0) {
  // remove item from player's inventory
  player.removeItem(item)

  // put item in destination container
  container.addItem(item)

  // announce putting item
  B.sayAt(player, `You ${arg0} ${item.name} in${arg0 === 'stow' ? '' : 'to'} ${container.name}.`)
  B.sayAtExcept(player.room, `${player.name} ${arg0}s ${item.name} in${arg0 === 'stow' ? '' : 'to'} ${container.name}.`, player)

  /**
   * @event Item#put
   // TODO: use event
  */
  item.emit('put', player, container)

  /**
   * @event Player#putItem
   // TODO: use event
  */
  player.emit('putItem', item, container)

  /**
   * @event Item#itemPut
   // TODO: use event
  */
  container.emit('itemPut', player, item)
}

// helper function for checking if container's inventory is full
function checkInventoryFull (item, player, container, arg0) {
  // if container's inventory is full, stop
  if (container.isInventoryFull()) {
    B.sayAt(player, `You try to ${arg0} ${item.name} in${arg0 === 'stow' ? '' : 'to'} ${container.name} but it's full.`)
    B.sayAtExcept(player.room, `${player.name} tries to ${arg0} ${item.name} in${arg0 === 'stow' ? '' : 'to'} ${container.name} but it's full.`, [player])
    return true
  } else {
    return false
  }
}

// helper function for checking if item can be put in container
function checkPutting (item, player, toContainer, arg0) {
  // if targeted destination container isn't a container, reject command
  if (toContainer.type !== ItemType.CONTAINER) {
    B.sayAt(player, `${B.capitalize(toContainer.name)} isn't a container.`)
    return false
  }

  // if item and destination container are the same, reject command
  if (toContainer.uuid === item.uuid) {
    B.sayAt(player, `You can't put ${toContainer.name} inside of itself.`)
    return false
  }

  // if destination container is closed, reject command
  if (toContainer.closed) {
    B.sayAt(player, `${B.capitalize(toContainer.name)} is closed.`)
    return false
  }

  // if container's inventory is full, reject command
  if (checkInventoryFull(item, player, toContainer, arg0)) return false

  return true
}
