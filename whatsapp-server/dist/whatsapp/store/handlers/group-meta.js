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
exports.default = groupMetadataHandler;
const utils_1 = require("../../../utils");
const database_1 = require("../../../config/database");
const library_1 = require("@prisma/client/runtime/library");
function groupMetadataHandler(sessionId, event) {
    const model = database_1.prisma.groupMetadata;
    let listening = false;
    const upsert = (groups) => __awaiter(this, void 0, void 0, function* () {
        try {
            const results = [];
            yield Promise.any(groups
                .map((g) => (0, utils_1.transformPrisma)(g))
                .map((data) => {
                model.upsert({
                    select: { pkId: true },
                    create: Object.assign(Object.assign({}, data), { sessionId }),
                    update: data,
                    where: { sessionId_id: { id: data.id, sessionId } },
                });
                results.push(data);
            }));
            (0, utils_1.emitEvent)("groups.upsert", sessionId, { groups: results });
        }
        catch (e) {
            utils_1.logger.error(e, "An error occurred during groups upsert");
            (0, utils_1.emitEvent)("groups.upsert", sessionId, undefined, "error", `An error occurred during groups upsert: ${e.message}`);
        }
    });
    const update = (updates) => __awaiter(this, void 0, void 0, function* () {
        for (const update of updates) {
            try {
                const data = (0, utils_1.transformPrisma)(update);
                yield model.update({
                    select: { pkId: true },
                    data: data,
                    where: { sessionId_id: { id: update.id, sessionId } },
                });
                (0, utils_1.emitEvent)("groups.update", sessionId, { groups: data });
            }
            catch (e) {
                if (e instanceof library_1.PrismaClientKnownRequestError && e.code === "P2025")
                    return utils_1.logger.info({ update }, "Got metadata update for non existent group");
                utils_1.logger.error(e, "An error occurred during group metadata update");
                (0, utils_1.emitEvent)("groups.update", sessionId, undefined, "error", `An error occurred during group metadata update: ${e.message}`);
            }
        }
    });
    const updateParticipant = (_a) => __awaiter(this, [_a], void 0, function* ({ id, action, participants, }) {
        var _b;
        try {
            const metadata = ((yield model.findFirst({
                select: { participants: true },
                where: { id, sessionId },
            })) || []);
            if (!metadata) {
                return utils_1.logger.info({ update: { id, action, participants } }, "Got participants update for non existent group");
            }
            if (!metadata.participants) {
                metadata.participants = [];
            }
            switch (action) {
                case "add":
                    metadata.participants.push(...participants.map((id) => ({
                        id,
                        admin: null,
                        isAdmin: false,
                        isSuperAdmin: false,
                    })));
                    break;
                case "demote":
                case "promote":
                    for (const participant of metadata.participants) {
                        if (participants.includes(participant.id)) {
                            participant.admin = action === "promote" ? "admin" : null;
                            participant.isAdmin = action === "promote";
                        }
                    }
                    break;
                case "remove":
                    metadata.participants = (_b = metadata.participants) === null || _b === void 0 ? void 0 : _b.filter((p) => !participants.includes(p.id));
                    break;
            }
            const processedParticipants = (0, utils_1.transformPrisma)({ participants: metadata.participants });
            yield model.update({
                select: { pkId: true },
                data: processedParticipants,
                where: { sessionId_id: { id, sessionId } },
            });
            (0, utils_1.emitEvent)("group-participants.update", sessionId, {
                groupId: id,
                action,
                participants,
            });
        }
        catch (e) {
            utils_1.logger.error(e, "An error occurred during group participants update");
            (0, utils_1.emitEvent)("group-participants.update", sessionId, undefined, "error", `An error occurred during group participants update: ${e.message}`);
        }
    });
    const listen = () => {
        if (listening)
            return;
        event.on("groups.upsert", upsert);
        event.on("groups.update", update);
        event.on("group-participants.update", updateParticipant);
        listening = true;
    };
    const unlisten = () => {
        if (!listening)
            return;
        event.off("groups.upsert", upsert);
        event.off("groups.update", update);
        event.off("group-participants.update", updateParticipant);
        listening = false;
    };
    return { listen, unlisten };
}
