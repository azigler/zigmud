const { Broadcast: B, PrivateAudience, Room } = require('ranvier')

/**
 * Audience representing whispering to a targeted Player in the same Room
 * Example: 'whisper'
 *
 * @memberof ChannelAudience
 * @extends PrivateAudience
 */
module.exports = class WhisperAudience extends PrivateAudience {
  getBroadcastTargets () {
    const targetPlayerName = this.message.split(' ')[0]
    const targetPlayer = this.state.PlayerManager.getPlayer(targetPlayerName)

    // return token '_self' if player targeted themselves
    if ((targetPlayer === this.sender) || (targetPlayerName === 'me') || (targetPlayerName === 'self')) {
      return ['_self']
    }

    if (targetPlayer !== this.sender) {
      if (targetPlayer && targetPlayer.room.entityReference === this.sender.room.entityReference) {
        const witnesses = this.sender.room.getBroadcastTargets()
          .filter(target => target !== this.sender)
          .filter(target => target !== targetPlayer)
          .filter(target => !(target instanceof Room))

        if (witnesses.length) {
          for (const witness of witnesses) {
            // only announce witnessing whisper once
            if (!witness.getMeta(`$temp-whisper::${targetPlayerName}::${this.message}`)) {
              B.sayAt(witness, `${this.sender.name} whispers something to ${targetPlayer.name}.`)
              witness.setMeta(`$temp-whisper::${targetPlayerName}::${this.message}`, true)
            } else {
              delete witness.metadata[`$temp-whisper::${targetPlayerName}::${this.message}`]
            }
          }
        }
        return [targetPlayer]
      }
    } else {
      return []
    }
  }

  alterMessage (message) {
    // strip target name from message
    return message.split(' ').slice(1).join(' ')
  }
}
