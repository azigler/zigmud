const {
  WorldAudience,
  AreaAudience,
  RoomAudience,
  RoleAudience,
  PrivateAudience,
  PlayerRoles
} = require('ranvier')
const WhisperAudience = require('./../../lib/WhisperAudience')
const PartyCommunicatorAudience = require('./../../lib/PartyCommunicatorAudience')
const { Channel } = require('ranvier').Channel

/**
 * SAY      room
 * TELL     target
 * WHISPER  target in room
 * YELL     area
 * GTELL    room & party with communicator
 * OOC      global
 * ADMIN    global
 * BUILDER  global
 */
module.exports = [
  // SAY (room)
  new Channel({
    name: 'say',
    aliases: ["'"],
    audience: new RoomAudience(),
    formatter: {
      sender: function (sender, target, message, colorify) {
        return colorify(`You say, "${message}"`)
      },

      target: function (sender, target, message, colorify) {
        return colorify(`${sender.name} says, "${message}"`)
      }
    }
  }),

  // TELL (target)
  new Channel({
    name: 'tell',
    aliases: ['ot'],
    audience: new PrivateAudience(),
    formatter: {
      sender: function (sender, target, message, colorify) {
        return colorify(`You OOCly tell ${target.name}, "${message}"`)
      },

      target: function (sender, target, message, colorify) {
        return colorify(`${sender.name} OOCly tells you, "${message}"`)
      }
    }
  }),

  // WHISPER (target in room)
  new Channel({
    name: 'whisper',
    audience: new WhisperAudience(),
    formatter: {
      sender: function (sender, target, message, colorify) {
        return colorify(`You whisper to ${target.name}, "${message}"`)
      },

      target: function (sender, target, message, colorify) {
        return colorify(`${sender.name} whispers to you, "${message}"`)
      }
    }
  }),

  // YELL (area)
  new Channel({
    name: 'yell',
    aliases: ['shout'],
    audience: new AreaAudience(),
    formatter: {
      sender: function (sender, target, message, colorify) {
        return colorify(`You yell, "${message}"`)
      },

      target: function (sender, target, message, colorify) {
        // check if the target is in the same room as the sender
        if (target.room.entityReference === sender.room.entityReference) {
          return colorify(`${sender.name} yells, "${message}"`)
        } else {
          return colorify(`Someone yells, "${message}"`)
        }
      }
    }
  }),

  // GTELL (room & party with communicator)
  new Channel({
    name: 'gtell',
    aliases: ['ptell'],
    audience: new PartyCommunicatorAudience(),
    formatter: {
      sender: function (sender, target, message, colorify) {
        const aud = new PartyCommunicatorAudience()
        const comm = aud.hasCommunicatorItem(sender)
        return colorify(`You say into your ${comm.name}, "${message}"`)
      },

      target: function (sender, target, message, colorify) {
        const aud = new PartyCommunicatorAudience()
        const comm = aud.hasCommunicatorItem(sender)
        if (sender.room === target.room) {
          return colorify(`${sender.name} echoes from your room and ${comm.name}, "${message}"`)
        } else {
          return colorify(`${sender.name} says through your ${comm.name}, "${message}"`)
        }
      }
    }
  }),

  // OOC (global)
  new Channel({
    name: 'ooc',
    aliases: ['chat', '.'],
    color: ['bold', 'yellow'],
    audience: new WorldAudience(),
    formatter: {
      sender: function (sender, target, message, colorify) {
        if (sender.role >= PlayerRoles.ADMIN) {
          return `<b><red>[OOC] Admin ${sender.name}: ${message}</red></b>`
        }
        if (sender.role >= PlayerRoles.BUILDER) {
          return `<b><cyan>[OOC] Builder ${sender.name}: ${message}</cyan></b>`
        }
        return colorify(`[OOC] ${sender.name}: ${message}`)
      },

      target: function (sender, target, message, colorify) {
        if (sender.name === 'SYSTEM') {
          return colorify(message)
        }
        if (sender.role >= PlayerRoles.ADMIN) {
          return `<b><red>[OOC] Admin ${sender.name}: ${message}</red></b>`
        }
        if (sender.role >= PlayerRoles.BUILDER) {
          return `<b><cyan>[OOC] Builder ${sender.name}: ${message}</cyan></b>`
        }
        return colorify(`[OOC] ${sender.name}: ${message}`)
      }
    }
  }),

  // ADMIN (global)
  new Channel({
    name: 'admin',
    color: ['bold', 'red'],
    minRequiredRole: PlayerRoles.ADMIN,
    audience: new RoleAudience({ minRole: PlayerRoles.ADMIN }),
    formatter: {
      sender: function (sender, target, message, colorify) {
        return colorify(`[ADMIN] ${sender.name}: ${message}`)
      },

      target: function (sender, target, message, colorify) {
        if (sender.name === 'SYSTEM') {
          return colorify(message)
        }
        return colorify(`[ADMIN] ${sender.name}: ${message}`)
      }
    }
  }),

  // BUILDER (global)
  new Channel({
    name: 'builder',
    color: ['bold', 'cyan'],
    minRequiredRole: PlayerRoles.BUILDER,
    audience: new RoleAudience({ minRole: PlayerRoles.BUILDER }),
    formatter: {
      sender: function (sender, target, message, colorify) {
        return colorify(`[BUILDER] ${sender.name}: ${message}`)
      },

      target: function (sender, target, message, colorify) {
        if (sender.name === 'SYSTEM') {
          return colorify(message)
        }
        return colorify(`[BUILDER] ${sender.name}: ${message}`)
      }
    }
  })
]
