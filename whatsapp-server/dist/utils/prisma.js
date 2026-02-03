"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPrisma = transformPrisma;
exports.serializePrisma = serializePrisma;
const baileys_1 = require("baileys");
const long_1 = __importDefault(require("long"));
function transformPrisma(data, removeNullable = true) {
    const obj = Object.assign({}, data);
    for (const [key, val] of Object.entries(obj)) {
        if (val instanceof Uint8Array) {
            obj[key] = Buffer.from(val);
        }
        else if (typeof val === "number" || val instanceof long_1.default) {
            obj[key] = (0, baileys_1.toNumber)(val);
        }
        else if (typeof val === "bigint") {
            obj[key] = Number(val);
        }
        else if (removeNullable && (typeof val === "undefined" || val === null)) {
            delete obj[key];
        }
    }
    return obj;
}
function serializePrisma(data, removeNullable = true) {
    const obj = Object.assign({}, data);
    for (const [key, val] of Object.entries(obj)) {
        if (val instanceof Buffer) {
            obj[key] = val.toJSON();
        }
        else if (typeof val === "bigint") {
            obj[key] = val.toString();
        }
        else if (removeNullable && (typeof val === "undefined" || val === null)) {
            delete obj[key];
        }
    }
    return obj;
}
