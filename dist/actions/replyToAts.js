"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const commonFunctions_1 = require("../scripts/commonFunctions");
const replyInChannel_1 = require("./replyInChannel");
const onlyRespondIfNotAnnouncedInMs = 30 * 60 * 1000;
const onlyRespondIfTimezoneOffsetDifferenceIsGreaterThanOrEqualTo = 1.5;
let recentlyAnnounced = [];
module.exports = async (msg, settings) => {
    var _a, _b, _c;
    if (msg.author.bot)
        return;
    const mentionedUserIds = ((_a = msg.mentions.members) === null || _a === void 0 ? void 0 : _a.map((m) => m.id)) || [];
    if (mentionedUserIds.length === 0)
        return;
    const authorId = msg.author.id;
    const savedUsers = (await firestore_1.default.getGuildUsers((_b = msg.guild) === null || _b === void 0 ? void 0 : _b.id)) || [];
    const authorTimezoneData = savedUsers[authorId];
    const matchedUsers = mentionedUserIds
        .map((id) => savedUsers[id] ? { ...savedUsers[id], id } : null)
        .filter((u) => u);
    const userDataWithLastMessageTime = (await (0, commonFunctions_1.getGuildMembers)({ msg, ids: mentionedUserIds })).map(async (fullMember) => {
        var _a;
        if (fullMember.id === msg.author.id)
            return null;
        let isActive = false;
        const found = matchedUsers.find((matched) => matched && matched.id === fullMember.user.id);
        if (!found)
            return null;
        // * uses online/offline status instead of lastMessage, which seems to have been deprecated
        // status will be available if presence intent is available on bot, will always be 'offline' otherwise
        else if (((_a = fullMember.presence) === null || _a === void 0 ? void 0 : _a.status) === `online`) {
            isActive = true;
            // console.log('status:', fullMember.presence?.status)
        }
        return {
            ...found,
            displayName: fullMember.nickname || fullMember.user.username,
            isActive,
        };
    });
    let usersToList = (await Promise.all(userDataWithLastMessageTime)).filter((u) => u);
    // filter out the author themselves
    usersToList = usersToList.filter((u) => u.id !== authorId);
    // filter out anyone who has been recently announced
    usersToList = usersToList.filter((u) => !recentlyAnnounced.find((id) => id === msg.guildId + ` ` + u.id));
    // filter out anyone who is active now
    usersToList = usersToList.filter((u) => !u.isActive);
    // filter out anyone whose timezone is very close to the author
    usersToList = usersToList.filter((u) => !authorTimezoneData ||
        Math.abs((0, commonFunctions_1.getOffset)(authorTimezoneData.location) -
            (0, commonFunctions_1.getOffset)(u.location)) >=
            onlyRespondIfTimezoneOffsetDifferenceIsGreaterThanOrEqualTo);
    if (!usersToList.length)
        return;
    // add to recently announced list
    usersToList
        .map((u) => u.id)
        .forEach((id) => {
        const pushId = msg.guildId + ` ` + id;
        recentlyAnnounced.push(pushId);
        setTimeout(() => {
            recentlyAnnounced = recentlyAnnounced.filter((existingId) => existingId !== pushId);
        }, settings.repeatAnnounceTime
            ? settings.repeatAnnounceTime * 60 * 1000
            : onlyRespondIfNotAnnouncedInMs);
    });
    let outputString = `It's `;
    for (let index = 0; index < usersToList.length; index++) {
        const user = usersToList[index];
        const isLast = index === usersToList.length - 1;
        const isNextToLast = index === usersToList.length - 2;
        outputString += `${(0, commonFunctions_1.getLightEmoji)(user.location)}${(0, commonFunctions_1.currentTimeAt)(user.location, false, Boolean(settings.format24))} for ${user.displayName} (${(0, commonFunctions_1.standardizeTimezoneName)(user.timezoneName)})`;
        if (!isLast && usersToList.length > 2)
            outputString += `, `;
        if (isNextToLast)
            outputString += ` and `;
        if (!isLast && usersToList.length > 2)
            outputString += `\n`;
    }
    outputString += `.`;
    console.log(`${msg.guild && msg.guild.name
        ? (_c = msg.guild.name) === null || _c === void 0 ? void 0 : _c.substring(0, 25).padEnd(25, ` `)
        : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - ${usersToList.length} @${usersToList.length === 1 ? `` : `s`} (${msg.author.username} > ${usersToList
        .map((u) => u.displayName)
        .join(`, `)})`);
    (0, replyInChannel_1.send)(msg, outputString, false, settings);
};
