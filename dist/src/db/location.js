"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const memo_1 = __importDefault(require("../scripts/memo"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const memoedLocationData = (0, memo_1.default)(1500);
let firestore = firebase_admin_1.default.firestore();
exports.default = {
    async setLocation({ locationName, locationSettings, }) {
        const sanitizedName = encodeURIComponent(locationName.toLowerCase());
        const document = firestore.doc(`locations/${sanitizedName}`);
        await document.set(locationSettings);
        memoedLocationData.set(sanitizedName, locationSettings);
        console.log(`Added location ${locationName} to database (${JSON.stringify(locationSettings)})`);
    },
    async getLocation(locationName) {
        const sanitizedName = encodeURIComponent(locationName.toLowerCase());
        const memoed = memoedLocationData.get(sanitizedName);
        if (memoed)
            return memoed;
        const document = firestore.doc(`locations/${sanitizedName}`);
        const data = (await document.get()).data();
        if (!data)
            return;
        memoedLocationData.set(sanitizedName, data);
        return data;
    },
};
