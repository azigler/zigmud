const Ranvier = require('ranvier')
const { Broadcast: B, Logger, ItemType } = Ranvier
const { EquipSlotTakenError } = Ranvier.EquipErrors
const ArgParser = require('./../../../lib/ArgParser')

/**
 * Wear an Item in the Player's equipment from their Inventory
 */
module.exports = {
  usage: 'wear <item>/all [on] [slot]',
  aliases: ['wield', 'hold', 'equip', 'brandish', 'eq'],

  command: (state) => (args, player, arg0) => {
    // if the arg0 is 'eq' and no arguments provided, show equipment list
    if (arg0 === 'eq' && !args.length) {
      return state.CommandManager.get('equipment').execute(null, player)
    }

    // if no argument provided, reject command
    if (!args.length) {
      return B.sayAt(player, `${B.capitalize(arg0)} what?`)
    }

    // filter 'on' preposition from arguments
    // (e.g., 'wear pants on legs' becomes 'wear pants legs')
    const [itemArg, slotArg] = args.split(' ').filter(arg => !arg.match(/\bon\b/i))

    // if attempting to wear all items in inventory
    if (itemArg === 'all') {
      // if player has items, attempt wearing each
      if (player.inventory.size > 0) {
        for (let item of player.inventory) {
          // handle if inventory is a Set
          if (Array.isArray(item)) {
            item = item[1]
          }

          // adjust arg0 based on item type
          const arg00 = adjustArg0(arg0, item)

          // wear item
          wearItem(item, null, player, arg00)
        }

      // otherwise, announce there's nothing to wear
      } else {
        return B.sayAt(player, "There's nothing in your inventory.")
      }
      return
    }

    // determine matching item
    // prioritize newest items
    const item = ArgParser.parseDot(itemArg, [...player.inventory].reverse())

    // if there's no matching item to wear, reject command
    if (!item) {
      return B.sayAt(player, "That isn't in your inventory.")
    }

    // adjust arg0 based on item type
    const arg00 = adjustArg0(arg0, item)

    wearItem(item, slotArg, player, arg00)
  }
}

// helper function for wearing an item
function wearItem (item, slotArg, player, arg0) {
  // if item doesn't have 'slots' metadata property, stop
  if (!item.metadata.slots) {
    return B.sayAt(player, `You can't ${arg0} ${item.name}.`)
  }

  let wearSlot

  // handle no slot specified
  if (!slotArg) {
    // determine slot for item
    for (const slot of item.metadata.slots) {
      if (!player.equipment.has(slot)) {
        wearSlot = slot
        break
      }
    }

    // if no potential slot for item is empty, stop
    if (wearSlot === undefined) {
      return B.sayAt(player, `You have to remove something before you can ${arg0} ${item.name}.`)
    }
  // handle specified slot
  } else {
    // determine specified slot from first matching slot on item
    for (const slot of item.metadata.slots) {
      if (slot.includes(slotArg)) {
        wearSlot = slot
      }
    }
  }

  // if specified slot invalid for item, stop
  if (!wearSlot) {
    return B.sayAt(player, `You can't ${arg0} ${item.name} there.`)
  }

  // attempt wearing item
  try {
    player.equip(item, wearSlot)
  } catch (err) {
    if (err instanceof EquipSlotTakenError) {
      const conflict = player.equipment.get(wearSlot)
      if (item.metadata.slots.length === 1) {
        B.sayAt(player, `You have to remove ${conflict.name} before you can ${arg0} ${item.name}.`)
      } else {
        B.sayAt(player, `You have to remove something before you can ${arg0} ${item.name}.`)
      }
    }
    return Logger.error(err)
  }

  // announce wearing item in slot
  if (item.type === ItemType.WEAPON) {
    B.sayAt(player, `You ${arg0} ${item.name} in your ${wearSlot}.`)
    B.sayAtExcept(player.room, B.capitalize(`${player.name} ${arg0}${arg0 === 'brandish' ? 'es' : 's'} ${item.name} in their ${wearSlot}.`), player)
  } else {
    B.sayAt(player, `You ${arg0} ${item.name} on your ${wearSlot}.`)
    B.sayAtExcept(player.room, B.capitalize(`${player.name} ${arg0}s ${item.name} on their ${wearSlot}.`), player)
  }
}

// helper function to adjust arg0 based on item type
function adjustArg0 (arg0, item) {
  if (item.type === ItemType.WEAPON) {
    switch (arg0) {
      case 'wear':
      case 'eq': {
        return 'wield'
      }
      default: {
        return arg0
      }
    }
  } else {
    switch (arg0) {
      case 'eq':
      case 'wield':
      case 'hold':
      case 'brandish': {
        return 'wear'
      }
      default: {
        return arg0
      }
    }
  }
}
