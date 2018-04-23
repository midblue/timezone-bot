const timezones = require('../timezones.json')

module.exports = {
  ats (messageText) {
    let atsInMessage = []
    const atRegex = /\<\@\!?(\d*)\>*/g
    let regexedAts = atRegex.exec(messageText)
    while (regexedAts) {
      atsInMessage.push(regexedAts[1])
      regexedAts = atRegex.exec(messageText)
    }
    return atsInMessage
  },

  timezoneCommands (messageText) {
    let timezonesInMessage = []
    const lowerCaseMessage = messageText.toLowerCase()
    const timezoneRegex = /!([a-z]{2,5})/g
    let regexedTimezone = timezoneRegex.exec(lowerCaseMessage)
    while (regexedTimezone) {
      const foundTimezone = timezones
        .find(t => t.abbr.toLowerCase() === regexedTimezone[1])
      if (foundTimezone)
        timezonesInMessage.push(foundTimezone)
      regexedTimezone = timezoneRegex.exec(lowerCaseMessage)
    }
    return timezonesInMessage
  },

}
