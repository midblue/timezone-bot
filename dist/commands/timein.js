"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commonFunctions_1 = require("../scripts/commonFunctions");
const replyInChannel_1 = require("../actions/replyInChannel");
const getTimezoneFromLocation_1 = __importDefault(require("../actions/getTimezoneFromLocation"));
exports.default = {
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:timein|ti(?!m))( ?)(.*)$`, `gi`);
    },
    async action({ msg, settings, match }) {
        var _a;
        console.log(`${msg.guild
            ? (_a = msg.guild.name) === null || _a === void 0 ? void 0 : _a.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Time for ${match[2]} (${msg.author.username})`);
        if (!match[1] || !match[2])
            return (0, replyInChannel_1.send)(msg, `Use this command in the format \`${settings.prefix}timein <city or country name>\` to see the time in a specific location.`, `none`, settings);
        // assuming it's a location
        const foundTimezone = await (0, getTimezoneFromLocation_1.default)(match[2]);
        if (!foundTimezone)
            return (0, replyInChannel_1.send)(msg, `Sorry, I couldn't find a timezone for ${match[2]}.`, false, settings);
        (0, replyInChannel_1.send)(msg, `It's ${(0, commonFunctions_1.getLightEmoji)(foundTimezone.location)}${(0, commonFunctions_1.currentTimeAt)(foundTimezone.location, false, Boolean(settings.format24))} in ${match[2]}. (${(0, commonFunctions_1.standardizeTimezoneName)(foundTimezone.timezoneName)})`, false, settings);
    },
};
