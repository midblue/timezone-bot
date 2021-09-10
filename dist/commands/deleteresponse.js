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
        return new RegExp(`^${settings.prefix}(?:deleteresponses?) ?(.*)?$`, `gi`);
    },
    async action({ msg, settings, match }) {
        var _a;
        let seconds = 5 * 60, turnOff = false;
        if (match[1]) {
            try {
                seconds = parseInt(match[1]);
                if (seconds === 0)
                    seconds = 1;
            }
            catch (e) {
                return (0, replyInChannel_1.send)(msg, `Use this command in the format \`${settings.prefix}deleteresponse <number of seconds (optional)>\` to auto-delete responses. Repeat the command with no number to turn deletion off.`, `none`, settings);
            }
        }
        else {
            turnOff = settings.deleteResponse !== false;
        }
        console.log(`${msg.guild ? msg.guild.name : `Private Message`} - Set deleteResponse > ${turnOff ? `off` : seconds} (${msg.author.username}) `);
        await firestore_1.default.setGuildSettings({
            deleteResponse: turnOff ? false : seconds,
        }, (_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id);
        (0, replyInChannel_1.send)(msg, `Bot response messages will ${turnOff
            ? `not be deleted.`
            : `be deleted after ${seconds} seconds.`}`, false, settings);
    },
};
