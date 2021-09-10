import axios from 'axios'
import db from '../db/firestore'
import { standardizeTimezoneName } from '../scripts/commonFunctions'
import timezoneCodeToLocation from '../scripts/timezoneCodeToLocationData'

const geocodeUrlBase = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}`
const timezoneUrlBase = `https://maps.googleapis.com/maps/api/timezone/json?key=${process.env.GOOGLE_API_KEY}`

export default function (
  location: string,
): Promise<LocationData | null | LocationDataWithUtc> {
  return new Promise(async (resolve, reject) => {
    if (!location) {
      resolve(null)
      return
    }

    location = location
      .replace(/[<>\[\]()]/gi, ``) //eslint-disable-line
      .replace(/[_　]+/gi, ` `) //eslint-disable-line
      .replace(/[@!?\d]*/gi, ``)

    const timezoneCodeLocationData =
      timezoneCodeToLocation(location)
    if (timezoneCodeLocationData) {
      resolve(timezoneCodeLocationData)
      return
    }

    const savedData = await db.getLocation(location)
    if (savedData) {
      resolve(savedData)
      return
    }
    try {
      console.log(`Making new API request for ${location}`)
      const foundLatLon = await axios
        .get(`${geocodeUrlBase}&address=${location}`)
        .then((res) =>
          res.data.results
            ? res.data.results[0].geometry.location
            : null,
        )
        .catch((e) => console.log)
      if (!foundLatLon) {
        resolve(null)
        return
      }
      const foundTimezone = await axios
        .get(
          `${timezoneUrlBase}&location=${foundLatLon.lat},${
            foundLatLon.lng
          }&timestamp=${Date.now() / 1000}`,
        )
        .then((res) => res.data)
        .catch((e) => console.log)
      if (foundTimezone.status === `OK`) {
        const result = {
          timezoneName: standardizeTimezoneName(
            foundTimezone.timeZoneName,
          ),
          location: foundTimezone.timeZoneId,
        }
        db.setLocation({
          locationName: location,
          locationSettings: result,
        })
        resolve(result)
        return
      }
      resolve(null)
    } catch (e) {
      resolve(null)
      console.log(`Google API get error:`, e)
    }
  })
}
