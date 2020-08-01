const { Broadcast: B } = require('ranvier')
const ArgParser = require('./../lib/ArgParser')
const TraceryUtil = require('./../../ranvier-tracery/lib/TraceryUtil')

/**
 * Drop an Item in the Room from the Player's Inventory
 *
 * @fires Item#drop
 * @fires Player#dropItem
 * @fires Room#itemDropped
 * @fires Npc#itemDropped
 */
module.exports = {
  usage: 'drop <item>/all',
  aliases: ['relinquish'],

  command: (state) => (args, player, arg0) => {
    // if no argument provided, reject command
    if (!args.length) {
      return B.sayAt(player, `${B.capitalize(arg0)} what?`)
    }

    // if dropping all items in inventory
    if (args.match(/\b^all\b/i)) {
      // if player has items, drop them
      if (player.inventory.size > 0) {
        player.inventory.forEach(function (value) {
          dropItem(value, player, arg0)
        })
        // otherwise, announce there's nothing to drop
      } else {
        return B.sayAt(player, "There's nothing in your inventory.")
      }
    // otherwise, drop specified item
    } else {
      // search for item to drop
      // prioritize newest items
      const item = ArgParser.parseDot(args, player.inventory)
      dropItem(item, player, arg0)
    }
  }
}

// helper function for dropping an item
function dropItem (item, player, arg0) {
  // if no matching item found, stop
  if (!item) {
    return B.sayAt(player, "That isn't in your inventory.")
  }

  // remove item from player's inventory
  player.removeItem(item)

  // add item to room
  player.room.addItem(item)

  // announce dropping item
  B.sayAt(player, `You ${arg0} ${TraceryUtil.pluralizeEntity(item)}.`)
  B.sayAtExcept(player.room, `${player.name} ${arg0}${arg0 === 'relinquish' ? 'es' : 's'} ${TraceryUtil.pluralizeEntity(item)}.`, [player])

  /**
   * @event Item#drop
   // TODO: use event
   */
  item.emit('drop', player)

  /**
   * @event Player#dropItem
   * (current unused)
   */
  player.emit('dropItem', item)

  /**
   * @event Room#itemDropped
   // TODO: use event
   */
  player.room.emit('itemDropped', player, item)

  // notify all NPCs in room
  for (const npc of player.room.npcs) {
    /**
     * @event Npc#itemDropped
     // TODO: use event
     */
    npc.emit('itemDropped', player, item)
  }
}
