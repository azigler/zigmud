'use strict'

const { Broadcast: B } = require('ranvier')

module.exports = {
  listeners: {
    /**
     * Handle a player movement command. From: 'commands' input event.
     * movementCommand is a result of CommandParser.parse
     */
    move: state => function (movementCommand) {
      const { roomExit } = movementCommand

      if (!roomExit) {
        return B.sayAt(this, "You can't go that way!")
      }

      const nextRoom = state.RoomManager.getRoom(roomExit.roomId)
      const oldRoom = this.room

      const door = oldRoom.getDoor(nextRoom) || nextRoom.getDoor(oldRoom)

      if (door) {
        if (door.locked) {
          return B.sayAt(this, 'The door is locked.')
        }

        if (door.closed) {
          return B.sayAt(this, 'The door is closed.')
        }
      }

      this.moveTo(nextRoom, _ => {
        state.CommandManager.get('look').execute('', this)
      })

      B.sayAt(oldRoom, `${this.name} leaves.`)
      B.sayAtExcept(nextRoom, `${this.name} enters.`, this)
    },

    save: state => async function (callback) {
      await state.PlayerManager.save(this)
      if (typeof callback === 'function') {
        callback()
      }
    },

    commandQueued: state => function (commandIndex) {
      const command = this.commandQueue.queue[commandIndex]
      const ttr = this.commandQueue.getTimeTilRun(commandIndex)
      B.sayAt(this, `<bold><yellow>Executing</yellow> '<white>${command.label}</white>' <yellow>in</yellow> <white>${ttr}</white> seconds.`)
    },

    updateTick: state => function () {
      if (this.commandQueue.hasPending && this.commandQueue.lagRemaining <= 0) {
        B.sayAt(this)
        this.commandQueue.execute()
        B.prompt(this)
      }
    }
  }
}
