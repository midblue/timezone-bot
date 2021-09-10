"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const firestore_1 = __importDefault(require("../db/firestore"));
const commonFunctions_1 = require("../scripts/commonFunctions");
const timezoneCodeToLocationData_1 = __importDefault(require("../scripts/timezoneCodeToLocationData"));
const geocodeUrlBase = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}`;
const timezoneUrlBase = `https://maps.googleapis.com/maps/api/timezone/json?key=${process.env.GOOGLE_API_KEY}`;
function default_1(location) {
    return new Promise(async (resolve, reject) => {
        if (!location) {
            resolve(null);
            return;
        }
        location = location
            .replace(/[<>\[\]()]/gi, ``) //eslint-disable-line
            .replace(/[_　]+/gi, ` `) //eslint-disable-line
            .replace(/[@!?\d]*/gi, ``);
        const timezoneCodeLocationData = (0, timezoneCodeToLocationData_1.default)(location);
        if (timezoneCodeLocationData) {
            resolve(timezoneCodeLocationData);
            return;
        }
        const savedData = await firestore_1.default.getLocation(location);
        if (savedData) {
            resolve(savedData);
            return;
        }
        try {
            console.log(`Making new API request for ${location}`);
            const foundLatLon = await axios_1.default
                .get(`${geocodeUrlBase}&address=${location}`)
                .then((res) => res.data.results
                ? res.data.results[0].geometry.location
                : null)
                .catch((e) => console.log);
            if (!foundLatLon) {
                resolve(null);
                return;
            }
            const foundTimezone = await axios_1.default
                .get(`${timezoneUrlBase}&location=${foundLatLon.lat},${foundLatLon.lng}&timestamp=${Date.now() / 1000}`)
                .then((res) => res.data)
                .catch((e) => console.log);
            if (foundTimezone.status === `OK`) {
                const result = {
                    timezoneName: (0, commonFunctions_1.standardizeTimezoneName)(foundTimezone.timeZoneName),
                    location: foundTimezone.timeZoneId,
                };
                firestore_1.default.setLocation({
                    locationName: location,
                    locationSettings: result,
                });
                resolve(result);
                return;
            }
            resolve(null);
        }
        catch (e) {
            resolve(null);
            console.log(`Google API get error:`, e);
        }
    });
}
exports.default = default_1;
