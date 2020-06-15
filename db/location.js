const defaultServerSettings = require('../defaultServerSettings')
const memo = require('../scripts/memo')

const memoedLocationData = memo(3000)

module.exports = function (firestore) {
  return {
    async setLocation({ locationName, locationSettings }) {
      const sanitizedName = encodeURIComponent(locationName)
      const document = firestore.doc(`locations/${sanitizedName}`)
      await document.set(locationSettings)
      memoedLocationData.set(sanitizedName, locationSettings)
      console.log(`Added location ${locationName} to database`)
    },

    async getLocation(locationName) {
      const sanitizedName = encodeURIComponent(locationName)
      const memoed = memoedLocationData.get(sanitizedName)
      if (memoed) return memoed
      const document = firestore.doc(`locations/${sanitizedName}`)
      const data = (await document.get()).data()
      if (!data) return
      memoedLocationData.set(sanitizedName, data)
      return data
    },
  }
}
