"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const commonFunctions_1 = require("../scripts/commonFunctions");
const replyInChannel_1 = require("../actions/replyInChannel");
module.exports = {
    ignoreAdminOnly: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:removeme|rm)$`, `gi`);
    },
    async action({ msg, settings }) {
        console.log(`${msg.guild
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Remove ${msg.author.username}`);
        firestore_1.default.removeUserFromGuild({
            guildId: msg.guild.id,
            userId: msg.author.id || msg.author.user.id,
        });
        return (0, replyInChannel_1.send)(msg, `Removed you (${await (0, commonFunctions_1.getAuthorDisplayName)(msg)}) from timezone tracking.`, false, settings);
    },
};
