const { Broadcast: B, Logger } = require('ranvier')
const sprintf = require('sprintf-js').sprintf
const width = 80
const bar = B.line(width, '-', 'white') + '\r\n'
const nl = '\r\n'
const noHelpfile = (player, args) => B.sayAt(player, `No matching helpfile found for ${args}.`)

/**
 * Search for and display a Helpfile
 * Handles 'credits' command
 */
module.exports = {
  usage: 'help [search] <keyword>',

  command: (state) => (args, player) => {
    // if no argument provided, display 'help' helpfile
    if (!args) {
      return state.CommandManager.get('help').execute('help', player)
    }

    const parts = args.split(' ')

    // if searching helpfiles, handle search
    if (parts[0].match(/\bsearch\b/i)) {
      return searchHelpfiles(parts.slice(1).join(' '), player, state)
    }

    // attempt getting exactly matching helpfile name
    let hfile = state.HelpManager.get(args)

    // if no exactly matching helpfile name found
    if (!hfile) {
      // attempting getting first helpfile with exactly matching keyword or alias
      hfile = state.HelpManager.getFirst(args, true)

      // if helpfile still not found, attempt geting first helpfile with partially matching keyword or alias
      if (!hfile) hfile = state.HelpManager.getFirst(args, false)

      // if no helpfile found
      if (!hfile) {
        Logger.warn(`${player.name} tried displaying invalid helpfile: [ ${args} ]`)
        return noHelpfile(player, args)
      }
    }

    // if player has insufficient role, reject command
    if (hfile.command && state.CommandManager.get(hfile.command).requiredRole > player.role) {
      return noHelpfile(player)
    }

    // attempt displaying helpfile
    try {
      B.sayAt(player, render(state, hfile))
    // handle helpfile display error
    } catch (e) {
      Logger.error(`UNRENDERABLE HELPFILE: [ ${args} ]`)
      Logger.warn(e)
      B.sayAt(player, `Helpfile for ${args} is unrenderable.`)
    }
  }
}

// helper function for displaying a helpfile
function render (state, hfile) {
  let body = hfile.body.trim()
  const name = hfile.name

  // helper function for formatting header text
  const formatHeaderItem = (item, value) =>
    sprintf('%10s', `${item}: `) + B.wrap(value, 70, 10) + nl

  const commandType = (hfile) => {
    if (hfile.command) return 'COMMAND'
    if (hfile.channel) return 'CHANNEL'
    else return 'HELP'
  }

  const top = B.center(width, commandType(hfile), 'white', '-') + nl
  let header = top + B.center(width, name, 'white') + nl + bar + nl

  // handle helpfile for a command
  if (hfile.command) {
    const actualCommand = state.CommandManager.get(hfile.command)

    if (actualCommand) {
      header += formatHeaderItem('Syntax', actualCommand.usage)

      if (actualCommand.aliases && actualCommand.aliases.length > 0) {
        header += nl
        header += formatHeaderItem(' Aliases', actualCommand.aliases.join(', '))
      }

      header += nl
    }
  // handle helpfile for a channel
  } else if (hfile.channel) {
    header += formatHeaderItem('Syntax', state.ChannelManager.get(hfile.channel).getUsage())
    header += nl
    body = state.ChannelManager.get(hfile.channel).description
  }

  let footer = bar
  if (hfile.related.length) {
    footer = B.center(width, 'RELATED', 'white', '-') + nl
    const related = hfile.related.join(', ')
    footer += B.center(width, related) + nl
    footer += bar
  }

  // return renderable helpfile
  return header + B.indent(B.wrap(body, 78), 1) + nl + nl + footer
}

// helper function for searching and listing helpfiles
function searchHelpfiles (args, player, state) {
  // if no argument provided, display 'help' helpfile
  if (!args) {
    return state.CommandManager.get('help').execute('help', player)
  }

  // search for matching helpfiles
  const results = state.HelpManager.find(args)

  // handle no matching helpfiles found
  if (!results.size) {
    return B.sayAt(player, 'No results were found for your search.')
  }

  // handle one matching helpfile found
  if (results.size === 1) {
    const [_, hfile] = [...results][0]
    return B.sayAt(player, render(state, hfile))
  }

  // handle multiple matching helpfiles found
  const top = B.center(width, 'SEARCH RESULTS', 'white', '-') + nl
  B.sayAt(player, top + B.center(width, `'${args}'`, 'white') + nl + bar)
  let res = ''
  for (const [name] of results) {
    res += `${name}  `
  }
  B.sayAt(player, B.center(80, res.trim(), 'white'))
  B.sayAt(player, nl + bar)
}
