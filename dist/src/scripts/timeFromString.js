"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const timezoneCodeToLocation = require(`./timezoneCodeToLocationData`);
const { getUserInGuildFromText, } = require(`./commonFunctions`);
const getTimezoneFromLocation_1 = __importDefault(require("../actions/getTimezoneFromLocation"));
const dayjs_1 = __importDefault(require("dayjs"));
const relativeTime_1 = __importDefault(require("dayjs/plugin/relativeTime"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(relativeTime_1.default);
async function default_1(timeString = ``, msg) {
    var _a;
    let dayOfWeekRegexRes = /^(?:mon|tues?|wedn?e?s?|thur?s?|fri|satu?r?|sun)d?a?y?/gi.exec(timeString.toLowerCase());
    let dayOfWeek = null;
    if (dayOfWeekRegexRes) {
        const stringDayOfWeek = dayOfWeekRegexRes[0];
        timeString = timeString.substring(stringDayOfWeek.length + 1);
        dayOfWeek = [
            `sun`,
            `mon`,
            `tue`,
            `wed`,
            `thu`,
            `fri`,
            `sat`,
        ].findIndex((d) => stringDayOfWeek.substring(0, 3) === d);
    }
    let tsMatch = /(\d{1,2}|now)?:?(\d{2})?\s*?(pm|am)?\s?(.*)?$/gi.exec(timeString.toLowerCase());
    let [unused, hoursString, minutesString, pmAm, userOrLocation,] = tsMatch || [];
    if (!userOrLocation && msg)
        userOrLocation = msg.author.username;
    if (!userOrLocation)
        return { error: `no user/location` };
    let now = false;
    if (!hoursString || hoursString === `now`)
        now = true;
    let hours, minutes;
    if (!now) {
        if (!minutesString)
            minutesString = `00`;
        minutes = parseInt(minutesString) || 0;
        if (minutes > 59)
            minutes = 59;
        if (minutes < 0)
            minutes = 0;
        if (minutes <= 9)
            minutes = `0${minutes}`;
        hours = parseInt(hoursString || `-1`);
        if (pmAm === `am` && hours === 12)
            hours = 0;
        if (pmAm === `pm` && hours < 12)
            hours += 12; // since 12pm is already correct
        if (hours > 24 || hours < 0)
            return { error: `invalid time` };
    }
    let knownTimezoneDataForEnteredUserOrLocation, username = false;
    // * first, check for a timezone code
    const timezoneCodeLocationData = timezoneCodeToLocation(userOrLocation);
    if (timezoneCodeLocationData) {
        knownTimezoneDataForEnteredUserOrLocation =
            timezoneCodeLocationData;
    }
    let targetUser;
    if (!timezoneCodeLocationData && msg) {
        // * if it wasn't a timezone code, check for a username
        targetUser = await getUserInGuildFromText(msg, userOrLocation);
    }
    // * if it was a username, use their data
    if (targetUser && msg) {
        username =
            targetUser.nickname || targetUser.user.username;
        knownTimezoneDataForEnteredUserOrLocation =
            await firestore_1.default.getUserInGuildFromId({
                guildId: ((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id) || ``,
                userId: targetUser.user.id,
            });
        if (!knownTimezoneDataForEnteredUserOrLocation)
            return { error: `no timezone set`, username };
    }
    // * fallback to check for a typed location name
    else {
        knownTimezoneDataForEnteredUserOrLocation =
            await (0, getTimezoneFromLocation_1.default)(userOrLocation);
        if (!knownTimezoneDataForEnteredUserOrLocation)
            return {
                error: `unrecognized location`,
                locationName: userOrLocation,
            };
    }
    let enteredDateAsObject = (0, dayjs_1.default)();
    enteredDateAsObject =
        knownTimezoneDataForEnteredUserOrLocation.utcOffset !==
            undefined
            ? enteredDateAsObject.utcOffset(knownTimezoneDataForEnteredUserOrLocation.utcOffset)
            : enteredDateAsObject.tz(knownTimezoneDataForEnteredUserOrLocation.location);
    if (!now) {
        enteredDateAsObject = enteredDateAsObject
            .minute(parseInt(minutes ? `${minutes}` : `0`))
            .hour(parseInt(hours ? `${hours}` : `0`));
        if (dayOfWeek !== null)
            enteredDateAsObject =
                enteredDateAsObject.day(dayOfWeek);
    }
    return {
        username,
        enteredDateAsObject,
        now,
        locationName: userOrLocation,
        knownTimezoneDataForEnteredUserOrLocation,
    };
}
exports.default = default_1;
