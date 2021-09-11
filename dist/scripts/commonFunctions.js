"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuildMembers = exports.getUserInGuildFromId = exports.getAuthorDisplayName = exports.getLightEmoji = exports.dateObjectAt = exports.toTimeString = exports.currentTimeAt = exports.getLabelFromUser = exports.getContactsOrOwnerOrModerator = exports.getUserInGuildFromText = exports.getOffset = exports.standardizeTimezoneName = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const relativeTime_1 = __importDefault(require("dayjs/plugin/relativeTime"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(relativeTime_1.default);
const fuse = require(`fuse.js`);
const fuseOptions = {
    shouldSort: true,
    location: 0,
    threshold: 0.18,
    distance: 1000,
    maxPatternLength: 20,
    minMatchCharLength: 2,
    keys: [`searchString`],
};
function standardizeTimezoneName(name) {
    return name.replace(/(Standard |Daylight |Summer |Winter |Spring |Fall )/gi, ``);
}
exports.standardizeTimezoneName = standardizeTimezoneName;
function getOffset(locale) {
    if (!locale)
        return 0;
    let date;
    try {
        if (typeof locale === `object`)
            date = locale;
        else {
            locale = locale
                .replace(/ /g, `_`)
                .replace(/UTC/gi, `Etc/GMT`);
            date = (0, dayjs_1.default)().tz(locale);
        }
        return date.utcOffset() / 60;
    }
    catch (e) {
        console.log(e.message);
        return 0;
    }
}
exports.getOffset = getOffset;
// * looks like {query} param does some sort of fuzzy search?
async function getUserInGuildFromText(msg, searchText) {
    if (searchText.length < 2)
        return;
    const usersInGuild = await getGuildMembers({ msg });
    const usersInGuildWithSearchString = usersInGuild.map((user) => ({
        user,
        searchString: `${user.user.username} ${user.user.username}#${user.user.discriminator} ${user.nickname ? user.nickname : ``} <@!${user.id}> <@${user.id}>`,
    }));
    const fuzzySearch = new fuse(usersInGuildWithSearchString, fuseOptions);
    const fuzzySearchResult = fuzzySearch.search(searchText);
    if (fuzzySearchResult[0])
        return fuzzySearchResult[0].item
            .user;
}
exports.getUserInGuildFromText = getUserInGuildFromText;
async function getContactsOrOwnerOrModerator({ guild, }) {
    let usersToContact;
    // check guild.owner
    usersToContact = await getUserInGuildFromId(guild, guild.ownerId);
    if (usersToContact)
        return [usersToContact];
    // at this point, we just look for an admin of any kind
    usersToContact = (await getGuildMembers({ guild })).filter((member) => member.permissions.has(`ADMINISTRATOR`));
    if (usersToContact && usersToContact.length > 0)
        return usersToContact;
    return [];
}
exports.getContactsOrOwnerOrModerator = getContactsOrOwnerOrModerator;
function getLabelFromUser(user) {
    if (!user)
        return;
    const nickname = `nickname` in user ? user.nickname : false;
    const username = `username` in user ? user.username : user.user.username;
    const discriminator = `discriminator` in user
        ? user.discriminator
        : user.user.discriminator;
    return `${nickname ? nickname + ` (` : ``}${username}#${discriminator}${nickname ? `)` : ``}`;
}
exports.getLabelFromUser = getLabelFromUser;
function currentTimeAt(location, leadingZero = false, format24) {
    var _a;
    location = location.replace(`UTC`, `Etc/GMT`);
    const utcOffset = location.toLowerCase().indexOf(`gmt`) === 0 ||
        location.toLowerCase().indexOf(`etc/gmt`) === 0
        ? (_a = /.*([+-].*)/gi.exec(location)) === null || _a === void 0 ? void 0 : _a[1]
        : undefined;
    let dayObject = (0, dayjs_1.default)();
    if (utcOffset !== undefined)
        dayObject = dayObject.utcOffset(parseFloat(utcOffset));
    else
        dayObject = dayObject.tz(location);
    const localeString = dayObject.format(format24
        ? `HH:mm on dddd, MMMM D`
        : `hh:mm A on dddd, MMMM D`);
    if (leadingZero)
        return localeString;
    const twoDigitHourRegex = /[0-9]{2}:/;
    return localeString.replace(twoDigitHourRegex, (match) => {
        if (match && match.substring(0, 1) === `0`)
            return match.substring(1);
        return match;
    });
}
exports.currentTimeAt = currentTimeAt;
function toTimeString(dayObject, leadingZero, format24) {
    let formatString = `ddd `;
    if (format24)
        formatString += `H`;
    else
        formatString += `h`;
    if (leadingZero) {
        if (format24)
            formatString += `H`;
        else
            formatString += `h`;
    }
    formatString += `:mm`;
    if (!format24)
        formatString += ` A`;
    return dayObject.format(formatString);
}
exports.toTimeString = toTimeString;
function dateObjectAt(location) {
    var _a;
    const utcOffset = location.toLowerCase().indexOf(`utc`) === 0 ||
        location.toLowerCase().indexOf(`gmt`) === 0 ||
        location.toLowerCase().indexOf(`etc/gmt`) === 0
        ? (_a = /.*([+-].*)/gi.exec(location)) === null || _a === void 0 ? void 0 : _a[1]
        : undefined;
    let dayObject = (0, dayjs_1.default)();
    if (utcOffset !== undefined)
        dayObject = dayObject.utcOffset(parseFloat(utcOffset));
    else
        dayObject = dayObject.tz(location);
    return dayObject;
}
exports.dateObjectAt = dateObjectAt;
function getLightEmoji(location) {
    var _a;
    let hour;
    if (typeof location === `number`)
        hour = location;
    else {
        try {
            const utcOffset = location.toLowerCase().indexOf(`utc`) === 0 ||
                location.toLowerCase().indexOf(`gmt`) === 0 ||
                location.toLowerCase().indexOf(`etc/gmt`) === 0
                ? (_a = /.*([+-].*)/gi.exec(location)) === null || _a === void 0 ? void 0 : _a[1]
                : undefined;
            let dayObject = (0, dayjs_1.default)();
            if (utcOffset !== undefined)
                dayObject = dayObject.utcOffset(parseFloat(utcOffset));
            else
                dayObject = dayObject.tz(location);
            hour = dayObject.hour();
        }
        catch (e) {
            console.log(`failed to get light emoji for`, location, e.message);
            return ``;
        }
    }
    if (hour <= 5)
        return `🌙`;
    // if (hour <= 7) return '🌇'
    if (hour <= 18)
        return `☀️`;
    // if (hour <= 19) return '🌅'
    return `🌙`;
}
exports.getLightEmoji = getLightEmoji;
async function getAuthorDisplayName(msg) {
    var _a, _b;
    const isGuild = msg.guild !== undefined;
    return isGuild
        ? ((_b = (await ((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.members.fetch(msg.author.id)))) === null || _b === void 0 ? void 0 : _b.nickname) || msg.author.username
        : msg.author.username;
}
exports.getAuthorDisplayName = getAuthorDisplayName;
async function getUserInGuildFromId(guild, id) {
    if (!guild || !id)
        return;
    try {
        const userInGuild = await guild.members.fetch({
            user: id,
        });
        return userInGuild;
    }
    catch (e) { }
}
exports.getUserInGuildFromId = getUserInGuildFromId;
async function getGuildMembers({ msg, guild, ids, }) {
    if (msg && msg.guild)
        guild = msg.guild;
    if (!guild)
        return [];
    let members = [];
    if (!ids) {
        // just get everything
        try {
            members = [
                ...(await guild.members.fetch().catch((e) => {
                    console.log(e);
                    return [];
                })).values(),
            ];
        }
        catch (e) {
            members = [...(await guild.members.fetch()).values()];
            console.log(`failed to get ${members.length} guild members`);
        }
    }
    // get specific ids
    else {
        try {
            members = [
                ...(await guild.members
                    .fetch({ user: ids })
                    .catch((e) => {
                    console.log(e);
                    return [];
                })).values(),
            ];
        }
        catch (e) {
            console.log(`failed to get ${members.length} guild members`);
        }
    }
    return members;
}
exports.getGuildMembers = getGuildMembers;
