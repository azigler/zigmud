const { Broadcast: B, ItemType } = require('ranvier')
const ArgParser = require('./../../../lib/ArgParser')

/**
 * Remove an Item from the Player's equipment into their Inventory
 */
module.exports = {
  usage: 'remove <item/slot>/all',
  aliases: ['unequip', 'unhold'],

  command: state => (args, player, arg0) => {
    // if no argument provided, reject command
    if (!args.length) {
      return B.sayAt(player, `${B.capitalize(arg0)} what?`)
    }

    // if attempting to remove all items
    if (args === 'all') {
      // if player is wearing, attempt removing each
      if (player.equipment.size > 0) {
        for (let [slot, item] of player.equipment) {
          // handle if equipment is a Set
          if (Array.isArray(item)) {
            item = item[1]
          }

          // if player's inventory is full, reject command
          if (checkInventoryFull(item, slot, player, arg0)) return

          // adjust arg0 based on item type
          const arg00 = adjustArg0(arg0, item)

          removeItem(item, slot, player, arg00)
        }

      // otherwise, announce there's nothing to remove
      } else {
        return B.sayAt(player, "You aren't wearing anything.")
      }
      return
    }
    // determine item and slot from player's equipment
    const result = ArgParser.parseDot(args, player.equipment, true)
    let slot, item

    // if player isn't wearing matching item, check matching slot
    if (!result) {
      for (const [sl, eq] of player.equipment) {
        // remove first matched slot
        if (sl.includes(args)) {
          slot = sl
          item = eq
          break
        }
      }

      // otherwise, reject command
      if (!slot) {
        return B.sayAt(player, "You aren't wearing that.")
      }
    } else {
      [slot, item] = result
    }

    // if player's inventory is full, reject command
    if (checkInventoryFull(item, slot, player, arg0)) return

    // adjust arg0 based on item type
    const arg00 = adjustArg0(arg0, item)

    removeItem(item, slot, player, arg00)
  }
}

// helper function for removing an item
function removeItem (item, slot, player, arg0) {
  // remove the item
  player.unequip(slot)

  // announce remove item
  if (item.type === ItemType.WEAPON) {
    B.sayAt(player, `You ${arg0} ${item.name} from your ${slot}.`)
    B.sayAtExcept(player.room, B.capitalize(`${player.name} ${arg0}${arg0 === 'unbrandish' ? 'es' : 's'} ${item.name} from their ${slot}.`), player)
  } else {
    B.sayAt(player, `You ${arg0} ${item.name} from your ${slot}.`)
    B.sayAtExcept(player.room, `${player.name} ${arg0}s ${item.name} from their ${slot}.`, [player])
  }
}

// helper function for checking if player's inventory is full
function checkInventoryFull (item, slot, player, arg0) {
  // if player's inventory is full, stop
  if (player.isInventoryFull()) {
    B.sayAt(player, `You try to ${arg0} ${item.name} from ${slot} but your inventory is full.`)
    B.sayAtExcept(player.room, `${player.name} tries to ${arg0} ${item.name} from their ${slot}, but their inventory is full.`, [player])
    return true
  } else {
    return false
  }
}

// helper function to adjust arg0 based on item type
function adjustArg0 (arg0, item) {
  if (item.type === ItemType.WEAPON) {
    switch (arg0) {
      default: {
        return arg0
      }
    }
  } else {
    switch (arg0) {
      case 'unhold': {
        return 'remove'
      }
      default: {
        return arg0
      }
    }
  }
}
