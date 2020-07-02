const { Broadcast: B, ItemType } = require('ranvier')
const ArgParser = require('./../../../lib/ArgParser')
const { CommandParser } = require('./../../../lib/CommandParser')

/**
 * Open a container Item or door
 * Handles 'close', 'lock', and 'unlock' commands
 */
module.exports = {
  usage: 'open [door] <door/direction/item>',

  command: state => (args, player, arg0) => {
    // if no argument provided, reject command
    if (!args) {
      return B.sayAt(player, `${B.capitalize(arg0)} what?`)
    }

    // filter 'door' from arguments
    // (e.g., 'open door north' becomes 'open north')
    const parts = args.split(' ').filter(arg => !arg.match(/\bdoor\b/i))

    const exitDirection = parts[0]
    const roomExit = CommandParser.canGo(player, exitDirection)

    // if target is an exit, check for door
    if (roomExit) {
      const roomExitRoom = state.RoomManager.getRoom(roomExit.roomId)
      const exit = roomExit.direction
      let doorRoom = player.room
      let targetRoom = roomExitRoom
      let door = doorRoom.getDoor(targetRoom)

      // if door not found in current room, check other side
      if (!door) {
        doorRoom = roomExitRoom
        targetRoom = player.room
        door = doorRoom.getDoor(targetRoom)
      }

      // if door exists, handle
      if (door) {
        return handleDoor(player, doorRoom, targetRoom, door, exit, arg0, state)
      }
    }

    // otherwise, assume player is targeting an item
    const item = ArgParser.parseDot(args, [...player.room.items].reverse()) ||
                 ArgParser.parseDot(args, [...player.inventory].reverse()) ||
                 ArgParser.parseDot(args, player.equipment)

    // if matching item found, handle
    if (item) {
      return handleItem(player, item, arg0, state)
    }

    // reject command if no target found
    return B.sayAt(player, B.capitalize(`${arg0} what?`))
  }
}

// helper function for opening, closing, locking, and unlocking a door
function handleDoor (player, doorRoom, targetRoom, door, exit, arg0, state) {
  // determine if player has door key
  const playerKey = player.hasItem(door.lockedBy)

  switch (arg0) {
    // if player is trying to open the door
    case 'open': {
      if (door.locked) {
        if (playerKey) {
          state.CommandManager.get('open').execute(exit, player, 'unlock')
          B.sayAt(player, `You open the ${exit} exit.`)
          B.sayAtExcept(player.room, `${player.name} opens the ${exit} exit.`, [player])
          doorRoom.unlockDoor(targetRoom)
          if (targetRoom !== player.room) {
            B.sayAtExcept(targetRoom, `Someone opens the ${exit} exit from the other side.`, [player])
          }
          if (doorRoom !== player.room) {
            B.sayAtExcept(doorRoom, `Someone opens the ${exit} exit from the other side.`, [player])
          }
          return doorRoom.openDoor(targetRoom)
        }
        B.sayAtExcept(player.room, `${player.name} tries to open the ${exit} exit in vain.`, [player])
        return B.sayAt(player, `You try to open the ${exit} exit in vain.`)
      }
      if (door.closed) {
        B.sayAt(player, `You open the ${exit} exit.`)
        B.sayAtExcept(player.room, `${player.name} opens the ${exit} exit.`, [player])
        if (targetRoom !== player.room) {
          B.sayAtExcept(targetRoom, `Someone opens the ${exit} exit from the other side.`, [player])
        }
        if (doorRoom !== player.room) {
          B.sayAtExcept(doorRoom, `Someone opens the ${exit} exit from the other side.`, [player])
        }
        return doorRoom.openDoor(targetRoom)
      } else {
        return B.sayAt(player, `The ${exit} exit is not closed.`)
      }
    }
    // if player is trying to close the door
    case 'close': {
      if (door.locked || door.closed) {
        return B.sayAt(player, `The ${exit} exit is already closed.`)
      }
      B.sayAt(player, `You close the ${exit} exit.`)
      B.sayAtExcept(player.room, `${player.name} closes the ${exit} exit.`, [player])
      if (targetRoom !== player.room) {
        B.sayAtExcept(targetRoom, `Someone closes the ${exit} exit from the other side.`, [player])
      }
      if (doorRoom !== player.room) {
        B.sayAtExcept(doorRoom, `Someone closes the ${exit} exit from the other side.`, [player])
      }
      return doorRoom.closeDoor(targetRoom)
    }
    // if player is trying to lock the door
    case 'lock': {
      if (door.locked) {
        return B.sayAt(player, `The ${exit} exit is already locked.`)
      }
      if (!playerKey) {
        return B.sayAt(player, `You don't have the key to lock the ${exit} exit.`)
      }
      if (!door.closed) {
        state.CommandManager.get('open').execute(exit, player, 'close')
      }
      B.sayAt(player, `You lock the ${exit} exit with ${playerKey.name}.`)
      B.sayAtExcept(player.room, `${player.name} locks the ${exit} exit with ${playerKey.name}.`, [player])
      if (targetRoom !== player.room) {
        B.sayAtExcept(targetRoom, `Someone locks the ${exit} exit from the other side.`, [player])
      }
      if (doorRoom !== player.room) {
        B.sayAtExcept(doorRoom, `Someone locks the ${exit} exit from the other side.`, [player])
      }
      return doorRoom.lockDoor(targetRoom)
    }
    // if player is trying to unlock the door
    case 'unlock': {
      if (door.locked) {
        if (!playerKey) {
          return B.sayAt(player, `You don't have the key to unlock the ${exit} exit.`)
        } else {
          B.sayAt(player, `You unlock the ${exit} exit with ${playerKey.name}.`)
          B.sayAtExcept(player.room, `${player.name} unlocks the ${exit} exit with ${playerKey.name}.`, [player])
          if (targetRoom !== player.room) {
            B.sayAtExcept(targetRoom, `Someone unlocks the ${exit} exit from the other side.`, [player])
          }
          if (doorRoom !== player.room) {
            B.sayAtExcept(doorRoom, `Someone unlocks the ${exit} exit from the other side.`, [player])
          }
          return doorRoom.unlockDoor(targetRoom)
        }
      }
      if (door.closed) {
        return B.sayAt(player, `The ${exit} exit is already unlocked.`)
      } else {
        return B.sayAt(player, `The ${exit} exit is already open.`)
      }
    }
  }
}

