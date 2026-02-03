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
exports.default = contactHandler;
const utils_1 = require("../../../utils");
const database_1 = require("../../../config/database");
const library_1 = require("@prisma/client/runtime/library");
function contactHandler(sessionId, event) {
    const model = database_1.prisma.contact;
    let listening = false;
    const set = (_a) => __awaiter(this, [_a], void 0, function* ({ contacts }) {
        try {
            const processedContacts = contacts.map((c) => (0, utils_1.transformPrisma)(c));
            const upsertPromises = processedContacts.map((data) => model.upsert({
                select: { pkId: true },
                create: Object.assign(Object.assign({}, data), { sessionId }),
                update: data,
                where: { sessionId_id: { id: data.id, sessionId } },
            }));
            yield Promise.any([
                ...upsertPromises,
            ]);
            utils_1.logger.info({ newContacts: contacts.length }, "Synced contacts");
            (0, utils_1.emitEvent)("contacts.set", sessionId, { contacts: processedContacts });
        }
        catch (e) {
            utils_1.logger.error(e, "An error occurred during contacts set");
            (0, utils_1.emitEvent)("contacts.set", sessionId, undefined, "error", `An error occurred during contacts set: ${e.message}`);
        }
    });
    const upsert = (contacts) => __awaiter(this, void 0, void 0, function* () {
        try {
            console.info(`Received ${contacts.length} contacts for upsert.`);
            console.info(contacts[0]);
            if (contacts.length === 0) {
                return;
            }
            const processedContacts = contacts
                .map((contact) => (0, utils_1.transformPrisma)(contact))
                .map((contact) => (Object.assign(Object.assign({}, contact), { sessionId })));
            yield model.createMany({
                data: processedContacts,
                skipDuplicates: true,
            });
            (0, utils_1.emitEvent)("contacts.upsert", sessionId, { contacts: processedContacts });
        }
        catch (error) {
            utils_1.logger.error("An unexpected error occurred during contacts upsert", error);
            (0, utils_1.emitEvent)("contacts.upsert", sessionId, undefined, "error", `An unexpected error occurred during contacts upsert: ${error.message}`);
        }
    });
    const update = (updates) => __awaiter(this, void 0, void 0, function* () {
        for (const update of updates) {
            try {
                const data = (0, utils_1.transformPrisma)(update);
                yield model.update({
                    select: { pkId: true },
                    data,
                    where: {
                        sessionId_id: { id: update.id, sessionId },
                    },
                });
                (0, utils_1.emitEvent)("contacts.update", sessionId, { contacts: data });
            }
            catch (e) {
                if (e instanceof library_1.PrismaClientKnownRequestError && e.code === "P2025") {
                    return utils_1.logger.info({ update }, "Got update for non existent contact");
                }
                utils_1.logger.error(e, "An error occurred during contact update");
                (0, utils_1.emitEvent)("contacts.update", sessionId, undefined, "error", `An error occurred during contact update: ${e.message}`);
            }
        }
    });
    const listen = () => {
        if (listening)
            return;
        event.on("messaging-history.set", set);
        event.on("contacts.upsert", upsert);
        event.on("contacts.update", update);
        listening = true;
    };
    const unlisten = () => {
        if (!listening)
            return;
        event.off("messaging-history.set", set);
        event.off("contacts.upsert", upsert);
        event.off("contacts.update", update);
        listening = false;
    };
    return { listen, unlisten };
}
