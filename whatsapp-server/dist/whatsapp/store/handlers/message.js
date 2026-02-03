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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = messageHandler;
const baileys_1 = require("baileys");
const utils_1 = require("../../../utils");
const database_1 = require("../../../config/database");
const getKeyAuthor = (key) => ((key === null || key === void 0 ? void 0 : key.fromMe) ? "me" : (key === null || key === void 0 ? void 0 : key.participant) || (key === null || key === void 0 ? void 0 : key.remoteJid)) || "";
function messageHandler(sessionId, event) {
    const model = database_1.prisma.message;
    let listening = false;
    const set = (_a) => __awaiter(this, [_a], void 0, function* ({ messages, isLatest }) {
        try {
            yield database_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                if (isLatest)
                    yield tx.message.deleteMany({ where: { sessionId } });
                const processedMessages = messages.map((message) => {
                    utils_1.logger.info({ message }, "Incoming message");
                    return Object.assign(Object.assign({}, (0, utils_1.transformPrisma)(message)), { remoteJid: message.key.remoteJid, id: message.key.id, sessionId });
                });
                yield tx.message.createMany({
                    data: processedMessages,
                });
                (0, utils_1.emitEvent)("messages.upsert", sessionId, { messages: processedMessages });
            }));
            utils_1.logger.info({ messages: messages.length }, "Synced messages");
        }
        catch (e) {
            utils_1.logger.error(e, "An error occurred during messages set");
            (0, utils_1.emitEvent)("messages.upsert", sessionId, undefined, "error", `An error occurred during messages set: ${e.message}`);
        }
    });
    const upsert = (_a) => __awaiter(this, [_a], void 0, function* ({ messages, type }) {
        switch (type) {
            case "append":
            case "notify":
                for (const message of messages) {
                    try {
                        const jid = (0, baileys_1.jidNormalizedUser)(message.key.remoteJid);
                        const data = (0, utils_1.transformPrisma)(message);
                        [
                            "statusMentions",
                            "messageAddOns",
                            "statusMentionSources",
                            "supportAiCitations",
                        ].forEach((key) => {
                            if (Object.hasOwn(data, key))
                                delete data[key];
                        });
                        yield model.upsert({
                            select: { pkId: true },
                            create: Object.assign(Object.assign({}, data), { remoteJid: jid, id: message.key.id, sessionId }),
                            update: Object.assign({}, data),
                            where: {
                                sessionId_remoteJid_id: {
                                    remoteJid: jid,
                                    id: message.key.id,
                                    sessionId,
                                },
                            },
                        });
                        (0, utils_1.emitEvent)("messages.upsert", sessionId, { messages: data });
                        const chatExists = (yield database_1.prisma.chat.count({ where: { id: jid, sessionId } })) > 0;
                        if (type === "notify" && !chatExists) {
                            event.emit("chats.upsert", [
                                {
                                    id: jid,
                                    conversationTimestamp: (0, baileys_1.toNumber)(message.messageTimestamp),
                                    unreadCount: 1,
                                },
                            ]);
                        }
                    }
                    catch (e) {
                        utils_1.logger.error(e, "An error occurred during message upsert");
                        (0, utils_1.emitEvent)("messages.upsert", sessionId, undefined, "error", `An error occurred during message upsert: ${e.message}`);
                    }
                }
                break;
        }
    });
    const update = (updates) => __awaiter(this, void 0, void 0, function* () {
        for (const { update, key } of updates) {
            try {
                yield database_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const prevData = yield tx.message.findFirst({
                        where: { id: key.id, remoteJid: key.remoteJid, sessionId },
                    });
                    if (!prevData) {
                        return utils_1.logger.info({ update }, "Got update for non existent message");
                    }
                    const data = Object.assign(Object.assign({}, prevData), update);
                    yield tx.message.delete({
                        select: { pkId: true },
                        where: {
                            sessionId_remoteJid_id: {
                                id: key.id,
                                remoteJid: key.remoteJid,
                                sessionId,
                            },
                        },
                    });
                    const processedMessage = Object.assign(Object.assign({}, (0, utils_1.transformPrisma)(data)), { id: data.key.id, remoteJid: data.key.remoteJid, sessionId });
                    yield tx.message.create({
                        select: { pkId: true },
                        data: processedMessage,
                    });
                    (0, utils_1.emitEvent)("messages.update", sessionId, { messages: processedMessage });
                }));
            }
            catch (e) {
                utils_1.logger.error(e, "An error occurred during message update");
                (0, utils_1.emitEvent)("messages.update", sessionId, undefined, "error", `An error occurred during message update: ${e.message}`);
            }
        }
    });
    const del = (item) => __awaiter(this, void 0, void 0, function* () {
        try {
            if ("all" in item) {
                yield database_1.prisma.message.deleteMany({ where: { remoteJid: item.jid, sessionId } });
                (0, utils_1.emitEvent)("messages.delete", sessionId, { message: item });
                return;
            }
            const jid = item.keys[0].remoteJid;
            yield database_1.prisma.message.deleteMany({
                where: { id: { in: item.keys.map((k) => k.id) }, remoteJid: jid, sessionId },
            });
            (0, utils_1.emitEvent)("messages.delete", sessionId, { message: item });
        }
        catch (e) {
            utils_1.logger.error(e, "An error occurred during message delete");
            (0, utils_1.emitEvent)("messages.delete", sessionId, undefined, "error", `An error occurred during message delete: ${e.message}`);
        }
    });
    const updateReceipt = (updates) => __awaiter(this, void 0, void 0, function* () {
        for (const { key, receipt } of updates) {
            try {
                yield database_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const message = yield tx.message.findFirst({
                        select: { userReceipt: true },
                        where: { id: key.id, remoteJid: key.remoteJid, sessionId },
                    });
                    if (!message) {
                        return utils_1.logger.debug({ update }, "Got receipt update for non existent message");
                    }
                    let userReceipt = (message.userReceipt ||
                        []);
                    const recepient = userReceipt.find((m) => m.userJid === receipt.userJid);
                    if (recepient) {
                        userReceipt = [
                            ...userReceipt.filter((m) => m.userJid !== receipt.userJid),
                            receipt,
                        ];
                    }
                    else {
                        userReceipt.push(receipt);
                    }
                    yield tx.message.update({
                        select: { pkId: true },
                        data: (0, utils_1.transformPrisma)({ userReceipt: userReceipt }),
                        where: {
                            sessionId_remoteJid_id: {
                                id: key.id,
                                remoteJid: key.remoteJid,
                                sessionId,
                            },
                        },
                    });
                    (0, utils_1.emitEvent)("message-receipt.update", sessionId, { message: { key, receipt } });
                }));
            }
            catch (e) {
                utils_1.logger.error(e, "An error occurred during message receipt update");
                (0, utils_1.emitEvent)("message-receipt.update", sessionId, undefined, "error", `An error occurred during message receipt update: ${e.message}`);
            }
        }
    });
    const updateReaction = (reactions) => __awaiter(this, void 0, void 0, function* () {
        for (const { key, reaction } of reactions) {
            try {
                yield database_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const message = yield tx.message.findFirst({
                        select: { reactions: true },
                        where: { id: key.id, remoteJid: key.remoteJid, sessionId },
                    });
                    if (!message) {
                        return utils_1.logger.debug({ update }, "Got reaction update for non existent message");
                    }
                    const authorID = getKeyAuthor(reaction.key);
                    const reactions = (message.reactions || []).filter((r) => getKeyAuthor(r.key) !== authorID);
                    if (reaction.text)
                        reactions.push(reaction);
                    yield tx.message.update({
                        select: { pkId: true },
                        data: (0, utils_1.transformPrisma)({ reactions: reactions }),
                        where: {
                            sessionId_remoteJid_id: {
                                id: key.id,
                                remoteJid: key.remoteJid,
                                sessionId,
                            },
                        },
                    });
                    (0, utils_1.emitEvent)("messages.reaction", sessionId, { message: { key, reaction } });
                }));
            }
            catch (e) {
                utils_1.logger.error(e, "An error occurred during message reaction update");
                (0, utils_1.emitEvent)("messages.reaction", sessionId, undefined, "error", `An error occurred during message reaction update: ${e.message}`);
            }
        }
    });
    const listen = () => {
        if (listening)
            return;
        event.on("messaging-history.set", set);
        event.on("messages.upsert", upsert);
        event.on("messages.update", update);
        event.on("messages.delete", del);
        event.on("message-receipt.update", updateReceipt);
        event.on("messages.reaction", updateReaction);
        listening = true;
    };
    const unlisten = () => {
        if (!listening)
            return;
        event.off("messaging-history.set", set);
        event.off("messages.upsert", upsert);
        event.off("messages.update", update);
        event.off("messages.delete", del);
        event.off("message-receipt.update", updateReceipt);
        event.off("messages.reaction", updateReaction);
        listening = false;
    };
    return { listen, unlisten };
}
