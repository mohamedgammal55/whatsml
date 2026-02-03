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
exports.useSession = useSession;
const baileys_1 = require("baileys");
const baileys_2 = require("baileys");
const database_1 = require("../../config/database");
const utils_1 = require("../../utils");
const library_1 = require("@prisma/client/runtime/library");
const fixId = (id) => id.replace(/\//g, "__").replace(/:/g, "-");
function useSession(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = database_1.prisma.session;
        const write = (data, id) => __awaiter(this, void 0, void 0, function* () {
            try {
                data = JSON.stringify(data, baileys_2.BufferJSON.replacer);
                id = fixId(id);
                yield model.upsert({
                    select: { pkId: true },
                    create: { data, id, sessionId },
                    update: { data },
                    where: { sessionId_id: { id, sessionId } },
                });
            }
            catch (e) {
                utils_1.logger.error(e, "An error occurred during session write");
            }
        });
        const read = (id) => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield model.findUnique({
                    select: { data: true },
                    where: { sessionId_id: { id: fixId(id), sessionId } },
                });
                if (!result) {
                    utils_1.logger.info({ id }, "Trying to read non existent session data");
                    return null;
                }
                return JSON.parse(result.data, baileys_2.BufferJSON.reviver);
            }
            catch (e) {
                if (e instanceof library_1.PrismaClientKnownRequestError && e.code === "P2025") {
                    utils_1.logger.info({ id }, "Trying to read non existent session data");
                }
                else {
                    utils_1.logger.error(e, "An error occurred during session read");
                }
                return null;
            }
        });
        const del = (id) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield model.delete({
                    select: { pkId: true },
                    where: { sessionId_id: { id: fixId(id), sessionId } },
                });
            }
            catch (e) {
                utils_1.logger.error(e, "An error occurred during session delete");
            }
        });
        const creds = (yield read("creds")) || (0, baileys_2.initAuthCreds)();
        return {
            state: {
                creds,
                keys: {
                    get: (type, ids) => __awaiter(this, void 0, void 0, function* () {
                        const data = {};
                        yield Promise.all(ids.map((id) => __awaiter(this, void 0, void 0, function* () {
                            let value = yield read(`${type}-${id}`);
                            if (type === "app-state-sync-key" && value) {
                                value = baileys_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })));
                        return data;
                    }),
                    set: (data) => __awaiter(this, void 0, void 0, function* () {
                        const tasks = [];
                        for (const category in data) {
                            for (const id in data[category]) {
                                const value = data[category][id];
                                const sId = `${category}-${id}`;
                                tasks.push(value ? write(value, sId) : del(sId));
                            }
                        }
                        yield Promise.all(tasks);
                    }),
                },
            },
            saveCreds: () => write(creds, "creds"),
        };
    });
}
