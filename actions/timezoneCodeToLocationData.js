const timezoneCodes = require('../scripts/timezoneCodes')

module.exports = (location) => {
  if (!location) return

  location = location
    .replace(/[<>\[\]()]/gi, '')
    .replace(/[_　]/gi, ' ')
    .replace(/@!?\d* */gi, '')

  // check for UTC command
  const UTCMatch = /^(?:utc|gmt) ?(\+|-)? ?(\d*)/gi.exec(
    location,
  )
  if (UTCMatch) {
    // todo fix "UTC8" bug
    const offset = UTCMatch[2]
      ? parseInt(UTCMatch[2]) *
        (UTCMatch[1] === '-' ? -1 : 1)
      : 0
    if (offset > 14 || offset < -12) return

    const offsetInverted = offset * -1
    const locationData = {
      timezoneName: `UTC${
        offset < 0 ? offset : '+' + offset
      }`,
      location: `Etc/GMT${
        offsetInverted < 0
          ? offsetInverted
          : '+' + offsetInverted
      }`,
    }
    return locationData
  }

  // check for literal timezone code
  const timezoneCodeName = location
    .replace(/\s*/g, '')
    .toUpperCase()
  const foundTimezoneCode = timezoneCodes[timezoneCodeName]
  if (foundTimezoneCode !== undefined) {
    const locationData = {
      timezoneName: timezoneCodeName,
      location: `Etc/GMT${
        foundTimezoneCode >= 0 ? '+' : ''
      }${foundTimezoneCode}`
        .replace('+', '.')
        .replace('-', '+')
        .replace('.', '-'), // swap + and -,
    }
    return locationData
  }
}
