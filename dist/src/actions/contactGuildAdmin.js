"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commonFunctions_1 = require("../scripts/commonFunctions");
async function default_1({ guild, message, }) {
    if (!guild)
        return;
    const currentGuildContacts = await (0, commonFunctions_1.getContactsOrOwnerOrModerator)({
        guild,
    });
    if (!currentGuildContacts)
        return console.log(`Failed to find contact points in server`, guild.name);
    currentGuildContacts.forEach((singleContact) => singleContact.user
        .send(message.substring(0, 1999))
        .then(() => {
        // console.log('Contacted admin', singleContact.user.username)
    })
        .catch((err) => {
        // console.log(
        //   `Failed to contact admin ${getLabelFromUser(singleContact)}: ${
        //     err.message
        //   }`,
        // )
    }));
}
exports.default = default_1;
