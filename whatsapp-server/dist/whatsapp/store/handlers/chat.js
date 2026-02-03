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
exports.default = chatHandler;
const utils_1 = require("../../../utils");
const database_1 = require("../../../config/database");
const library_1 = require("@prisma/client/runtime/library");
function chatHandler(sessionId, event) {
    const model = database_1.prisma.chat;
    let listening = false;
    const set = (_a) => __awaiter(this, [_a], void 0, function* ({ chats, isLatest }) {
        try {
            yield database_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                if (isLatest)
                    yield tx.chat.deleteMany({ where: { sessionId } });
                const existingIds = (yield tx.chat.findMany({
                    select: { id: true },
                    where: { id: { in: chats.map((c) => c.id) }, sessionId },
                })).map((i) => i.id);
                const processedChats = chats
                    .filter((c) => !existingIds.includes(c.id))
                    .map((c) => (Object.assign(Object.assign({}, (0, utils_1.transformPrisma)(c)), { sessionId })));
                const chatsAdded = (yield tx.chat.createMany({
                    data: processedChats,
                })).count;
                utils_1.logger.info({ chatsAdded }, "Synced chats");
                (0, utils_1.emitEvent)("chats.set", sessionId, { chats: processedChats });
            }));
        }
        catch (e) {
            utils_1.logger.error(e, "An error occurred during chats set");
            (0, utils_1.emitEvent)("chats.set", sessionId, undefined, "error", `An error occurred during chats set: ${e.message}`);
        }
    });
    const upsert = (chats) => __awaiter(this, void 0, void 0, function* () {
        try {
            const results = [];
            yield Promise.all(chats
                .map((c) => (0, utils_1.transformPrisma)(c))
                .map((data) => __awaiter(this, void 0, void 0, function* () {
                yield model.upsert({
                    select: { pkId: true },
                    create: Object.assign(Object.assign({}, data), { sessionId }),
                    update: data,
                    where: { sessionId_id: { id: data.id, sessionId } },
                });
                results.push(data);
            })));
            (0, utils_1.emitEvent)("chats.upsert", sessionId, { chats: results });
        }
        catch (e) {
            utils_1.logger.error(e, "An error occurred during chats upsert");
            (0, utils_1.emitEvent)("chats.upsert", sessionId, undefined, "error", `An error occurred during chats upsert: ${e.message}`);
        }
    });
    const update = (updates) => __awaiter(this, void 0, void 0, function* () {
        for (const update of updates) {
            try {
                const data = (0, utils_1.transformPrisma)(update);
                const existingChat = yield model.findUnique({
                    where: { sessionId_id: { id: update.id, sessionId } },
                });
                if (!existingChat) {
                    utils_1.logger.info({ update }, "Chat not found, skipping update");
                    continue;
                }
                yield model.update({
                    select: { pkId: true },
                    data: Object.assign(Object.assign({}, data), { unreadCount: typeof data.unreadCount === "number"
                            ? data.unreadCount > 0
                                ? { increment: data.unreadCount }
                                : { set: data.unreadCount }
                            : undefined }),
                    where: { sessionId_id: { id: update.id, sessionId } },
                });
                (0, utils_1.emitEvent)("chats.update", sessionId, { chats: data });
            }
            catch (e) {
                if (e instanceof library_1.PrismaClientKnownRequestError && e.code === "P2025") {
                    return utils_1.logger.info({ update }, "Got update for non existent chat");
                }
                (0, utils_1.emitEvent)("chats.update", sessionId, undefined, "error", `An error occurred during chat update: ${e.message}`);
                utils_1.logger.error(e, "An error occurred during chat update");
            }
        }
    });
    const del = (ids) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield model.deleteMany({
                where: { id: { in: ids } },
            });
            (0, utils_1.emitEvent)("chats.delete", sessionId, { chats: ids });
        }
        catch (e) {
            utils_1.logger.error(e, "An error occurred during chats delete");
            (0, utils_1.emitEvent)("chats.delete", sessionId, undefined, "error", `An error occurred during chats delete: ${e.message}`);
        }
    });
    const listen = () => {
        if (listening)
            return;
        event.on("messaging-history.set", set);
        event.on("chats.upsert", upsert);
        event.on("chats.update", update);
        event.on("chats.delete", del);
        listening = true;
    };
    const unlisten = () => {
        if (!listening)
            return;
        event.off("messaging-history.set", set);
        event.off("chats.upsert", upsert);
        event.off("chats.update", update);
        event.off("chats.delete", del);
        listening = false;
    };
    return { listen, unlisten };
}
