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
exports.photo = exports.check = exports.updateBlock = exports.listBlocked = exports.list = void 0;
const utils_1 = require("../utils");
const misc_1 = require("./misc");
const database_1 = require("../config/database");
const service_1 = __importDefault(require("../whatsapp/service"));
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { cursor = undefined, limit = 25, search } = req.query;
        const whereConditions = {
            id: { endsWith: "s.whatsapp.net" },
            sessionId,
        };
        if (search) {
            whereConditions.OR = [
                {
                    name: {
                        contains: String(search),
                    },
                },
                {
                    verifiedName: {
                        contains: String(search),
                    },
                },
                {
                    notify: {
                        contains: String(search),
                    },
                },
            ];
        }
        const contacts = yield database_1.prisma.contact.findMany({
            cursor: cursor ? { pkId: Number(cursor) } : undefined,
            take: Number(limit),
            skip: cursor ? 1 : 0,
            where: whereConditions,
        });
        res.status(200).json({
            data: contacts,
            cursor: contacts.length !== 0 && contacts.length === Number(limit)
                ? contacts[contacts.length - 1].pkId
                : null,
        });
    }
    catch (e) {
        const message = "An error occurred during contact list";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.list = list;
const listBlocked = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = service_1.default.getSession(req.params.sessionId);
        const data = yield session.fetchBlocklist();
        res.status(200).json(data);
    }
    catch (e) {
        const message = "An error occurred during blocklist fetch";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.listBlocked = listBlocked;
const updateBlock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = service_1.default.getSession(req.params.sessionId);
        const { jid, action = "block" } = req.body;
        const exists = yield service_1.default.jidExists(session, jid);
        if (!exists)
            return res.status(400).json({ error: "Jid does not exists" });
        yield session.updateBlockStatus(jid, action);
        res.status(200).json({ message: `Contact ${action}ed` });
    }
    catch (e) {
        const message = "An error occurred during blocklist update";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.updateBlock = updateBlock;
const check = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const session = service_1.default.getSession(sessionId);
        const exists = yield service_1.default.jidExists(session, jid);
        res.status(200).json({ exists });
    }
    catch (e) {
        const message = "An error occurred during jid check";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.check = check;
exports.photo = (0, misc_1.makePhotoURLHandler)();
