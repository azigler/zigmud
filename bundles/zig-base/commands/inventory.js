const { Broadcast: B } = require('ranvier')
const TraceryUtil = require('./../../ranvier-tracery/lib/TraceryUtil')
const ArgParser = require('./../lib/ArgParser')

const nl = '\r\n'

/**
 * Display a Player's Inventory
 */
module.exports = {
  usage: 'inventory',

  command: (state) => (args, player) => {
    // handle showing another GameEntity's inventory
    // (e.g., for a 'peek' command or admin use)
    if (args && args.includes('$target=')) {
      let target = args.split('=')[1]
      target = ArgParser.parseDot(target, player.room.players) ||
                ArgParser.parseDot(target, player.room.npcs) ||
                ArgParser.parseDot(target, player.room.items) ||
                ArgParser.parseDot(target, player.inventory) ||
                ArgParser.parseDot(target, player.equipment)

      return printEntityInventory(player, target)
    }

    return printEntityInventory(player)
  }
}

// helper function for printing a GameEntity's Inventory
function printEntityInventory (player, target = player) {
  if (player !== target) {
    if (target.isNpc) {
      B.sayAt(player, `They are carrying:${nl}`)
    } else {
      B.sayAt(player, `It contains:${nl}`)
    }
  } else {
    B.sayAt(player, `You are carrying:${nl}`)
  }

  // handle if inventory is empty
  if (target.inventory === null || !target.inventory.size) {
    B.sayAt(player, 'nothing...', false, undefined, undefined, 2)
    if (player !== target) {
      return printInventoryCapacity(player, target)
    } else {
      return printInventoryCapacity(player, player)
    }
  }

  // print inventory list
  for (const print of TraceryUtil.pluralizeEntityList(target.inventory, undefined, true)) {
    B.sayAt(player, print, false)
  }

  printInventoryCapacity(player, target)
}

// helper function for printing a GameEntity's Inventory capacity
function printInventoryCapacity (player, target) {
  if (target.inventory === null) return
  if (isFinite(target.inventory.getMax())) {
    return B.sayAt(player, `${nl}(${target.inventory.size}/${target.inventory.getMax()})`)
  }
}
