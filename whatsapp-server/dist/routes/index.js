"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chats_1 = __importDefault(require("./chats"));
const groups_1 = __importDefault(require("./groups"));
const messages_1 = __importDefault(require("./messages"));
const sessions_1 = __importDefault(require("./sessions"));
const contacts_1 = __importDefault(require("./contacts"));
const api_key_validator_1 = require("../middlewares/api-key-validator");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({
        status: "ok",
    });
});
router.use("/sessions", sessions_1.default);
router.use("/:sessionId/chats", api_key_validator_1.apiKeyValidator, chats_1.default);
router.use("/:sessionId/contacts", api_key_validator_1.apiKeyValidator, contacts_1.default);
router.use("/:sessionId/groups", api_key_validator_1.apiKeyValidator, groups_1.default);
router.use("/:sessionId/messages", api_key_validator_1.apiKeyValidator, messages_1.default);
exports.default = router;
