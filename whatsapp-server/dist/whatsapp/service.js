"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const baileys_1 = __importStar(require("baileys"));
const store_1 = require("./store");
const database_1 = require("../config/database");
const utils_1 = require("../utils");
const Types_1 = require("../Types");
const qrcode_1 = require("qrcode");
const env_1 = __importDefault(require("../config/env"));
class WhatsappService {
    constructor() {
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const storedSessions = yield database_1.prisma.session.findMany({
                select: { sessionId: true, data: true },
                where: { id: { startsWith: env_1.default.SESSION_CONFIG_ID } },
            });
            for (const { sessionId, data } of storedSessions) {
                const _a = JSON.parse(data), { readIncomingMessages } = _a, socketConfig = __rest(_a, ["readIncomingMessages"]);
                WhatsappService.createSession({ sessionId, readIncomingMessages, socketConfig });
            }
        });
    }
    static updateWaConnection(sessionId, waStatus) {
        if (WhatsappService.sessions.has(sessionId)) {
            const _session = WhatsappService.sessions.get(sessionId);
            WhatsappService.sessions.set(sessionId, Object.assign(Object.assign({}, _session), { waStatus }));
            (0, utils_1.emitEvent)("connection.update", sessionId, { status: waStatus });
        }
    }
    static shouldReconnect(sessionId) {
        var _a;
        let attempts = (_a = WhatsappService.retries.get(sessionId)) !== null && _a !== void 0 ? _a : 0;
        if (attempts < env_1.default.MAX_RECONNECT_RETRIES) {
            attempts += 1;
            WhatsappService.retries.set(sessionId, attempts);
            return true;
        }
        return false;
    }
    static createSession(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionId, res, SSE = false, readIncomingMessages = false, usePairingCode, phoneNumber, socketConfig, } = options;
            const configID = `${env_1.default.SESSION_CONFIG_ID}-${sessionId}`;
            let connectionState = { connection: "close" };
            const destroy = (...args_1) => __awaiter(this, [...args_1], void 0, function* (logout = true) {
                try {
                    yield Promise.all([
                        logout && socket.logout(),
                        database_1.prisma.chat.deleteMany({ where: { sessionId } }),
                        database_1.prisma.contact.deleteMany({ where: { sessionId } }),
                        database_1.prisma.message.deleteMany({ where: { sessionId } }),
                        database_1.prisma.groupMetadata.deleteMany({ where: { sessionId } }),
                        database_1.prisma.session.deleteMany({ where: { sessionId } }),
                    ]);
                    utils_1.logger.info({ session: sessionId }, "Session destroyed");
                }
                catch (e) {
                    utils_1.logger.error(e, "An error occurred during session destroy");
                }
                finally {
                    WhatsappService.sessions.delete(sessionId);
                    WhatsappService.updateWaConnection(sessionId, Types_1.WAStatus.Disconnected);
                }
            });
            const handleConnectionClose = () => {
                var _a, _b, _c, _d;
                const code = (_c = (_b = (_a = connectionState.lastDisconnect) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.output) === null || _c === void 0 ? void 0 : _c.statusCode;
                const restartRequired = code === baileys_1.DisconnectReason.restartRequired;
                const doNotReconnect = !WhatsappService.shouldReconnect(sessionId);
                WhatsappService.updateWaConnection(sessionId, Types_1.WAStatus.Disconnected);
                if (code === baileys_1.DisconnectReason.loggedOut || doNotReconnect) {
                    if (res) {
                        !SSE &&
                            !res.headersSent &&
                            res.status(500).json({ error: "Unable to create session" });
                        res.end();
                    }
                    destroy(doNotReconnect);
                    return;
                }
                if (!restartRequired) {
                    utils_1.logger.info({ attempts: (_d = WhatsappService.retries.get(sessionId)) !== null && _d !== void 0 ? _d : 1, sessionId }, "Reconnecting...");
                }
                setTimeout(() => WhatsappService.createSession(options), restartRequired ? 0 : env_1.default.RECONNECT_INTERVAL);
            };
            const handleNormalConnectionUpdate = () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if ((_a = connectionState.qr) === null || _a === void 0 ? void 0 : _a.length) {
                    if (res && !res.headersSent) {
                        if (usePairingCode && phoneNumber && !socket.authState.creds.registered) {
                            try {
                                const code = yield socket.requestPairingCode(phoneNumber);
                                WhatsappService.updateWaConnection(sessionId, Types_1.WAStatus.WaitForPairCodeAuth);
                                (0, utils_1.emitEvent)("pair_code.updated", sessionId, { code });
                                res.status(200).json({ code });
                                return;
                            }
                            catch (e) {
                                utils_1.logger.error(e, "An");
                                (0, utils_1.emitEvent)("pair_code.updated", sessionId, undefined, "error", `Unable to generate pair code: ${e.message}`);
                                res.status(500).json({ error: "Unable to generate pair code" });
                                return;
                            }
                        }
                        try {
                            const qr = yield (0, qrcode_1.toDataURL)(connectionState.qr);
                            WhatsappService.updateWaConnection(sessionId, Types_1.WAStatus.WaitQrcodeAuth);
                            (0, utils_1.emitEvent)("qrcode.updated", sessionId, { qr });
                            res.status(200).json({ qr });
                            return;
                        }
                        catch (e) {
                            utils_1.logger.error(e, "An error occurred during QR generation");
                            (0, utils_1.emitEvent)("qrcode.updated", sessionId, undefined, "error", `Unable to generate QR code: ${e.message}`);
                            res.status(500).json({ error: "Unable to generate QR" });
                            return;
                        }
                    }
                    destroy();
                }
            });
            const handleSSEConnectionUpdate = () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                let qr = undefined;
                if ((_a = connectionState.qr) === null || _a === void 0 ? void 0 : _a.length) {
                    try {
                        WhatsappService.updateWaConnection(sessionId, Types_1.WAStatus.WaitQrcodeAuth);
                        qr = yield (0, qrcode_1.toDataURL)(connectionState.qr);
                    }
                    catch (e) {
                        utils_1.logger.error(e, "An error occurred during QR generation");
                        (0, utils_1.emitEvent)("qrcode.updated", sessionId, undefined, "error", `Unable to generate QR code: ${e.message}`);
                    }
                }
                const currentGenerations = (_b = WhatsappService.SSEQRGenerations.get(sessionId)) !== null && _b !== void 0 ? _b : 0;
                if (!res ||
                    res.writableEnded ||
                    (qr && currentGenerations >= env_1.default.SSE_MAX_QR_GENERATION)) {
                    res && !res.writableEnded && res.end();
                    destroy();
                    return;
                }
                const data = Object.assign(Object.assign({}, connectionState), { qr });
                if (qr) {
                    WhatsappService.SSEQRGenerations.set(sessionId, currentGenerations + 1);
                    (0, utils_1.emitEvent)("qrcode.updated", sessionId, { qr });
                }
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            });
            const handleConnectionUpdate = SSE
                ? handleSSEConnectionUpdate
                : handleNormalConnectionUpdate;
            const { state, saveCreds } = yield (0, store_1.useSession)(sessionId);
            const socket = (0, baileys_1.default)(Object.assign(Object.assign({ printQRInTerminal: false, generateHighQualityLinkPreview: true, browser: ["macOS", "Chrome", "131.0.6778.205"] }, socketConfig), {
                auth: {
                    creds: state.creds,
                    keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, utils_1.logger),
                }, logger: utils_1.logger, shouldIgnoreJid: (jid) => (0, baileys_1.isJidBroadcast)(jid), getMessage: (key) => __awaiter(this, void 0, void 0, function* () {
                    const data = yield database_1.prisma.message.findFirst({
                        where: { remoteJid: key.remoteJid, id: key.id, sessionId },
                    });
                    return ((data === null || data === void 0 ? void 0 : data.message) || undefined);
                })
            }));
            const store = new store_1.Store(sessionId, socket.ev);
            WhatsappService.sessions.set(sessionId, Object.assign(Object.assign({}, socket), {
                destroy,
                store, waStatus: Types_1.WAStatus.Unknown
            }));
            socket.ev.on("creds.update", saveCreds);
            socket.ev.on("connection.update", (update) => {
                connectionState = update;
                const { connection } = update;
                if (connection === "open") {
                    WhatsappService.updateWaConnection(sessionId, update.isNewLogin ? Types_1.WAStatus.Authenticated : Types_1.WAStatus.Connected);
                    WhatsappService.retries.delete(sessionId);
                    WhatsappService.SSEQRGenerations.delete(sessionId);
                }
                if (connection === "close")
                    handleConnectionClose();
                if (connection === "connecting")
                    WhatsappService.updateWaConnection(sessionId, Types_1.WAStatus.PullingWAData);
                handleConnectionUpdate();
            });
            if (readIncomingMessages) {
                socket.ev.on("messages.upsert", (m) => __awaiter(this, void 0, void 0, function* () {
                    const message = m.messages[0];
                    if (message.key.fromMe || m.type !== "notify")
                        return;
                    yield (0, utils_1.delay)(1000);
                    yield socket.readMessages([message.key]);
                }));
            }
            yield database_1.prisma.session.upsert({
                create: {
                    id: configID,
                    sessionId,
                    data: JSON.stringify(Object.assign({ readIncomingMessages }, socketConfig)),
                },
                update: {},
                where: { sessionId_id: { id: configID, sessionId } },
            });
        });
    }
    static getSessionStatus(session) {
        return session.waStatus;
    }
    static listSessions() {
        return Array.from(WhatsappService.sessions.entries()).map(([id, session]) => ({
            id,
            status: WhatsappService.getSessionStatus(session),
        }));
    }
    static getSession(sessionId) {
        return WhatsappService.sessions.get(sessionId);
    }
    static deleteSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = WhatsappService.sessions.get(sessionId)) === null || _a === void 0 ? void 0 : _a.destroy();
        });
    }
    static sessionExists(sessionId) {
        return WhatsappService.sessions.has(sessionId);
    }
    static validJid(session_1, jid_1) {
        return __awaiter(this, arguments, void 0, function* (session, jid, type = "number") {
            try {
                if (type === "number") {
                    const [result] = yield session.onWhatsApp(jid);
                    if (result === null || result === void 0 ? void 0 : result.exists) {
                        return result.jid;
                    }
                    else {
                        return null;
                    }
                }
                const groupMeta = yield session.groupMetadata(jid);
                if (groupMeta.id) {
                    return groupMeta.id;
                }
                else {
                    return null;
                }
            }
            catch (e) {
                return null;
            }
        });
    }
    static jidExists(session_1, jid_1) {
        return __awaiter(this, arguments, void 0, function* (session, jid, type = "number") {
            const validJid = yield this.validJid(session, jid, type);
            return !!validJid;
        });
    }
}
WhatsappService.sessions = new Map();
WhatsappService.retries = new Map();
WhatsappService.SSEQRGenerations = new Map();
exports.default = WhatsappService;
