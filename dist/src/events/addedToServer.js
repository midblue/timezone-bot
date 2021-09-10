"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const { getGuildMembers, } = require(`../scripts/commonFunctions`);
exports.default = async (guild) => {
    if (await firestore_1.default.hasGuild({ guildId: guild.id }))
        return console.log(`> > > > > >           Was re-added to a guild:`, guild.name, guild.id);
    await firestore_1.default.addGuild({
        guildId: guild.id,
        guildName: guild.name,
    });
    console.log(`> > > > > >           Was added to a new guild:`, guild.name, guild.id, `(${(await getGuildMembers({ guild })).length} users)`);
};
