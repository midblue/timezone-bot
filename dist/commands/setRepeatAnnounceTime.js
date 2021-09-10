"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const replyInChannel_1 = require("../actions/replyInChannel");
const defaultServerSettings_1 = __importDefault(require("../scripts/defaultServerSettings"));
exports.default = {
    admin: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:repeatannouncetime|rat)( )?(.*)?$`, `gi`);
    },
    async action({ msg, settings, match }) {
        var _a;
        const currentRepeatAnnounceTime = settings.repeatAnnounceTime ||
            defaultServerSettings_1.default.repeatAnnounceTime;
        let newTime;
        try {
            newTime = parseInt(match[2] || `0`);
        }
        catch (e) {
            newTime = 0;
            return (0, replyInChannel_1.send)(msg, `Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change the minimum time span for announcing the same user's timezone.`, false, settings);
        }
        if (isNaN(newTime) || !newTime || newTime === 0) {
            return (0, replyInChannel_1.send)(msg, `The current minimum time span for announcing the same user's timezone is ${currentRepeatAnnounceTime} minutes. Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change it.`, false, settings);
        }
        console.log(`${msg.guild ? msg.guild.name : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Set repeat announce time > ${newTime} (${msg.author.username}) `);
        await firestore_1.default.setGuildSettings({
            repeatAnnounceTime: newTime,
        }, (_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id);
        (0, replyInChannel_1.send)(msg, `The minimum time span for announcing the same user's timezone has been set to ${newTime} minutes.`, false, settings);
    },
};
