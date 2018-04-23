const fs = require('fs')
const savedUsers = require('../data/users.json') || {}
console.log(`Loaded ${Object.keys(savedUsers).length} saved users`)

module.exports = {
  timezonesIn (serverOrChannelObject) {
    let relevantTimezones = []
    const userIdsInCurrentServer = serverOrChannelObject.recipient
      ? [serverOrChannelObject.recipient.id]
      : serverOrChannelObject.members.keyArray()
    Object.keys(savedUsers)
      .map(k => {
        if (
          userIdsInCurrentServer.find(i => i === k)
          && !relevantTimezones.find(z => z.value === savedUsers[k].value)
        ) {
          relevantTimezones.push(savedUsers[k])
        }
      })
    return relevantTimezones.sort((a, b) => a.offset > b.offset)
  },

  update (settings) {
    savedUsers[settings.id] = settings.timezone
    fs.writeFile("./data/users.json", JSON.stringify(savedUsers), 'utf8', e => {
      if (e) return console.log(e)
    })
  },

}
