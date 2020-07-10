const { Broadcast: B, PlayerRoles } = require('ranvier')
const sprintf = require('sprintf-js').sprintf
const nl = '\r\n'

/**
 * Display a list of Rooms with Players
 * Handles 'wherevis', 'whoinvis', and 'whereanon' commands
 */
module.exports = {
  usage: 'where [vis/anon]',

  command: (state) => (args, player) => {
    // if arguments provided, attempt matching them
    if (args) {
      const parts = args.split(' ')

      // handle setting where list visibility
      if (parts[0].match(/(vis|anon)/i)) {
        // throw away argument
        parts.shift()

        const option = parts.join(' ')

        // set metadata if missing
        if (!player.getMeta('flair')) {
          player.setMeta('flair', {})
        }

        // determine current where list visibility
        const vis = player.getMeta('flair.wherevis') !== undefined ? player.getMeta('flair.wherevis') : true

        // handle 'whereinvis', 'wherevis', and 'whereanon' alias commands
        if (option.includes('$vis=')) {
          if (option.split('=')[1] === 'true') {
            player.setMeta('flair.wherevis', true)
          }
          if (option.split('=')[1] === 'false') {
            player.setMeta('flair.wherevis', false)
            player.setMeta('flair.whovis', false)
          } if (option.split('=')[1] === 'anon') {
            player.setMeta('flair.wherevis', 'anon')
          }
        // otherwise, toggle current where visibility
        } else {
          // cycle through options
          if (vis === 'anon') {
            player.setMeta('flair.wherevis', true)
          } if (vis === true) {
            player.setMeta('flair.wherevis', false)
            player.setMeta('flair.whovis', false)
          } if (vis === false) {
            player.setMeta('flair.wherevis', 'anon')
          }
        }

        // announce setting where list visibility
        if (player.getMeta('flair.wherevis') === false) {
          return B.sayAt(player, "You are now invisible on the where and who lists. Use the 'wherevis' or 'whereanon' command to change your where list visibility.")
        }
        if (player.getMeta('flair.wherevis') === true) {
          return B.sayAt(player, "You are now visible on the where list. Use the 'whereinvis' or 'whereanon' command to change your where list visibility.")
        } else {
          return B.sayAt(player, "You are now anonymous on the where list. Use the 'wherevis' or 'whereinvis' command to change your where list visibility.")
        }
      }
    }

    // if no valid arguments provided, display where list
    printWhereList(state, player)
  }
}

// helper function for printing the where list
function printWhereList (state, player) {
  B.sayAt(player, B.line(80, '='))
  B.sayAt(player, B.center(80, 'WHERE'), false)
  B.sayAt(player, B.line(80, '='))
  B.at(player, nl)

  const rooms = {}
  let anon = 0
  const vis = []
  let invis = 0

  // initialize extra information for builders and admins
  const builderStr = []

  // iterate over every player connected
  state.PlayerManager.players.forEach((otherPlayer) => {
    // set metadata if missing
    if (!otherPlayer.getMeta('flair')) {
      otherPlayer.setMeta('flair', {})
    }

    // initialize a record of player's room data, if necessary
    rooms[otherPlayer.room.entityReference] = rooms[otherPlayer.room.entityReference] || {
      title: otherPlayer.room.title,
      vis: [],
      invis: 0,
      anon: 0
    }

    // if no where visibility has been toggled for player
    if (otherPlayer.getMeta('flair.wherevis') === undefined) {
      otherPlayer.setMeta('flair.wherevis', true)
      vis.push(otherPlayer.name)
      rooms[otherPlayer.room.entityReference].vis.push(otherPlayer.name)
    // if player is visible on where list
    } else if (otherPlayer.getMeta('flair.wherevis') === true) {
      vis.push(otherPlayer.name)
      rooms[otherPlayer.room.entityReference].vis.push(otherPlayer.name)
    // if player is invisible on where list
    } else if (otherPlayer.getMeta('flair.wherevis') === false) {
      invis++
      rooms[otherPlayer.room.entityReference].invis = rooms[otherPlayer.room.entityReference].invis + 1
      builderStr.push(`% ${otherPlayer.name} - ${otherPlayer.room.title}`)
    // if player is anonymous on where list
    } else if (otherPlayer.getMeta('flair.wherevis') === 'anon') {
      anon++
      rooms[otherPlayer.room.entityReference].anon = rooms[otherPlayer.room.entityReference].anon + 1
      builderStr.push(`% ${otherPlayer.name} - ${otherPlayer.room.title}`)
    }
  })

  // determine rooms to display in where list based on player locations
  Object.keys(rooms).forEach((room) => {
    const vis = rooms[room].vis
    const anon = rooms[room].anon
    const title = rooms[room].title
    let str

    // if no visible or anonymous player in room, print nothing
    if (vis.length === 0 && anon === 0) {
      return
    }

    // if only anonymous players in room, add to entry
    if (vis.length === 0 && anon > 0) {
      if (anon === 1) str = `* ${title} - ${anon} player`
      else str = `* ${title} - ${anon} players`
    }

    // if only visible players in room, add to entry
    if (anon === 0 && vis.length > 0) {
      str = `* ${title}`
      if (vis.length === 1) {
        str += ` - ${vis[0]}`
      }
      if (vis.length === 2) {
        str += ` - ${vis[0]} and ${vis[1]}`
      } if (vis.length > 2) {
        str += ' - '
        for (const index in vis) {
          if (index < vis.length - 1) {
            str += `${vis[index]}, `
          } else {
            str += `and ${vis[index]}`
          }
        }
      }
    }

    // if visible and anonymous players in room, add to entry
    if (anon > 0 && vis.length > 0) {
      str = `* ${title}`
      if (vis.length === 1) {
        str += ` - ${vis[0]} `
      } else {
        str += ' - '
        for (const index in vis) {
          if (index < vis.length) {
            str += `${vis[index]}, `
          }
        }
      }
      if (anon === 1) str += `and ${anon} other player`
      else str += `and ${anon} other players`
    }

    // print where list entry for room
    B.sayAt(player, B.indent(B.wrap(str, 78, 2), 1), false)
  })

  // display total counts
  B.at(player, nl)
  if (vis.length > 0) {
    B.sayAt(player, B.center(80, sprintf('%3s', `${vis.length}`) + ' visible   '), false)
  }
  if (invis > 0) {
    B.sayAt(player, B.center(80, sprintf('%3s', `${invis}`) + ' invisible '), false)
  }
  if (anon > 0) {
    B.sayAt(player, B.center(80, sprintf('%3s', `${anon}`) + ' anonymous'), false)
  }
  B.at(player, nl)
  B.sayAt(player, B.center(80, sprintf('%3s', `${state.PlayerManager.players.size}`) + ' TOTAL    '), false)

  // list invisible players and their location
  if (player.role > PlayerRoles.BUILDER && builderStr.length > 0) {
    B.at(player, nl)
    while (builderStr.length > 0) {
      B.sayAt(player, B.indent(B.wrap(builderStr.shift(), 78, 2), 1), false)
    }
    B.at(player, nl)
  } else {
    B.at(player, nl)
  }
  B.sayAt(player, B.line(80, '='))
}
