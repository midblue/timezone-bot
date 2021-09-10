import memo from '../scripts/memo'
import admin from 'firebase-admin'

const memoedLocationData = memo(1500)

let firestore = admin.firestore()

export default {
  async setLocation({
    locationName,
    locationSettings,
  }: {
    locationName: string
    locationSettings: LocationData
  }) {
    const sanitizedName = encodeURIComponent(
      locationName.toLowerCase(),
    )
    const document = firestore.doc(
      `locations/${sanitizedName}`,
    )
    await document.set(locationSettings)
    memoedLocationData.set(sanitizedName, locationSettings)
    console.log(
      `Added location ${locationName} to database (${JSON.stringify(
        locationSettings,
      )})`,
    )
  },

  async getLocation(
    locationName: string,
  ): Promise<LocationData | undefined> {
    const sanitizedName = encodeURIComponent(
      locationName.toLowerCase(),
    )
    const memoed = memoedLocationData.get(sanitizedName)
    if (memoed) return memoed
    const document = firestore.doc(
      `locations/${sanitizedName}`,
    )
    const data = (
      await document.get()
    ).data() as LocationData
    if (!data) return
    memoedLocationData.set(sanitizedName, data)
    return data
  },
}
