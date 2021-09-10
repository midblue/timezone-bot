"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const replyInChannel_1 = require("../actions/replyInChannel");
exports.default = {
    admin: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:admins?only)$`, `gi`);
    },
    async action({ msg, settings, match }) {
        var _a;
        const turnOff = settings.adminOnly === true;
        console.log(`${msg.guild ? msg.guild.name : `Private Message`} - Toggle admin mode > ${turnOff ? `off` : `on`} (${msg.author.username}) `);
        await firestore_1.default.setGuildSettings({
            adminOnly: !turnOff,
        }, (_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id);
        (0, replyInChannel_1.send)(msg, `Commands ${turnOff
            ? `may now be used by all users`
            : `may now only be used by admins`}.`, false, settings);
    },
};
