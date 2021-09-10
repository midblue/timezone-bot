"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const all_1 = __importDefault(require("./all"));
const replyInChannel_1 = require("../actions/replyInChannel");
const commonFunctions_1 = require("../scripts/commonFunctions");
exports.default = {
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:role)( )?(.*)$`, `gi`);
    },
    async action({ msg, match, settings }) {
        var _a;
        let roleId = match[2];
        if (roleId.indexOf(`<@&`) === 0)
            roleId = roleId.substring(3, roleId.length - 1);
        console.log(`${msg.guild
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Role (${roleId})`);
        const roles = [
            ...((await ((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.roles.fetch())) || []).values(),
        ];
        const role = roles.find((r) => r.id === roleId || r.name === roleId);
        if (!role)
            return (0, replyInChannel_1.send)(msg, `The 'role' command lists the time for everyone in a certain role. I couldn't find a role by the name you entered. Use \`${settings.prefix}role <@role or role name>\` to run this command.`, `none`, settings);
        // this is just to prime the cache — if we don't, the cache doesn't necessarily have all users in it when we check for role members.
        await (0, commonFunctions_1.getGuildMembers)({ msg });
        const members = [...(await role.members.values())];
        if (!members.length)
            return (0, replyInChannel_1.send)(msg, `I couldn't find any members in that role.`, false, settings);
        all_1.default.action({
            msg,
            settings,
            match,
            users: members,
            prependText: `in \`@${role.name}\``,
        });
    },
};
