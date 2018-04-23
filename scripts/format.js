module.exports = {
  timezones (timezoneData) {
    const longest = timezoneData
      .reduce((longestLabel, t) => {
        return t.abbr.length + t.timezone.length > longestLabel
          ? t.abbr.length + t.timezone.length : longestLabel
      }, 0) + 1
    return timezoneData.map(t => {
      let paddedTimezone = t.timezone + ':'
      while (t.abbr.length + paddedTimezone.length < longest)
        paddedTimezone += ' '
      return `(${t.abbr}) ${paddedTimezone} ${this.currentTimeAt(t.location)}`
    })
  },

  currentTimeAt (timezoneLocationString, leadingZero = true) {
    const localeString = new Date().toLocaleTimeString(undefined, {
      timeZone: timezoneLocationString,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      console.log(timezoneLocationString, localeString)
    if (!leadingZero) return localeString
    const singleDigitHourRegex = / ([0-9]{1}):[0-9]+/
    return localeString.replace(singleDigitHourRegex, match => {
        if (match) return ' 0' + match.trim()
    })
  },

}
