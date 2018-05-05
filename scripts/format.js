module.exports = {
  timezone (timezoneData) {
    return `${timezoneData.timezoneName + ':'} ${this.currentTimeAt(timezoneData.location)}`
  },

  currentTimeAt (location, leadingZero = false) {
    const localeString = new Date().toLocaleTimeString(undefined, {
      timeZone: location,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    if (!leadingZero) return localeString
    const singleDigitHourRegex = / ([0-9]{1}):[0-9]+/
    return localeString.replace(singleDigitHourRegex, match => {
        if (match) return ' 0' + match.trim()
    })
  },

  usersByTimezone (users) {
    const timezoneGroupings = users
      .filter(u => u.timezoneName)
      .sort((a, b) => a.offset > b.offset)
      .reduce((acc, user) => {
        const { timezoneName, location, offset } = user
        if (!acc[timezoneName]) {
          acc[timezoneName] = {
            locale: location,
            label: `${timezoneName} (UTC ${offset >= 0 ? '+' : ''}${offset})`,
            usernames: []
          }
        }
        acc[timezoneName].usernames.push(user.username)
        return acc
      }, {})

    return Object.values(timezoneGroupings)
      .reduce((acc, timezone) => {
        const header = `${this.currentTimeAt(timezone.locale, true)} - ${timezone.label}`
        const body = '\n  ' + timezone.usernames.join('\n  ') + '\n\n'
        return acc + header + body
      }, '')
  }

}
