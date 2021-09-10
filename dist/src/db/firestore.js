"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
/* eslint-disable camelcase */
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert({
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, `\n`),
    }),
});
const guild_1 = __importDefault(require("./guild"));
const location_1 = __importDefault(require("./location"));
exports.default = {
    ...guild_1.default,
    ...location_1.default,
};
