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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.del = exports.addSSE = exports.add = exports.status = exports.find = exports.list = void 0;
const utils_1 = require("../utils");
const service_1 = __importDefault(require("../whatsapp/service"));
const list = (req, res) => {
    res.status(200).json(service_1.default.listSessions());
};
exports.list = list;
const find = (req, res) => res.status(200).json({ message: "Session found" });
exports.find = find;
const status = (req, res) => {
    const session = service_1.default.getSession(req.params.sessionId);
    res.status(200).json({ status: service_1.default.getSessionStatus(session) });
};
exports.status = status;
const add = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    utils_1.logger.warn(req.body);
    const _a = req.body, { sessionId, readIncomingMessages, authType, phoneNumber } = _a, socketConfig = __rest(_a, ["sessionId", "readIncomingMessages", "authType", "phoneNumber"]);
    if (service_1.default.sessionExists(sessionId))
        return res.status(400).json({ error: "Session already exists" });
    const usePairingCode = authType === "code";
    service_1.default.createSession({
        sessionId,
        res,
        readIncomingMessages,
        usePairingCode,
        phoneNumber,
        socketConfig,
    });
});
exports.add = add;
const addSSE = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.params;
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    if (service_1.default.sessionExists(sessionId)) {
        res.write(`data: ${JSON.stringify({ error: "Session already exists" })}\n\n`);
        res.end();
        return;
    }
    service_1.default.createSession({ sessionId, res, SSE: true });
});
exports.addSSE = addSSE;
const del = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield service_1.default.deleteSession(req.params.sessionId);
    res.status(200).json({ message: "Session deleted" });
});
exports.del = del;
