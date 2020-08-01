const { Broadcast: B } = require('ranvier')
const TraceryUtil = require('./../../ranvier-tracery/lib/TraceryUtil')
const ArgParser = require('./../lib/ArgParser')
const sprintf = require('sprintf-js').sprintf

const nl = '\r\n'

/**
 * Display a Player's equipment
 */
module.exports = {
  usage: 'equipment',
  aliases: ['worn', 'armor'],

  command: (state) => (args, player) => {
    // handle showing another GameEntity's equipment
    // (e.g., for 'look' command)
    if (args && args.includes('$target=')) {
      let target = args.split('=')[1]
      target = ArgParser.parseDot(target, player.room.players) ||
                ArgParser.parseDot(target, player.room.npcs)

      return printEntityEquipment(player, target)
    }

    return printEntityEquipment(player)
  }
}

// helper function for printing a GameEntity's equipment
function printEntityEquipment (player, target = player) {
  // determine maximum print width for equipment slots
  const lengths = []
  let max = 0

  for (const [slot] of target.equipment) {
    lengths.push(`<${slot}>`.length)
  }

  if (lengths.length > 0) {
    max = lengths.reduce((a, b) => {
      return Math.max(a, b)
    })
  }

  // start printing equipment list
  if (player !== target) {
    B.sayAt(player, `They have equipped:${nl}`)
  } else {
    B.sayAt(player, `You have equipped:${nl}`)
  }

  // handle if no equipment worn
  if (!target.equipment.size) {
    return B.sayAt(player, 'nothing...', false, undefined, undefined, 2)
  }

  // format and print each slot with its equipment
  for (const [slot, item] of target.equipment) {
    B.at(player, sprintf(`%${max + 1}s `, `<${slot}>`))
    let itemName = TraceryUtil.pluralizeEntity(item)
    const re = RegExp(`([\\w/\\s]{${77 - max},}?)\\s?\\b`, 'g')
    if (itemName.slice(0, 2) === 'an') {
      itemName = itemName.replace(re, `$1\n${sprintf(`%${max + 6}s`, '')}`)
    } else {
      itemName = itemName.replace(re, `$1\n${sprintf(`%${max + 5}s`, '')}`)
    }
    B.sayAt(player, `${itemName}`, false)
  }
}
