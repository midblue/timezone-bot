"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const replyInChannel_1 = require("../actions/replyInChannel");
const getTimezoneFromLocation_1 = __importDefault(require("../actions/getTimezoneFromLocation"));
const commonFunctions_1 = require("../scripts/commonFunctions");
const allCommands = require(`./index`);
exports.default = {
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:set|s)(?!user) (.*)$`, `gi`);
    },
    async action({ msg, settings, match, client, }) {
        var _a, _b, _c;
        if (!match[1])
            return (0, replyInChannel_1.send)(msg, `Use this command in the format ${settings.prefix}set <city or country name> to set your timezone.`, false, settings);
        // admin accidentally used this command to try to set someone
        let hasAt = match[1].indexOf(`<@`);
        if (hasAt !== -1) {
            const hasSpaceAfterAt = match[1].lastIndexOf(` `) > hasAt;
            if (hasAt && hasSpaceAfterAt) {
                const commandRegex = new RegExp(`${settings.prefix}[^ ]* `, `gi`);
                msg.content = msg.content.replace(commandRegex, `${settings.prefix}setuser `);
                return allCommands(msg, settings, client);
            }
            else if (hasAt)
                return (0, replyInChannel_1.send)(msg, `Use this command in the format ${settings.prefix}set <city or country name> to set your timezone.`, false, settings);
        }
        console.log(`${((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.name)
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - ${msg.author.username} > set to ${match[1]}`);
        const foundTimezone = await (0, getTimezoneFromLocation_1.default)(match[1]);
        if (!foundTimezone)
            return (0, replyInChannel_1.send)(msg, `Sorry, I couldn't find a timezone for ${match[1]}.`, false, settings);
        await firestore_1.default.updateUserInGuild({
            guildId: (_b = msg.guild) === null || _b === void 0 ? void 0 : _b.id,
            guildName: (_c = msg.guild) === null || _c === void 0 ? void 0 : _c.name,
            userId: msg.author.id,
            updatedInfo: foundTimezone,
        });
        const authorInGuild = await (0, commonFunctions_1.getUserInGuildFromId)(msg.guild || undefined, msg.author.id);
        if (authorInGuild)
            (0, replyInChannel_1.send)(msg, `Timezone for ${(0, commonFunctions_1.getLabelFromUser)(authorInGuild)} set to ${(0, commonFunctions_1.standardizeTimezoneName)(foundTimezone.timezoneName)}. (${(0, commonFunctions_1.getLightEmoji)(foundTimezone.location)}${(0, commonFunctions_1.currentTimeAt)(foundTimezone.location, false, Boolean(settings.format24))})` +
                (match[1].length <= 4 ||
                    (match[1].length <= 7 &&
                        match[1].indexOf(`+`) > -1) ||
                    (match[1].length <= 7 &&
                        match[1].indexOf(`-`) > -1) ||
                    match[1].toLowerCase().indexOf(` time`) > -1
                    ? `\nBy the way, location names always work better than timezone codes/names!`
                    : ``), false, settings);
    },
};
