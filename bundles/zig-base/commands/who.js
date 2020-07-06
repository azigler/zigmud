const { Broadcast: B, PlayerRoles } = require('ranvier')
const sprintf = require('sprintf-js').sprintf
const nl = '\r\n'

/**
 * Display a list of connected Players
 * Handles 'whovis' and 'whoinvis' commands
 */
module.exports = {
  usage: 'who [vis]/[title] <title>',

  command: (state) => (args, player) => {
    // if arguments provided, attempt matching them
    if (args) {
      const parts = args.split(' ')

      // handle setting who list title
      if (parts[0].match(/\btitle\b/i)) {
        // throw away argument
        parts.shift()

        const title = parts.join(' ')

        // set metadata if missing
        if (!player.getMeta('flair')) {
          player.setMeta('flair', {})
        }

        // reject who title if too long
        // (strips out formatting when counting length)
        if (title.replace(/<.+?>/gi, '').length > 43) {
          return B.sayAt(player, 'Your who title cannot be longer than 43 characters.')
        }

        // set who title
        player.setMeta('flair.whotitle', title)

        // announce setting who title to player
        if (title.length === 0) {
          return B.sayAt(player, 'You clear your who title.')
        } else {
          return B.sayAt(player, `Your who title is now: ${title}`)
        }
      }

      // handle setting who list visibility
      if (parts[0].match(/vis/i)) {
        // throw away argument
        parts.shift()

        const option = parts.join(' ')

        // set metadata if missing
        if (!player.getMeta('flair')) {
          player.setMeta('flair', {})
        }

        // determine current who list visibility
        const vis = player.getMeta('flair.whovis') !== undefined ? player.getMeta('flair.whovis') : true

        // handle 'whoinvis' and 'whovis' alias commands
        if (option.includes('$vis=')) {
          if (option.split('=')[1] === 'true') {
            player.setMeta('flair.whovis', true)
          } else {
            player.setMeta('flair.whovis', false)
            player.setMeta('flair.wherevis', false)
          }
        // otherwise, toggle current who visibility
        } else {
          player.setMeta('flair.whovis', !vis)
        }

        // announce setting who list visibility
        if (!player.getMeta('flair.whovis')) {
          return B.sayAt(player, B.wrap("You are now invisible on the who and where lists. Use the 'whovis' command to toggle on who list visibility.", 80))
        } else {
          return B.sayAt(player, B.wrap("You are now visible on the who list. Use the 'whoinvis' command to toggle off who list visibility.", 80))
        }
      }
    }

    // if no valid arguments provided, display who list
    B.sayAt(player, B.line(80, '='))
    B.sayAt(player, B.center(80, 'WHO'))
    B.sayAt(player, B.line(80, '='))
    B.at(player, nl)

    let whoinvisPlayers = 0

    // display who list contents for connected players
    state.PlayerManager.players.forEach((otherPlayer) => {
      printWhoEntry(player, otherPlayer)
      if (otherPlayer.getMeta('flair.whovis') === false) {
        whoinvisPlayers++
      }
    })

    // display total counts
    B.at(player, nl)
    if (whoinvisPlayers > 0) {
      B.sayAt(player, B.center(80, sprintf('%3s', `${whoinvisPlayers}`) + ' invisible'))
    }
    if (state.PlayerManager.players.size - whoinvisPlayers > 0) {
      B.sayAt(player, B.center(80, sprintf('%3s', `${state.PlayerManager.players.size - whoinvisPlayers}`) + ' visible  '))
    }
    B.at(player, nl)
    B.sayAt(player, B.center(80, sprintf('%3s', `${state.PlayerManager.players.size}`) + ' TOTAL    '))
    B.at(player, nl)
    B.sayAt(player, B.line(80, '='))
  }
}

// helper function for printing a single who list entry
function printWhoEntry (player, otherPlayer) {
  // set metadata if missing
  if (!otherPlayer.getMeta('flair')) {
    otherPlayer.setMeta('flair', {})
  }
  if (!otherPlayer.getMeta('flair.whotitle')) {
    otherPlayer.setMeta('flair.whotitle', '')
  }

  // determine who list glyph
  let glyph = '*'
  if (otherPlayer.getMeta('flair.whovis') === false) {
    if (player.role < PlayerRoles.BUILDER) {
      return
    } else {
      glyph = '%'
    }
  }

  // determine extra padding needed from styling tags
  let extraPadding = otherPlayer.metadata.flair.whotitle.match(/<.+?>/gi) || []
  extraPadding = extraPadding.join('').length

  // print who list entry
  B.sayAt(player, B.indent(sprintf('%-67s', `${glyph} ${otherPlayer.name} ${otherPlayer.metadata.flair.whotitle || ''}`) + `${extraPadding < 18 ? B.line(extraPadding, ' ') : B.line(18, ' ')}${getRoleString(otherPlayer.role)}`, 1))
}

// helper function for printing a role for a who list entry
function getRoleString (role = 0) {
  return [
    '[ PLAYER  ]',
    '[ BUILDER ]',
    '[ ADMIN   ]'
  ][role] || '[ ??????? ]'
}
