const { Broadcast: B } = require('ranvier')
const ArgParser = require('./../../../lib/ArgParser')

/**
 * Give an Item from the Player's Inventory to another Character
 *
 * @fires Item#given
 * @fires Player#giveItem
 * @fires Player#givenItem
 */
module.exports = {
  usage: 'give <item>/all [to] <recipient>',

  command: state => (args, player) => {
    // if no argument provided, reject command
    if (!args) {
      return B.sayAt(player, 'Give what?')
    }

    // filter 'to' preposition from arguments
    // (e.g., 'give ball to man' becomes 'give ball man')
    let [targetItem, targetRecip] = args.split(' ').filter(arg => !arg.match(/\bto\b/i))

    // if there's recipient provided, reject command
    if (!targetRecip) {
      return B.sayAt(player, 'Give to whom?')
    }

    let all = false
    if (targetItem === 'all') {
      all = true
    } else {
      // determine matching item to give from player's inventory
      targetItem = ArgParser.parseDot(targetItem, player.inventory)
    }

    // if player doesn't have matching item in inventory, reject command
    if (!targetItem) {
      return B.sayAt(player, "You don't have that.")
    }

    // if player is targeting themselves as recipient, reject command
    if (targetRecip === 'me' || targetRecip === 'self') {
      return B.sayAt(player, "You can't give something to yourself.")
    }

    // prioritize players before NPCs as recipients
    let target = ArgParser.parseDot(targetRecip, player.room.players)

    // if no matching player found, check NPCs in room
    if (!target) {
      target = ArgParser.parseDot(targetRecip, player.room.npcs)
      if (target) {
        const accepts = target.getBehavior('accepts')

        // if giving all items from inventory to an NPC
        if (all) {
          // if player has items, attempt giving each to NPC
          if (player.inventory.size > 0) {
            player.inventory.forEach(function (value) {
              if (accepts === true || (Array.isArray(accepts) && accepts.includes(value.entityReference))) {
                giveItem(value, player, target)
              } else {
                return B.sayAt(player, B.capitalize(`${target.name} won't accept ${value.name} from you.`))
              }
            })
            return
          // otherwise, announce there's nothing to give
          } else {
            return B.sayAt(player, "There's nothing in your inventory.")
          }
        }

        // if NPC isn't configured to accept matching item, stop
        if (!accepts || (typeof accepts !== 'boolean' && !accepts.includes(targetItem.entityReference))) {
          return B.sayAt(player, B.capitalize(`${target.name} won't accept ${targetItem.name} from you.`))
        }
      }
    }

    // if no recipient, reject command
    if (!target) {
      return B.sayAt(player, 'Give to whom?')
    }

    // if player is targeting themselves as recipient, reject command
    if (target === player) {
      return B.sayAt(player, "You can't give something to yourself.")
    }

    // if giving all items from inventory to another player
    if (all) {
      // if player has items, attempt giving each to NPC
      if (player.inventory.size > 0) {
        player.inventory.forEach(function (value) {
          giveItem(value, player, target)
        })
      // otherwise, announce there's nothing to give
      } else {
        return B.sayAt(player, "There's nothing in your inventory.")
      }
      return
    }

    giveItem(targetItem, player, target)
  }
}

// helper function for giving an item
function giveItem (targetItem, player, target) {
  // if recipient's inventory is full, stop
  if (target.isInventoryFull()) {
    B.sayAt(player, `You try to give ${targetItem.name} to ${target.name}, but they can't carry any more.`)
    B.sayAtExcept(player.room, `${player.name} tries to give ${targetItem.name} to ${target.name}, but they can't carry any more.`, [player, target])
    if (!target.isNpc) {
      B.sayAt(target, `${player.name} tries to give ${targetItem.name} to you, but you can't carry any more.`)
    }
    return
  }

  // remove item from player
  player.removeItem(targetItem)

  // add the item to recipient
  target.addItem(targetItem)

  // announce gving item
  B.sayAt(player, `You give ${targetItem.name} to ${target.name}.`)
  B.sayAtExcept(player.room, B.capitalize(`${player.name} gives ${targetItem.name} to ${target.name}.`), [player, target])
  if (!target.isNpc) {
    B.sayAt(target, `${player.name} gives ${targetItem.name} to you.`)
  }

  /**
   * @event Item#given
   // TODO: use event
  */
  targetItem.emit('given', player, target)

  /**
   * @event Player#giveItem
   // TODO: use event
  */
  player.emit('giveItem', targetItem, target)

  /**
   * @event Character#givenItem
   // TODO: use event
  */
  target.emit('givenItem', targetItem, player)
}
