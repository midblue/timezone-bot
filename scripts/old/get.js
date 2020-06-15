const fuse = require('fuse.js')
const fuseOptions = {
  shouldSort: true,
  location: 0,
  threshold: 0.45,
  distance: 60,
  maxPatternLength: 20,
  minMatchCharLength: 2,
  keys: ['username'],
}

module.exports = {
  ats(messageText) {
    let atsInMessage = []
    const atRegex = /\<\@\!?(\d*)\>*/g
    let regexedAts = atRegex.exec(messageText)
    while (regexedAts) {
      atsInMessage.push(regexedAts[1])
      regexedAts = atRegex.exec(messageText)
    }
    return atsInMessage
  },

  usernameInMessage(searchString, users) {
    const fuzzySearch = new fuse(users, fuseOptions)
    const result = fuzzySearch.search(searchString)
    if (result[0]) return result[0].username
  },
}
