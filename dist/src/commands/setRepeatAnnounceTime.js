"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const replyInChannel_1 = require("../actions/replyInChannel");
const defaultServerSettings = require(`../scripts/defaultServerSettings`);
module.exports = {
    admin: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:repeatannouncetime|rat)( )?(.*)?$`, `gi`);
    },
    async action({ msg, settings, match }) {
        const currentRepeatAnnounceTime = settings.repeatAnnounceTime ||
            defaultServerSettings.repeatAnnounceTime;
        let newTime = match[2];
        if (!newTime && newTime !== 0 && newTime !== `0`) {
            return (0, replyInChannel_1.send)(msg, `The current minimum time span for announcing the same user's timezone is ${currentRepeatAnnounceTime} minutes. Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change it.`, false, settings);
        }
        console.log(`${msg.guild ? msg.guild.name : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Set repeat announce time > ${newTime} (${msg.author.username}) `);
        try {
            newTime = parseInt(newTime);
        }
        catch (e) {
            return (0, replyInChannel_1.send)(msg, `Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change the minimum time span for announcing the same user's timezone.`, false, settings);
        }
        if (isNaN(newTime))
            return (0, replyInChannel_1.send)(msg, `Use \`${settings.prefix}repeatannouncetime <# of minutes>\` to change the minimum time span for announcing the same user's timezone.`, false, settings);
        await firestore_1.default.setGuildSettings({
            guildId: msg.guild.id,
            repeatAnnounceTime: newTime,
        });
        (0, replyInChannel_1.send)(msg, `The minimum time span for announcing the same user's timezone has been set to ${newTime} minutes.`, false, settings);
    },
};
