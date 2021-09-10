"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const commonFunctions_1 = require("../scripts/commonFunctions");
const replyInChannel_1 = require("../actions/replyInChannel");
exports.default = {
    ignoreAdminOnly: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:removeme|rm)$`, `gi`);
    },
    async action({ msg, settings }) {
        var _a, _b;
        console.log(`${((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.name)
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Remove ${msg.author.username}`);
        firestore_1.default.removeUserFromGuild({
            guildId: (_b = msg.guild) === null || _b === void 0 ? void 0 : _b.id,
            userId: msg.author.id,
        });
        return (0, replyInChannel_1.send)(msg, `Removed you (${await (0, commonFunctions_1.getAuthorDisplayName)(msg)}) from timezone tracking.`, false, settings);
    },
};