// helper function for opening, closing, locking, and unlocking an item
function handleItem (player, item, arg0, state) {
  // determine if player has door key
  const playerKey = player.hasItem(item.lockedBy)

  if (item.type === ItemType.CONTAINER) {
    switch (arg0) {
      // if player is trying to open the item
      case 'open': {
        if (item.locked) {
          if (item.lockedBy) {
            if (playerKey) {
              state.CommandManager.get('open').execute(item.name, player, 'unlock')
              B.sayAt(player, `You open ${item.name}.`)
              B.sayAtExcept(player.room, `${player.name} opens ${item.name}.`, [player])
              item.unlock()
              item.open()
              return
            }
          }
          B.sayAtExcept(player.room, `${player.name} tries to open ${item.name} in vain.`, [player])
          return B.sayAt(player, `You try to open ${item.name} in vain.`)
        }
        if (item.closed) {
          B.sayAt(player, `You open ${item.name}.`)
          B.sayAtExcept(player.room, `${player.name} opens ${item.name}.`, [player])
          return item.open()
        }
        return B.sayAt(player, `${B.capitalize(item.name)} isn't closed.`)
      }
      // if player is trying to close the item
      case 'close': {
        if (item.locked || item.closed) {
          return B.sayAt(player, `${B.capitalize(item.name)} is already closed.`)
        } if (item.closeable) {
          B.sayAt(player, `You close ${item.name}.`)
          B.sayAtExcept(player.room, `${player.name} closes the ${item.name}.`, [player])
          return item.close()
        } else {
          B.sayAt(player, `You can't close ${item.name}.`)
        }
        break
      }
      // if player is trying to lock the item
      case 'lock': {
        if (item.locked) {
          return B.sayAt(player, `${B.capitalize(item.name)} is already locked.`)
        }
        if (!playerKey) {
          return B.sayAt(player, `You don't have the key to lock ${item.name}.`)
        }
        if (!item.closed) {
          state.CommandManager.get('open').execute(item.name, player, 'close')
        }
        B.sayAt(player, `You lock ${item.name} with ${playerKey.name}.`)
        B.sayAtExcept(player.room, `${player.name} locks ${item.name} with ${playerKey.name}.`, [player])
        return item.lock()
      }
      // if player is trying to unlock the item
      case 'unlock': {
        if (item.locked) {
          if (!playerKey) {
            return B.sayAt(player, `You don't have the key to unlock ${item.name}.`)
          } else {
            B.sayAt(player, `You unlock ${item.name} with ${playerKey.name}.`)
            B.sayAtExcept(player.room, `${player.name} unlocks ${item.name} with ${playerKey.name}.`, [player])
            return item.unlock()
          }
        }
        if (item.closed) {
          return B.sayAt(player, `${B.capitalize(item.name)} is already unlocked.`)
        } else {
          return B.sayAt(player, `${B.capitalize(item.name)} is already open.`)
        }
      }
    }
  } else {
    return B.sayAt(player, `You can't ${arg0} ${item.name}.`)
  }
}
