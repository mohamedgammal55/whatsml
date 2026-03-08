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
exports.read = exports.find = exports.deleteMessageForMe = exports.deleteMessage = exports.download = exports.sendBulk = exports.send = exports.list = void 0;
const baileys_1 = require("baileys");
const link_preview_js_1 = require("link-preview-js");
const addLinkPreview = (message, enabled = false) => __awaiter(void 0, void 0, void 0, function* () {
    if (!enabled) return;
    if (message && message.text && typeof message.text === 'string' && message.text.toLowerCase().includes('http')) {
        const urlMatch = message.text.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
            const url = urlMatch[0];
            try {
                // We will try to get preview data to make it look better
                const previewData = yield (0, link_preview_js_1.getLinkPreview)(url);

                // Instead of just adding a preview card (which user might dislike or find non-clickable),
                // we'll try to use the "Buttons" approach if it's a simple text message.
                // However, Baileys sendMessage supports a structured object.

                message.contextInfo = message.contextInfo || {};
                message.contextInfo.externalAdReply = {
                    title: (previewData && previewData.title) ? previewData.title : "Open Url",
                    body: (previewData && previewData.description) ? previewData.description : url,
                    mediaType: 1,
                    thumbnailUrl: (previewData && previewData.favicons && previewData.favicons.length > 0) ? previewData.favicons[0] : (previewData && previewData.images && previewData.images.length > 0 ? previewData.images[0] : undefined),
                    sourceUrl: url,
                    renderLargerThumbnail: false
                };
            }
            catch (e) {
                // Fallback if scraping fails
                message.contextInfo = message.contextInfo || {};
                message.contextInfo.externalAdReply = {
                    title: "Open Url",
                    body: url,
                    mediaType: 1,
                    sourceUrl: url,
                    renderLargerThumbnail: false
                };
            }
        }
    }
});
const utils_1 = require("../utils");
const database_1 = require("../config/database");
const service_1 = __importDefault(require("../whatsapp/service"));
const misc_1 = require("./misc");
const Types_1 = require("../Types");
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { cursor = undefined, limit = 25 } = req.query;
        const messages = (yield database_1.prisma.message.findMany({
            cursor: cursor ? { pkId: Number(cursor) } : undefined,
            take: Number(limit),
            skip: cursor ? 1 : 0,
            where: { sessionId },
        })).map((m) => (0, utils_1.serializePrisma)(m));
        res.status(200).json({
            data: messages,
            cursor: messages.length !== 0 && messages.length === Number(limit)
                ? messages[messages.length - 1].pkId
                : null,
        });
    }
    catch (e) {
        const message = "An error occurred during message list";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.list = list;
const send = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const start = Date.now();
    try {
        const { jid, type = "number", message, options, generate_link_preview = false } = req.body;
        const sessionId = req.params.sessionId;
        utils_1.logger.info({ sessionId, jid, type }, "Starting send message process");
        const session = service_1.default.getSession(sessionId);
        if (!session) {
            utils_1.logger.error({ sessionId }, "Session not found");
            return res.status(404).json({ error: "Session not found" });
        }
        utils_1.logger.info("Validating JID");
        const validJid = yield service_1.default.validJid(session, jid, type);
        utils_1.logger.info({ validJid, elapsed: Date.now() - start }, "JID validated");
        if (!validJid)
            return res.status(400).json({ error: "JID does not exists" });
        yield (0, misc_1.updatePresence)(session, Types_1.WAPresence.Available, validJid);
        yield addLinkPreview(message, generate_link_preview);
        utils_1.logger.info("Calling session.sendMessage");
        const result = yield session.sendMessage(validJid, message, options);
        utils_1.logger.info({ elapsed: Date.now() - start }, "session.sendMessage finished");
        (0, utils_1.emitEvent)("send.message", sessionId, { jid: validJid, result, tracking_id: req.body.tracking_id });
        utils_1.logger.info("Event emitted, sending response");
        res.status(200).json(result);
        utils_1.logger.info({ elapsed: Date.now() - start }, "Response sent");
    }
    catch (e) {
        const elapsed = Date.now() - start;
        const message = "An error occurred during message send";
        utils_1.logger.error({ error: e.message, stack: e.stack, elapsed }, message);
        (0, utils_1.emitEvent)("send.message", req.params.sessionId, { request: req.body }, "error", message + ": " + e.message);
        res.status(500).json({ error: message + ": " + e.message });
    }
});
exports.send = send;
const sendBulk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.params;
    const session = service_1.default.getSession(sessionId);
    const results = [];
    const errors = [];
    for (const [index, { jid, type = "number", delay = 1000, message, options },] of req.body.entries()) {
        try {
            const exists = yield service_1.default.jidExists(session, jid, type);
            if (!exists) {
                errors.push({ index, error: "JID does not exists" });
                continue;
            }
            if (index > 0)
                yield (0, utils_1.delay)(delay);
            yield (0, misc_1.updatePresence)(session, Types_1.WAPresence.Available, jid);
            yield addLinkPreview(message, req.body.generate_link_preview || false);
            const result = yield session.sendMessage(jid, message, options);
            results.push({ index, result });
            (0, utils_1.emitEvent)("send.message", sessionId, { jid, result });
        }
        catch (e) {
            const message = "An error occurred during message send";
            utils_1.logger.error(e, message);
            errors.push({ index, error: message });
            (0, utils_1.emitEvent)("send.message", sessionId, undefined, "error", message + ": " + e.message);
        }
    }
    res.status(req.body.length !== 0 && errors.length === req.body.length ? 500 : 200).json({
        results,
        errors,
    });
});
exports.sendBulk = sendBulk;
const download = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = service_1.default.getSession(req.params.sessionId);
        const message = req.body;
        const type = Object.keys(message.message)[0];
        const content = message.message[type];
        const buffer = yield (0, baileys_1.downloadMediaMessage)(message, "buffer", {}, { logger: utils_1.logger, reuploadRequest: session.updateMediaMessage });
        res.setHeader("Content-Type", content.mimetype);
        res.write(buffer);
        res.end();
    }
    catch (e) {
        const message = "An error occurred during message media download";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.download = download;
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { jid, type = "number", message } = req.body;
        const session = service_1.default.getSession(sessionId);
        const exists = yield service_1.default.jidExists(session, jid, type);
        if (!exists)
            return res.status(400).json({ error: "JID does not exists" });
        const result = yield session.sendMessage(jid, { delete: message });
        res.status(200).json(result);
    }
    catch (e) {
        const message = "An error occurred during message delete";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.deleteMessage = deleteMessage;
const deleteMessageForMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { jid, type = "number" } = req.body;
        const session = service_1.default.getSession(sessionId);
        const exists = yield service_1.default.jidExists(session, jid, type);
        if (!exists)
            return res.status(400).json({ error: "JID does not exists" });
        const result = yield session.chatModify({ clear: true }, jid);
        res.status(200).json(result);
    }
    catch (e) {
        const message = "An error occurred during message delete";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.deleteMessageForMe = deleteMessageForMe;
const find = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { id } = req.params;
        const message = yield database_1.prisma.message.findFirst({
            where: { sessionId, id },
        });
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        res.status(200).json((0, utils_1.serializePrisma)(message));
    }
    catch (e) {
        const message = "An error occurred during message retrieval";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.find = find;
const read = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const messages = req.body;
        utils_1.logger.info("reading messages", messages);
        const session = service_1.default.getSession(sessionId);
        const result = yield session.readMessages(messages);
        res.status(200).json(result);
    }
    catch (e) {
        const message = "An error occurred during read messages";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.read = read;
