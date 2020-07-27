const { Broadcast: B, PartyAudience, Room, ItemType } = require('ranvier')

/**
 * Audience representing other Players in the same group as the sender
 * Requires a communicator Item
 * Also echoes to Player's room
 * Example: 'gtell'
 *
 * @memberof ChannelAudience
 * @extends PartyAudience
 */
module.exports = class PartyCommunicatorAudience extends PartyAudience {
  getBroadcastTargets () {
    if (!this.sender.party) {
      return []
    }

    const witnesses = this.sender.room.getBroadcastTargets()
      .filter(target => !(target instanceof Room))

    if (witnesses.length && this.hasCommunicatorItem(this.sender)) {
      const commItem = this.hasCommunicatorItem(this.sender)
      for (const witness of witnesses) {
        // only announce witnessing gtell once
        if (!witness.getMeta(`$temp-gtell::${this.message}`) &&
            ((witness.party === this.sender.party && !this.hasCommunicatorItem(witness)) || witness.party !== this.sender.party)

        ) {
          B.sayAt(witness, `${this.sender.name} says into their ${commItem.name}, "${this.message}."`)
          witness.setMeta(`$temp-gtell::${this.message}`, true)
        } else {
          delete witness.metadata[`$temp-gtell::${this.message}`]
        }
      }
    }

    return this.sender.party.getBroadcastTargets()
      .filter(player => player !== this.sender)
      .filter(player => this.hasCommunicatorItem(player))
  }

  // helper function to find first matching communicator item owned by Player
  hasCommunicatorItem (player) {
    let comm = null
    for (const [, item] of player.inventory) {
      if (item.type === ItemType.COMMUNICATOR) {
        comm = item
        break
      }
    }
    for (const [, item] of player.equipment) {
      if (item.type === ItemType.COMMUNICATOR) {
        comm = item
        break
      }
    }
    if (comm) {
      return comm
    } else {
      return false
    }
  }
}
