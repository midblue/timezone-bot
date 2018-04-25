const fs = require('fs')
const savedUsers = require('../data/users.json') || {}
console.log(`Loaded ${Object.keys(savedUsers).length} saved users`)

module.exports = {
  get (id) { return savedUsers[id] },
  getAll () { return savedUsers },
  timezonesIn (serverOrChannelObject) {
    let relevantTimezones = []
    const userIdsInCurrentServer = serverOrChannelObject.recipient
      ? [serverOrChannelObject.recipient.id]
      : serverOrChannelObject.members.keyArray()
    Object.keys(savedUsers)
      .map(k => {
        if (
          userIdsInCurrentServer.find(i => i === k)
          && !relevantTimezones.find(z => z.timezoneName === savedUsers[k].timezoneName)
        ) {
          relevantTimezones.push(savedUsers[k])
        }
      })
    return relevantTimezones.sort((a, b) => a.offset > b.offset)
  },

  update (id, settings) {
    savedUsers[id] = savedUsers[id] || {}
    for (let prop in settings)
      savedUsers[id][prop] = settings[prop]
    savedUsers[id].lastSeen = new Date()
    fs.writeFile("./data/users.json", JSON.stringify(savedUsers), 'utf8', e => {
      if (e) return console.log(e)
    })
    // console.log('Updated user', id)
    return savedUsers[id]
  },

  lastSeen (id) {
    return savedUsers[id] ? savedUsers[id].lastSeen : undefined
  }

}
