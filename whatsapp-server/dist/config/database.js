"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = __importDefault(require("./env"));
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: env_1.default.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        errorFormat: "minimal",
    });
if (env_1.default.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
