interface LocationData {
  location: string
  timezoneName: string
}
interface LocationDataWithUtc extends LocationData {
  utcOffset: string
}

interface UserData {
  location: string
  timezoneName: string
}
