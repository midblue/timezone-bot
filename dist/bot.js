"use strict";
// todo
/*
save server counts/dates
set times for non-users
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// test realm is 605053799404666880
// https://discord.com/api/oauth2/authorize?client_id=723017262369472603&permissions=75840&scope=bot
require(`dotenv`).config();
const Discord = __importStar(require("discord.js-light"));
// remove non-text channels and remove text channels whose last message is older than 10 minutes
function channelFilter(channel) {
    if (!channel.isText())
        return false;
    return (!channel.lastMessageId ||
        Discord.SnowflakeUtil.deconstruct(channel.lastMessageId)
            .timestamp <
            Date.now() - 1000 * 60 * 10);
}
const client = new Discord.Client({
    makeCache: Discord.Options.cacheWithLimits({
        GuildManager: Infinity,
        GuildMemberManager: Infinity,
        PresenceManager: Infinity,
        RoleManager: {
            maxSize: 300,
            sweepInterval: 3600,
        },
        ThreadManager: 0,
        ThreadMemberManager: 0,
        UserManager: {
            maxSize: 0,
            keepOverLimit: (value, key, collection) => { var _a; return value.id === ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id); },
        },
        // PermissionOverwrites: Infinity, // cache all PermissionOverwrites. It only costs memory if the channel it belongs to is cached
        ChannelManager: {
            maxSize: 0,
            sweepFilter: () => channelFilter,
            sweepInterval: 3600,
        },
        GuildChannelManager: {
            maxSize: 0,
            sweepFilter: () => channelFilter,
            sweepInterval: 3600,
        },
    }),
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_PRESENCES,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
    ],
    // messageCacheMaxSize: 2,
    // messageCacheLifetime: 30,
    // messageSweepInterval: 60,
    // disabledEvents: [
    //   // 'GUILD_ROLE_CREATE',
    //   // 'GUILD_ROLE_DELETE',
    //   // 'GUILD_ROLE_UPDATE',
    //   'GUILD_BAN_ADD',
    //   'GUILD_BAN_REMOVE',
    //   'GUILD_EMOJIS_UPDATE',
    //   'GUILD_INTEGRATIONS_UPDATE',
    //   'CHANNEL_PINS_UPDATE',
    //   'PRESENCE_UPDATE',
    //   'TYPING_START',
    //   'VOICE_STATE_UPDATE',
    //   'VOICE_SERVER_UPDATE',
    // ],
});
const addedToServer_1 = __importDefault(require("./events/addedToServer"));
const kickedFromServer_1 = __importDefault(require("./events/kickedFromServer"));
const receivePrivateMessage_1 = __importDefault(require("./events/receivePrivateMessage"));
const receiveGuildMessage_1 = __importDefault(require("./events/receiveGuildMessage"));
const otherMemberLeaveServer_1 = __importDefault(require("./events/otherMemberLeaveServer"));
const launchTime = Date.now();
let messagesScannedSinceLastAnnounce = 0;
const announceTimeSpanInHours = 0.5;
setInterval(async () => {
    if (messagesScannedSinceLastAnnounce > 0) {
        console.log(`. . . . ${messagesScannedSinceLastAnnounce} messages watched in ${announceTimeSpanInHours} hours. (Running for ${Math.round((Date.now() - launchTime) / 60 / 60 / 1000)} hours in ${[...(await client.guilds.fetch()).keys()].length} guilds)`);
    }
    messagesScannedSinceLastAnnounce = 0;
}, Math.round(announceTimeSpanInHours * 60 * 60 * 1000));
client.on(`error`, (e) => console.log(`Discord.js error:`, e.message));
client.on(`ready`, async () => {
    var _a, _b;
    console.log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag} in ${[...(await client.guilds.fetch()).keys()].length} guilds`);
    (_b = client.user) === null || _b === void 0 ? void 0 : _b.setActivity(`t!info`, { type: `LISTENING` });
});
client.on(`messageCreate`, async (msg) => {
    messagesScannedSinceLastAnnounce++;
    if (!msg.author ||
        msg.author.id === process.env.BOT_ID ||
        msg.author.bot)
        return;
    if (!msg.guild || !msg.guild.available)
        return (0, receivePrivateMessage_1.default)(msg);
    return (0, receiveGuildMessage_1.default)(msg, client);
});
// added to a server
client.on(`guildCreate`, (guild) => (0, addedToServer_1.default)(guild));
// removed from a server
client.on(`guildDelete`, (guild) => (0, kickedFromServer_1.default)(guild));
// other user leaves a guild
client.on(`guildMemberRemove`, (member) => (0, otherMemberLeaveServer_1.default)(member));
client.login(process.env.DISCORD_TOKEN);
