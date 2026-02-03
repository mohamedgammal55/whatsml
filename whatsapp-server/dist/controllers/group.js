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
exports.presence = exports.leave = exports.updateDescription = exports.updateSetting = exports.updateSubject = exports.updateParticipants = exports.create = exports.photo = exports.find = exports.list = void 0;
const utils_1 = require("../utils");
const misc_1 = require("./misc");
const database_1 = require("../config/database");
const service_1 = __importDefault(require("../whatsapp/service"));
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { cursor = undefined, limit = 25, search } = req.query;
        const groups = yield database_1.prisma.contact.findMany({
            cursor: cursor ? { pkId: Number(cursor) } : undefined,
            take: Number(limit),
            skip: cursor ? 1 : 0,
            where: {
                id: { endsWith: "g.us" },
                sessionId,
                OR: [
                    {
                        name: {
                            contains: String(search),
                        },
                    },
                ],
            },
        });
        res.status(200).json({
            data: groups,
            cursor: groups.length !== 0 && groups.length === Number(limit)
                ? groups[groups.length - 1].pkId
                : null,
        });
    }
    catch (e) {
        const message = "An error occurred during group list";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.list = list;
const find = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const session = service_1.default.getSession(sessionId);
        const data = yield session.groupMetadata(jid);
        res.status(200).json(data);
    }
    catch (e) {
        const message = "An error occurred during group metadata fetch";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.find = find;
exports.photo = (0, misc_1.makePhotoURLHandler)("group");
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = service_1.default.getSession(req.params.sessionId);
        const { subject, participants } = req.body;
        if (!Array.isArray(participants) || participants.length < 1) {
            return res
                .status(400)
                .json({ error: "Participants must be an array and have at least 1 members" });
        }
        else if (subject.length > 100) {
            return res.status(400).json({ error: "Subject must be less than 100 characters" });
        }
        const listNumbersNotExists = [];
        participants.forEach((participant) => __awaiter(void 0, void 0, void 0, function* () {
            const exists = yield service_1.default.jidExists(session, participant);
            if (!exists) {
                listNumbersNotExists.push(participant);
            }
        }));
        const data = yield session.groupCreate(subject, participants);
        res.status(200).json({
            data,
            error: listNumbersNotExists.length > 0
                ? `The following numbers do not exist: ${listNumbersNotExists.join(", ")}`
                : null,
        });
    }
    catch (e) {
        const message = "An error occurred during group creation";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.create = create;
const updateParticipants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const session = service_1.default.getSession(sessionId);
        const { participants, action = "add" } = req.body;
        if (!Array.isArray(participants) || participants.length < 1) {
            return res
                .status(400)
                .json({ error: "Participants must be an array and have at least 1 members" });
        }
        const listNumbersNotExists = [];
        participants.forEach((participant) => __awaiter(void 0, void 0, void 0, function* () {
            const exists = yield service_1.default.jidExists(session, participant);
            if (!exists) {
                listNumbersNotExists.push(participant);
            }
        }));
        const data = yield session.groupParticipantsUpdate(jid, participants, action);
        res.status(200).json({
            data,
            error: listNumbersNotExists.length > 0
                ? `The following numbers do not exist: ${listNumbersNotExists.join(", ")}`
                : null,
        });
    }
    catch (e) {
        const message = "An error occurred during group participants update";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.updateParticipants = updateParticipants;
const updateSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const session = service_1.default.getSession(sessionId);
        const { subject } = req.body;
        if (subject.length > 100) {
            return res.status(400).json({ error: "Subject must be less than 100 characters" });
        }
        yield session.groupUpdateSubject(jid, subject);
        res.status(200).json({
            message: "Group subject updated",
        });
    }
    catch (e) {
        const message = "An error occurred during group subject update";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.updateSubject = updateSubject;
const updateSetting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const session = service_1.default.getSession(sessionId);
        const { action } = req.body;
        yield session.groupSettingUpdate(jid, action);
        res.status(200).json({
            message: "Group setting updated",
        });
    }
    catch (e) {
        const message = "An error occurred during group setting update";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.updateSetting = updateSetting;
const updateDescription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const session = service_1.default.getSession(sessionId);
        const { description } = req.body;
        yield session.groupUpdateDescription(jid, description);
        res.status(200).json({
            message: "Group description updated",
        });
    }
    catch (e) {
        const message = "An error occurred during group subject update";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.updateDescription = updateDescription;
const leave = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, jid } = req.params;
        const session = service_1.default.getSession(sessionId);
        yield session.groupLeave(jid);
        res.status(200).json({
            message: "Group leaved",
        });
    }
    catch (e) {
        const message = "An error occurred during group leave";
        utils_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
});
exports.leave = leave;
exports.presence = (0, misc_1.presenceHandler)("group");
