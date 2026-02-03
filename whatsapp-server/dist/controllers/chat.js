"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.read = exports.presence = exports.find = exports.list = void 0;
const utils_1 = require("../utils");
const database_1 = require("../config/database");
const misc_1 = require("./misc");
const service_1 = __importDefault(require("../whatsapp/service"));
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { cursor = undefined, limit = 25 } = req.query;
        const chats = (yield database_1.prisma.chat.findMany({
            cursor: cursor ? { pkId: Number(cursor) } : undefined,
            take: Number(limit),
            skip: cursor ? 1 : 0,
            where: { sessionId },
            orderBy: { conversationTimestamp: "desc" },
        })).map((c) => (0, utils_1.serializePrisma)(c));
        res.status(200).json({
            data: chats,
            cursor: chats.length !== 0 && chats.length === Number(limit)
                ? chats[chats.length - 1].pkId
                : null,
        });
    }
    catch (e) {
        const message = "An error occurred during chat list";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.list = list;
const find = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const { cursor = undefined, limit = 25 } = req.query;
        const messages = (yield database_1.prisma.message.findMany({
            cursor: cursor ? { pkId: Number(cursor) } : undefined,
            take: Number(limit),
            skip: cursor ? 1 : 0,
            where: { sessionId, remoteJid: jid },
            orderBy: { messageTimestamp: "desc" },
        })).map((m) => (0, utils_1.serializePrisma)(m));
        res.status(200).json({
            data: messages,
            cursor: messages.length !== 0 && messages.length === Number(limit)
                ? messages[messages.length - 1].pkId
                : null,
        });
    }
    catch (e) {
        const message = "An error occurred during chat find";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.find = find;
exports.presence = (0, misc_1.presenceHandler)();
const read = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const session = service_1.default.getSession(sessionId);
        if (!session) {
            return res.status(404).json({ error: `Session with ID ${sessionId} not found.` });
        }
        const lastMsgInChat = yield database_1.prisma.message
            .findFirst({
            where: { sessionId, remoteJid: jid },
            orderBy: { messageTimestamp: "desc" },
        })
            .then((m) => (0, utils_1.serializePrisma)(m));
        if (!lastMsgInChat) {
            return res.status(404).json({ error: `Chat with ID ${jid} not found.` });
        }
        const lastMessage = {
            key: lastMsgInChat.key,
            messageTimestamp: parseInt(lastMsgInChat.messageTimestamp),
        };
        const result = yield session.chatModify({
            markRead: true,
            lastMessages: [lastMessage],
        }, jid);
        res.status(200).json({
            success: true,
            message: `Chat ${jid} marked as read successfully.`,
            data: result,
        });
    }
    catch (e) {
        const errorMessage = "An error occurred during chat read.";
        utils_1.logger.error(e, errorMessage);
        res.status(500).json({ error: errorMessage });
    }
});
exports.read = read;
