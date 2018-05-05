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

}
