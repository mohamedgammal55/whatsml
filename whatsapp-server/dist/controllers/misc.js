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
exports.updatePresence = exports.presenceHandler = exports.makePhotoURLHandler = void 0;
const utils_1 = require("../utils");
const service_1 = __importDefault(require("../whatsapp/service"));
const Types_1 = require("../Types");
const makePhotoURLHandler = (type = "number") => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const session = service_1.default.getSession(sessionId);
        const exists = yield service_1.default.jidExists(session, jid, type);
        if (!exists)
            return res.status(400).json({ error: "Jid does not exists" });
        const url = yield session.profilePictureUrl(jid, "image");
        res.status(200).json({ url });
    }
    catch (e) {
        const message = "An error occurred during photo fetch";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.makePhotoURLHandler = makePhotoURLHandler;
const presenceHandler = (type = "number") => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { sessionId, jid } = req.params;
    const { presence } = req.body;
    const session = service_1.default.getSession(sessionId);
    const exists = yield service_1.default.jidExists(session, jid, type);
    if (!exists)
        return res.status(400).json({ error: "Jid does not exists" });
    const result = yield (0, exports.updatePresence)(session, presence, jid);
    if (result.error)
        return res.status((_a = result.code) !== null && _a !== void 0 ? _a : 500).json({ error: result.error });
    res.status(200).json(result);
});
exports.presenceHandler = presenceHandler;
const updatePresence = (session, presence, jid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!Object.values(Types_1.WAPresence).includes(presence))
            return { code: 400, error: "Invalid presence" };
        yield session.sendPresenceUpdate(presence, jid);
        return { message: "Presence updated" };
    }
    catch (e) {
        const message = "An error occurred during presence update";
        utils_1.logger.error(e, message);
        return { code: 500, error: message };
    }
});
exports.updatePresence = updatePresence;
