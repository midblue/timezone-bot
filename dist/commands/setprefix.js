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
        return new RegExp(`^(?:${settings.prefix}|t!)(?:prefix|setprefix|p)( ?)(.*)`, `gi`);
    },
    async action({ msg, settings, match }) {
        var _a;
        console.log(`${msg.guild
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Prefix > ${match[2]} (${msg.author.username})`);
        const previousPrefix = settings.prefix;
        let newPrefix = match[2];
        if (!newPrefix || !match[1])
            return (0, replyInChannel_1.send)(msg, `The current prefix is: \`${settings.prefix}\`
Type \`${settings.prefix}prefix <new prefix>\` to change the command prefix for this bot.`, `none`, settings);
        const illegalCharacters = [
            `?`,
            `\\`,
            `^`,
            `$`,
            `@`,
            `#`,
            `{`,
            `}`,
            `[`,
            `]`,
            `(`,
            `)`,
            `<`,
            `>`,
            `:`,
            `*`,
            `|`,
            `+`,
            `.`,
            `\``,
        ];
        let foundIllegalCharacter = false;
        for (let char of illegalCharacters)
            if (newPrefix.indexOf(char) > -1)
                foundIllegalCharacter = char;
        if (foundIllegalCharacter === `\``)
            return (0, replyInChannel_1.send)(msg, `The backtick character is not allowed in prefixes. Please try a different prefix.
(Disallowed characters are \`${illegalCharacters.join(``)} and the backtick character. Your prefix has not been changed.)`, `none`, settings);
        if (foundIllegalCharacter)
            return (0, replyInChannel_1.send)(msg, `The character \`${foundIllegalCharacter}\` is not allowed in prefixes. Please try a different prefix.
(Disallowed characters are \`${illegalCharacters.join(``)} and the backtick character. Your prefix has not been changed.)`, `none`, settings);
        newPrefix = newPrefix.substring(0, 12);
        await firestore_1.default.setGuildSettings({
            prefix: newPrefix,
        }, (_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id);
        (0, replyInChannel_1.send)(msg, `The timezone command prefix been changed from \`${previousPrefix}\` to \`${newPrefix}\``, `none`, settings);
    },
};
