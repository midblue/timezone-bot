"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (guild) => {
    // seems like there's no reason to delete their settings, they might readd later
    // db.removeGuild({ guildId: guild.id })
    if (guild.name)
        console.log(`< < < < < <           Was removed from a guild: ` +
            guild.name);
};
