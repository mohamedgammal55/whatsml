"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sessionValidator;
const service_1 = __importDefault(require("../whatsapp/service"));
function sessionValidator(req, res, next) {
    if (!service_1.default.sessionExists(req.params.sessionId))
        return res.status(404).json({ error: "Session not found" });
    next();
}
